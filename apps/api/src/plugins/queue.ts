import { Queue, QueueOptions } from 'bullmq';
import { getRedis } from './redis';

const defaultQueueOptions: QueueOptions = {
  connection: getRedis() as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
};

// Queue name constants — use these everywhere to avoid typos
export const QUEUE_NAMES = {
  LISTING_EXPIRY: 'listing-expiry',
  NO_SHOW_AUTOMATION: 'no-show-automation',
  PAYOUT_SETTLEMENT: 'payout-settlement',
  PICKUP_REMINDER: 'pickup-reminder',
  NOTIFICATION_DISPATCH: 'notification-dispatch',
  PENDING_PAYMENT_EXPIRY: 'pending-payment-expiry',
  NO_SHOW_SUSPENSION: 'no-show-suspension-check',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Individual queue instances
export const listingExpiryQueue = new Queue(QUEUE_NAMES.LISTING_EXPIRY, defaultQueueOptions);

export const noShowAutomationQueue = new Queue(
  QUEUE_NAMES.NO_SHOW_AUTOMATION,
  defaultQueueOptions,
);

export const payoutSettlementQueue = new Queue(
  QUEUE_NAMES.PAYOUT_SETTLEMENT,
  defaultQueueOptions,
);

export const pickupReminderQueue = new Queue(QUEUE_NAMES.PICKUP_REMINDER, defaultQueueOptions);

export const notificationDispatchQueue = new Queue(QUEUE_NAMES.NOTIFICATION_DISPATCH, {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 5, // Higher retry for notifications
  },
});

export const pendingPaymentExpiryQueue = new Queue(
  QUEUE_NAMES.PENDING_PAYMENT_EXPIRY,
  defaultQueueOptions,
);

export const noShowSuspensionQueue = new Queue(
  QUEUE_NAMES.NO_SHOW_SUSPENSION,
  defaultQueueOptions,
);

// Convenience map for dynamic lookup
export const queues: Record<QueueName, Queue> = {
  [QUEUE_NAMES.LISTING_EXPIRY]: listingExpiryQueue,
  [QUEUE_NAMES.NO_SHOW_AUTOMATION]: noShowAutomationQueue,
  [QUEUE_NAMES.PAYOUT_SETTLEMENT]: payoutSettlementQueue,
  [QUEUE_NAMES.PICKUP_REMINDER]: pickupReminderQueue,
  [QUEUE_NAMES.NOTIFICATION_DISPATCH]: notificationDispatchQueue,
  [QUEUE_NAMES.PENDING_PAYMENT_EXPIRY]: pendingPaymentExpiryQueue,
  [QUEUE_NAMES.NO_SHOW_SUSPENSION]: noShowSuspensionQueue,
};

export async function closeQueues(): Promise<void> {
  await Promise.all(Object.values(queues).map((q) => q.close()));
}
