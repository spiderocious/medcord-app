export type ReviewItemType =
  | 'lab_result'
  | 'vitals'
  | 'medication'
  | 'document'
  | 'discharge'
  | 'transfer';

export type ReviewItemStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export type ReviewItemPriority = 'routine' | 'urgent' | 'stat';

export interface ReviewItem {
  readonly id: string;
  readonly hospitalId: string;
  readonly patientId: string;
  readonly type: ReviewItemType;
  readonly referenceId: string;
  readonly title: string;
  readonly summary?: string;
  readonly priority: ReviewItemPriority;
  readonly status: ReviewItemStatus;
  readonly submittedBy: string;
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
  readonly reviewNote?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ReviewQueueResult {
  readonly items: readonly ReviewItem[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
