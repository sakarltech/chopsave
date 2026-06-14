import { PaymentGateway, PaymentMethod, PaymentStatus } from '../enums';

export { PaymentGateway, PaymentMethod, PaymentStatus };

export interface Payment {
  id: string;
  reservationId: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayRef: string | null;
  gatewayMeta: Record<string, unknown> | null;
  initiatedAt: Date;
  confirmedAt: Date | null;
  refundedAt: Date | null;
  refundRef: string | null;
}
