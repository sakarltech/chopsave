import { DisputeReason, DisputeStatus } from '../enums';

export { DisputeReason, DisputeStatus };

export interface Dispute {
  id: string;
  reservationId: string;
  raisedBy: string;
  reason: DisputeReason;
  description: string | null;
  status: DisputeStatus;
  resolutionNote: string | null;
  resolvedBy: string | null;
  raisedAt: Date;
  resolvedAt: Date | null;
}
