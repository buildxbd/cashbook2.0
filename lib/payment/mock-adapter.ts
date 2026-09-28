import { isLiveUPIEnabled } from '@/lib/config/features';
import {
  PaymentAdapter,
  UPIPaymentRequest,
  UPIPaymentResponse,
  VpaVerificationResult,
} from './types';

/**
 * Mock UPI Payment Engine Adapter
 * 
 * Simulates NPCI Unified Payments Interface (UPI) flows for local development,
 * end-to-end testing, and offline sandbox environments.
 * Active when NEXT_PUBLIC_ENABLE_LIVE_UPI = false.
 */
export class MockPaymentAdapter implements PaymentAdapter {
  private readonly isMock = true;

  /**
   * Generates a 12-digit numeric NPCI Retrieval Reference Number (RRN)
   */
  private generateRrn(): string {
    const prefix = '4'; // NPCI typical test prefix
    const randomDigits = Math.floor(10000000000 + Math.random() * 90000000000).toString();
    return (prefix + randomDigits).substring(0, 12);
  }

  /**
   * Helper to simulate network latency for realistic testing
   */
  private async simulateNetworkDelay(ms: number = 350): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Verifies Virtual Payment Address (VPA) / UPI ID format and simulated existence
   */
  async verifyVpa(vpa: string): Promise<VpaVerificationResult> {
    await this.simulateNetworkDelay(200);

    const trimmedVpa = vpa.trim().toLowerCase();
    const vpaRegex = /^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/;

    if (!vpaRegex.test(trimmedVpa) || trimmedVpa.includes('invalid')) {
      return {
        isValid: false,
        vpa: trimmedVpa,
        statusMessage: 'Invalid VPA format or virtual address does not exist',
      };
    }

    const [handle, psp] = trimmedVpa.split('@');
    const formattedName = handle
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return {
      isValid: true,
      vpa: trimmedVpa,
      accountHolderName: `${formattedName || 'Verified Merchant'} Enterprise`,
      bankName: `${psp.toUpperCase()} Bank Virtual Node`,
      statusMessage: 'VPA verified successfully',
    };
  }

  /**
   * Initiates a mock UPI payment transaction with deterministic testing support
   */
  async initiatePayment(request: UPIPaymentRequest): Promise<UPIPaymentResponse> {
    await this.simulateNetworkDelay(400);

    const upiRefNumber = this.generateRrn();
    const timestamp = new Date().toISOString();

    // Check for simulated failure scenarios
    const payeeVpa = request.payeeVpa.toLowerCase();
    const note = (request.note ?? '').toUpperCase();

    if (payeeVpa.includes('fail') || note.includes('FAIL_TEST')) {
      return {
        success: false,
        status: 'FAILED',
        upiRefNumber,
        amount: request.amount,
        payerVpa: request.payerVpa ?? 'business@upi',
        payeeVpa: request.payeeVpa,
        timestamp,
        failureReason: 'BANK_DECLINED: Transaction declined by issuing bank (Simulated U16)',
        transactionId: request.transactionId,
        metadata: {
          adapter: 'MockPaymentAdapter',
          isMock: true,
          errorCode: 'U16',
        },
      };
    }

    if (note.includes('PENDING_TEST')) {
      return {
        success: false,
        status: 'PENDING',
        upiRefNumber,
        amount: request.amount,
        payerVpa: request.payerVpa ?? 'business@upi',
        payeeVpa: request.payeeVpa,
        timestamp,
        failureReason: 'BANK_TIMEOUT: Awaiting settlement response from NPCI switch',
        transactionId: request.transactionId,
        metadata: {
          adapter: 'MockPaymentAdapter',
          isMock: true,
          statusNote: 'Requires status polling or webhook confirmation',
        },
      };
    }

    // Default: Successful Instant Settlement
    return {
      success: true,
      status: 'SUCCESS',
      upiRefNumber,
      amount: request.amount,
      payerVpa: request.payerVpa ?? 'business.wallet@okhdfcbank',
      payeeVpa: request.payeeVpa,
      timestamp,
      transactionId: request.transactionId,
      metadata: {
        adapter: 'MockPaymentAdapter',
        isMock: true,
        settlementType: 'INSTANT_UPI_2.0',
        responseCode: '00',
        responseMessage: 'Payment processed successfully',
      },
    };
  }

  /**
   * Checks current status of a previously initiated mock UPI transaction
   */
  async checkPaymentStatus(upiRefNumber: string): Promise<UPIPaymentResponse> {
    await this.simulateNetworkDelay(250);

    return {
      success: true,
      status: 'SUCCESS',
      upiRefNumber,
      amount: 0,
      payeeVpa: 'verified.merchant@upi',
      timestamp: new Date().toISOString(),
      metadata: {
        adapter: 'MockPaymentAdapter',
        isMock: true,
        reconciled: true,
      },
    };
  }

  /**
   * Simulates incoming UPI Webhook / Server-to-server callback
   */
  async simulateWebhook(payload: Record<string, unknown>): Promise<{ received: boolean }> {
    console.info('[MockPaymentAdapter] Webhook received:', payload);
    return { received: true };
  }

  /**
   * Verifies employee virtual wallet balance and spend limits for expenses
   */
  verifyWalletBalanceAndLimits(params: {
    walletId?: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    currentBalance: number;
    dailyLimit: number;
    dailySpent: number;
    monthlyLimit: number;
    monthlySpent: number;
  }) {
    const { amount, type, currentBalance, dailyLimit, dailySpent, monthlyLimit, monthlySpent } = params;

    if (amount <= 0) {
      return {
        valid: false,
        reason: 'Invalid transaction amount: Amount must be greater than 0 BDT',
        newBalance: currentBalance,
        newDailySpent: dailySpent,
        newMonthlySpent: monthlySpent,
      };
    }

    if (type === 'INCOME') {
      return {
        valid: true,
        newBalance: currentBalance + amount,
        newDailySpent: dailySpent,
        newMonthlySpent: monthlySpent,
      };
    }

    // EXPENSE checks
    if (amount > currentBalance) {
      return {
        valid: false,
        reason: `Insufficient Virtual Wallet Balance: Available ৳${currentBalance.toLocaleString()}, Requested ৳${amount.toLocaleString()}`,
        newBalance: currentBalance,
        newDailySpent: dailySpent,
        newMonthlySpent: monthlySpent,
      };
    }

    if (dailySpent + amount > dailyLimit) {
      const remainingDaily = Math.max(0, dailyLimit - dailySpent);
      return {
        valid: false,
        reason: `Daily Spend Limit Exceeded: Remaining daily allowance is ৳${remainingDaily.toLocaleString()}, Requested ৳${amount.toLocaleString()} (Daily Cap: ৳${dailyLimit.toLocaleString()})`,
        newBalance: currentBalance,
        newDailySpent: dailySpent,
        newMonthlySpent: monthlySpent,
      };
    }

    if (monthlySpent + amount > monthlyLimit) {
      const remainingMonthly = Math.max(0, monthlyLimit - monthlySpent);
      return {
        valid: false,
        reason: `Monthly Spend Limit Exceeded: Remaining monthly allowance is ৳${remainingMonthly.toLocaleString()}, Requested ৳${amount.toLocaleString()} (Monthly Cap: ৳${monthlyLimit.toLocaleString()})`,
        newBalance: currentBalance,
        newDailySpent: dailySpent,
        newMonthlySpent: monthlySpent,
      };
    }

    return {
      valid: true,
      newBalance: currentBalance - amount,
      newDailySpent: dailySpent + amount,
      newMonthlySpent: monthlySpent + amount,
    };
  }
}

// Singleton instance
export const mockPaymentAdapter = new MockPaymentAdapter();

/**
 * Returns appropriate payment adapter depending on feature flag
 */
export function getPaymentAdapter(): PaymentAdapter {
  if (isLiveUPIEnabled()) {
    // In production when live gateway is configured, return live gateway adapter
    console.warn(
      '[PaymentAdapter] Live UPI is enabled via feature flag, but no live gateway provider is configured yet. Falling back to MockPaymentAdapter.'
    );
  }
  return mockPaymentAdapter;
}
