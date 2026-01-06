import { ReactNode } from "react";

/**
 * Column definition for DataTable
 */
export interface DataTableColumn<T = any> {
  /** Unique key for the column */
  key: string;
  /** Column header label */
  header: string;
  /** Function to render cell content */
  cell: (row: T) => ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom width (e.g., "200px", "10%") */
  width?: string;
  /** Alignment: left, center, right */
  align?: "left" | "center" | "right";
  /** Whether to show on mobile (default: true) */
  mobile?: boolean;
}

/**
 * Filter definition for DataTable
 */
export interface DataTableFilter {
  /** Unique key for the filter */
  key: string;
  /** Filter label */
  label: string;
  /** Filter type */
  type: "select" | "boolean" | "text" | "date";
  /** Options for select type */
  options?: Array<{ label: string; value: string }>;
  /** Default value */
  defaultValue?: string | boolean;
  /** Placeholder for text inputs */
  placeholder?: string;
}

/**
 * Sort configuration
 */
export interface DataTableSort {
  /** Column key to sort by */
  key: string;
  /** Sort order */
  order: "asc" | "desc";
}

/**
 * Pagination data
 */
export interface DataTablePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * API response structure expected by DataTable
 */
export interface DataTableResponse<T> {
  data: T[];
  pagination: DataTablePagination;
}

/**
 * Action button definition
 */
export interface DataTableAction<T = any> {
  /** Action label */
  label: string;
  /** Action icon (React component) */
  icon?: React.ElementType;
  /** Action handler */
  onClick: (row: T) => void;
  /** Variant for button styling */
  variant?: "default" | "outline" | "destructive" | "ghost";
  /** Whether action is visible (can be function) */
  visible?: boolean | ((row: T) => boolean);
}

/**
 * Bulk action definition
 */
export interface DataTableBulkAction<T = any> {
  /** Action label */
  label: string;
  /** Action icon */
  icon?: React.ElementType;
  /** Action handler - receives array of selected rows */
  onClick: (rows: T[]) => void;
  /** Variant for button styling */
  variant?: "default" | "outline" | "destructive";
  /** Minimum number of selected rows required (default: 1) */
  minSelected?: number;
  /** Whether action is disabled */
  disabled?: boolean | ((rows: T[]) => boolean);
}

/**
 * DataTable configuration props
 */
export interface DataTableProps<T = any> {
  /** React Query hook that returns data */
  fetcher: (params: any) => {
    data?: DataTableResponse<T>;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  };
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Filter definitions */
  filters?: DataTableFilter[];
  /** Default sort configuration */
  defaultSort?: DataTableSort;
  /** Default page size */
  defaultPageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Action buttons for each row */
  rowActions?: DataTableAction<T>[];
  /** Bulk actions (shown when rows are selected) */
  bulkActions?: DataTableBulkAction<T>[];
  /** Whether to show row selection checkbox */
  selectable?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** URL sync enabled (default: true) */
  urlSync?: boolean;
  /** Custom row key getter (default: _id) */
  getRowKey?: (row: T) => string;
  /** Custom row renderer (optional, uses default if not provided) */
  renderRow?: (row: T, columns: DataTableColumn<T>[]) => ReactNode;
  /** Whether table is in deleted-only mode (disables selection, sorting, row click) */
  deletedOnlyMode?: boolean;
  /** Callback when row is clicked (disabled in deleted-only mode) */
  onRowClick?: (row: T) => void;
  sort?: DataTableSort;
  onSort?: (sort: DataTableSort) => void;
}

