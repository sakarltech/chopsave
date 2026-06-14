import { PayoutStatus, PaymentGateway } from '../enums';

export { PayoutStatus };

export interface BankAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  last4: string;
}

export interface Payout {
  id: string;
  businessId: string;
  amount: number;
  status: PayoutStatus;
  bankAccount: BankAccount;
  gateway: PaymentGateway;
  gatewayRef: string | null;
  failureReason: string | null;
  requestedAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
}
