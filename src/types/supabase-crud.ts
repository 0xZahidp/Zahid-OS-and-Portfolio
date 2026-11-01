export interface TableColumnMeta {
  name: string;
  type: string;
  format?: string;
  isPrimaryKey: boolean;
  isRequired: boolean;
  defaultValue?: string;
}

export interface TableMeta {
  name: string;
  rowCount: number;
  primaryKey: string;
  columns: TableColumnMeta[];
  hasPermission: boolean;
  permissionError?: string;
  grantHint?: string;
}

export interface CrudQueryParams {
  table: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CrudResponse<T = Record<string, unknown>> {
  success: boolean;
  table: string;
  rows: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  columns: TableColumnMeta[];
  primaryKey: string;
  hasPermission: boolean;
  error?: string;
  hint?: string;
  source?: 'supabase' | 'local_fallback';
}
