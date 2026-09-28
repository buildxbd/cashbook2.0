import { LedgerTransaction, CreateTransactionInput } from '@/lib/services/ledger-service';

const DB_NAME = 'CashBookOfflineDB';
const DB_VERSION = 1;
const QUEUE_STORE = 'pending_queue';
const CACHE_STORE = 'cached_transactions';

export interface PendingQueueItem {
  localId: string;
  data: CreateTransactionInput;
  timestamp: string;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
}

type SyncSubscriber = (status: SyncStatus) => void;

class OfflineSyncEngine {
  private db: IDBDatabase | null = null;
  private isSyncing = false;
  private lastSyncedAt: Date | null = null;
  private subscribers: Set<SyncSubscriber> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifySubscribers();
        this.syncPendingTransactions();
      });

      window.addEventListener('offline', () => {
        this.notifySubscribers();
      });

      // Listen to service worker trigger messages
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'TRIGGER_OFFLINE_SYNC') {
            this.syncPendingTransactions();
          }
        });
      }
    }
  }

  /**
   * Initializes IndexedDB database and object stores
   */
  async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB is not supported in this environment');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'localId' });
        }
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          const store = db.createObjectStore(CACHE_STORE, { keyPath: 'id' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Subscribes to connectivity and sync status updates
   */
  subscribe(callback: SyncSubscriber): () => void {
    this.subscribers.add(callback);
    this.notifySubscribers();
    return () => this.subscribers.delete(callback);
  }

  private async notifySubscribers() {
    const pending = await this.getPendingCount();
    const status: SyncStatus = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: this.isSyncing,
      pendingCount: pending,
      lastSyncedAt: this.lastSyncedAt,
    };
    this.subscribers.forEach((cb) => cb(status));
  }

  /**
   * Returns current count of offline queued items
   */
  async getPendingCount(): Promise<number> {
    try {
      const queue = await this.getPendingQueue();
      return queue.length;
    } catch {
      return 0;
    }
  }

  /**
   * Caches pending transaction to offline IndexedDB queue
   */
  async enqueueTransaction(data: CreateTransactionInput): Promise<PendingQueueItem> {
    const db = await this.getDB();
    const localId = `offline_tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const item: PendingQueueItem = {
      localId,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.put(item);

      req.onsuccess = () => {
        this.notifySubscribers();
        resolve(item);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves all items from pending queue
   */
  async getPendingQueue(): Promise<PendingQueueItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  /**
   * Removes item from pending queue once successfully synced to server
   */
  async dequeueTransaction(localId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.delete(localId);

      req.onsuccess = () => {
        this.notifySubscribers();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Caches active ledger transactions locally for instant offline rendering
   */
  async cacheTransactions(transactions: LedgerTransaction[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      const store = tx.objectStore(CACHE_STORE);

      for (const t of transactions) {
        store.put(t);
      }
    } catch (err) {
      console.warn('[SyncEngine] Failed to cache transactions in IndexedDB:', err);
    }
  }

  /**
   * Retrieves locally cached transactions when completely disconnected
   */
  async getCachedTransactions(bookId?: string): Promise<LedgerTransaction[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(CACHE_STORE, 'readonly');
        const store = tx.objectStore(CACHE_STORE);
        const req = store.getAll();

        req.onsuccess = () => {
          let list: LedgerTransaction[] = req.result || [];
          if (bookId) {
            list = list.filter((t) => t.bookId === bookId);
          }
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  /**
   * Executes background sync: posts all queued offline items sequentially to /api/transactions
   */
  async syncPendingTransactions(): Promise<{ syncedCount: number; errors: string[] }> {
    if (this.isSyncing) return { syncedCount: 0, errors: [] };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { syncedCount: 0, errors: ['Device is offline'] };
    }

    const queue = await this.getPendingQueue();
    if (queue.length === 0) return { syncedCount: 0, errors: [] };

    this.isSyncing = true;
    this.notifySubscribers();

    let syncedCount = 0;
    const errors: string[] = [];

    for (const item of queue) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });

        const data = await res.json();
        if (data.success) {
          await this.dequeueTransaction(item.localId);
          syncedCount++;
        } else {
          errors.push(data.error || 'Server rejected transaction');
        }
      } catch (err) {
        errors.push((err as Error).message || 'Network request failed');
        break; // Stop syncing if network dropped again
      }
    }

    this.isSyncing = false;
    this.lastSyncedAt = new Date();
    this.notifySubscribers();

    return { syncedCount, errors };
  }
}

// Global Singleton
export const syncEngine = new OfflineSyncEngine();
