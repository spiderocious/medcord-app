export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  field_errors?: Record<string, string[]>;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
