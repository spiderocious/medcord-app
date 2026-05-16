export type NotificationType =
  | 'lab_result_ready'
  | 'lab_result_abnormal'
  | 'transfer_request'
  | 'transfer_accepted'
  | 'transfer_declined'
  | 'review_item_submitted'
  | 'review_item_acted'
  | 'patient_admitted'
  | 'patient_discharged'
  | 'vitals_out_of_range'
  | 'general';

export interface Notification {
  readonly id: string;
  readonly hospitalId: string;
  readonly recipientId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly isRead: boolean;
  readonly readAt?: string;
  readonly createdAt: string;
}

export interface NotificationListResult {
  readonly items: readonly Notification[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
