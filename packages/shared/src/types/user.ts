import { UserRole, UserStatus } from '../enums';

export { UserRole, UserStatus };

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  dietaryPrefs: string[];
  fcmToken: string | null;
  notifPrefs: Record<string, boolean>;
  noShowCount: number;
  suspendedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
