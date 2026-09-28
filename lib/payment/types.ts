/**
 * UPI Native Payment Adapter Types
 */

export interface UPIPaymentRequest {
  transactionId?: string;
  amount: number;
  payerVpa?: string;
  payeeVpa: string;
  payeeName?: string;
  note?: string;
  referenceId?: string;
  category?: string;
}

export type UPIPaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REVERSED';

export interface UPIPaymentResponse {
  success: boolean;
  status: UPIPaymentStatus;
  upiRefNumber: string; // NPCI 12-digit Retrieval Reference Number (RRN)
  amount: number;
  payerVpa?: string;
  payeeVpa: string;
  timestamp: string;
  failureReason?: string;
  transactionId?: string;
  metadata?: Record<string, unknown>;
}

export interface VpaVerificationResult {
  isValid: boolean;
  vpa: string;
  accountHolderName?: string;
  bankName?: string;
  statusMessage?: string;
}

export interface WalletValidationParams {
  walletId?: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  currentBalance: number;
  dailyLimit: number;
  dailySpent: number;
  monthlyLimit: number;
  monthlySpent: number;
}

export interface WalletValidationResult {
  valid: boolean;
  reason?: string;
  newBalance: number;
  newDailySpent: number;
  newMonthlySpent: number;
}

export interface PaymentAdapter {
  initiatePayment(request: UPIPaymentRequest): Promise<UPIPaymentResponse>;
  verifyVpa(vpa: string): Promise<VpaVerificationResult>;
  checkPaymentStatus(upiRefNumber: string): Promise<UPIPaymentResponse>;
  verifyWalletBalanceAndLimits?(params: WalletValidationParams): WalletValidationResult;
  simulateWebhook?(payload: Record<string, unknown>): Promise<{ received: boolean }>;
}
