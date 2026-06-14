import { NotificationType, NotificationChannel } from '../enums';

export { NotificationType, NotificationChannel };

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  channel: NotificationChannel;
  read: boolean;
  sentAt: Date | null;
  createdAt: Date;
}
