import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DataTableProps, DataTableSort, DataTableFilter } from "./types";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableTable } from "./DataTableTable";
import { DataTablePagination } from "./DataTablePagination";
import { BulkActionBar } from "./BulkActionBar";
import { TableSkeleton } from "@/shared/components/skeletons/TableSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/shared/hooks/useDebounce";

export function DataTable<T = any>({
  fetcher,
  columns,
  filters = [],
  defaultSort,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50],
  rowActions = [],
  bulkActions = [],
  selectable = false,
  emptyMessage = "No data found.",
  errorMessage = "Failed to load data. Please try again later.",
  urlSync = true,
  getRowKey = (row: any) => row._id || row.id,
  renderRow,
  deletedOnlyMode = false,
  onRowClick,
}: DataTableProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

  // Initialize local state from URL if urlSync is enabled
  const initialLimit = urlSync 
    ? Number(searchParams.get("limit")) || defaultPageSize
    : defaultPageSize;
  
  // Local state for non-URL sync mode
  const [localPage, setLocalPage] = useState(1);
  const [localLimit, setLocalLimit] = useState(initialLimit);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localSort, setLocalSort] = useState<DataTableSort>(
    defaultSort || { key: "", order: "desc" }
  );
  const [localFilterValues, setLocalFilterValues] = useState<Record<string, any>>({});

  // Track if limit was changed via page size selector (don't sync to URL)
  const [limitChangedLocally, setLimitChangedLocally] = useState(false);

  // URL sync state
  const page = urlSync ? Number(searchParams.get("page")) || 1 : localPage;
  // Use local limit if it was changed locally, otherwise use URL limit
  const limit = urlSync && !limitChangedLocally
    ? Number(searchParams.get("limit")) || defaultPageSize
    : localLimit;
  const searchQuery = urlSync
    ? searchParams.get("search") || ""
    : localSearchQuery;
  const sort: DataTableSort = urlSync
    ? {
        key: searchParams.get("sort") || defaultSort?.key || "",
        order: (searchParams.get("order") as "asc" | "desc") || defaultSort?.order || "desc",
      }
    : localSort;

  // Filter values from URL or local state
  const filterValues = useMemo(() => {
    const values: Record<string, any> = {};
    filters.forEach((filter) => {
      if (urlSync) {
        const urlValue = searchParams.get(filter.key);
        if (urlValue !== null) {
          values[filter.key] =
            filter.type === "boolean" ? urlValue === "true" : urlValue;
        } else if (filter.defaultValue !== undefined) {
          values[filter.key] = filter.defaultValue;
        }
      } else {
        // Use local filter state if set, otherwise use default
        if (localFilterValues.hasOwnProperty(filter.key)) {
          values[filter.key] = localFilterValues[filter.key];
        } else if (filter.defaultValue !== undefined) {
          values[filter.key] = filter.defaultValue;
        }
      }
    });
    return values;
  }, [filters, searchParams, urlSync, localFilterValues]);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Build API params
  const apiParams = useMemo(() => {
    const params: any = {
      page,
      limit,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(sort.key && { sort: { key: sort.key, order: sort.order } }),
    };

    // Add filter values
    filters.forEach((filter) => {
      const value = filterValues[filter.key];
      if (value !== undefined && value !== "" && value !== null) {
        params[filter.key] = value;
      }
    });

    return params;
  }, [page, limit, debouncedSearch, sort, filterValues, filters]);

  // Fetch data
  const { data, isLoading, isError, error } = fetcher(apiParams);

  const tableData = data?.data || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: defaultPageSize,
    total: 0,
    pages: 1,
  };

  // URL sync handlers
  const updateSearchParams = (updates: Record<string, string | number | null>) => {
    if (!urlSync) return;
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, value.toString());
        }
      });
      return newParams;
    });
  };

  const handlePageChange = (newPage: number) => {
    if (urlSync) {
      updateSearchParams({ page: newPage });
    } else {
      setLocalPage(newPage);
    }
    // Reset limit changed flag when page changes (allows URL sync to work again if needed)
    if (limitChangedLocally) {
      setLimitChangedLocally(false);
    }
  };

  const handlePageSizeChange = (newLimit: number) => {
    // Update local state (triggers API call via apiParams dependency)
    // Don't update URL - mark as locally changed
    setLocalLimit(newLimit);
    setLocalPage(1);
    setLimitChangedLocally(true);
    // Reset page to 1 in URL if URL sync is enabled (but don't update limit in URL)
    if (urlSync) {
      updateSearchParams({ page: 1 });
    }
  };

  const handleSearchChange = (value: string) => {
    if (urlSync) {
      updateSearchParams({ search: value || null, page: 1 });
    } else {
      setLocalSearchQuery(value);
      setLocalPage(1);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    if (urlSync) {
      updateSearchParams({ [key]: value || null, page: 1 });
    } else {
      // Update local filter state
      setLocalFilterValues((prev) => ({
        ...prev,
        [key]: value !== null && value !== "" ? value : undefined,
      }));
      setLocalPage(1);
    }
  };

  const handleClearFilters = () => {
    if (!urlSync) {
      // Clear local state
      setLocalSearchQuery("");
      setLocalPage(1);
      setLocalFilterValues({});
      // Clear selected rows
      setSelectedRows(new Set());
      return;
    }
    
    // Clear all URL params except sort
    const newParams = new URLSearchParams();
    if (defaultSort) {
      newParams.set("sort", defaultSort.key);
      newParams.set("order", defaultSort.order);
    }
    // Reset page to 1
    newParams.set("page", "1");
    setSearchParams(newParams);
    
    // Clear selected rows
    setSelectedRows(new Set());
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(tableData.map((row) => getRowKey(row))));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const rowKey = getRowKey(row);
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(rowKey);
      } else {
        newSet.delete(rowKey);
      }
      return newSet;
    });
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch !== "" ||
      Object.values(filterValues).some(
        (v) => v !== undefined && v !== "" && v !== null
      )
    );
  }, [debouncedSearch, filterValues]);

  // Get selected rows data
  const selectedRowsData = useMemo(() => {
    return tableData.filter((row) => selectedRows.has(getRowKey(row)));
  }, [tableData, selectedRows, getRowKey]);

  // Check if in deleted-only mode (when deletedFilter === "deleted")
  const isDeletedOnlyMode = deletedOnlyMode || filterValues.deletedFilter === "deleted";
  
  // Disable selection in deleted-only mode
  const effectiveSelectable = selectable && !isDeletedOnlyMode;

  // Close bulk actions when selection is cleared
  useEffect(() => {
    if (selectedRows.size === 0) {
      setIsBulkActionsOpen(false);
    }
  }, [selectedRows.size]);

  // Handle Ctrl+A / Cmd+A to select all rows, and ESC to deselect all
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle ESC key to deselect all rows
      if (event.key === 'Escape' || event.key === 'Esc') {
        // Don't interfere if a modal/dialog is open (let it handle ESC)
        const activeElement = document.activeElement;
        const isModalOpen = 
          activeElement?.closest('[role="dialog"]') !== null ||
          activeElement?.closest('[data-state="open"]') !== null;

        if (isModalOpen) {
          return; // Let the modal handle ESC
        }

        // Only deselect if there are selected rows
        if (selectedRows.size > 0) {
          event.preventDefault();
          setSelectedRows(new Set());
          setIsBulkActionsOpen(false);
        }
        return;
      }

      // Handle Ctrl+A / Cmd+A to select all rows
      if (!effectiveSelectable) return; // Don't handle if selection is disabled

      if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
        // Don't interfere with text selection in inputs, textareas, or contenteditable elements
        const activeElement = document.activeElement;
        const isInputFocused = 
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA' ||
          activeElement?.getAttribute('contenteditable') === 'true';

        if (isInputFocused) {
          return; // Let the default behavior happen (select all text in input)
        }

        // Prevent default browser select-all behavior
        event.preventDefault();
        
        // Select all rows in current table
        if (tableData.length > 0) {
          setSelectedRows(new Set(tableData.map((row) => getRowKey(row))));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveSelectable, tableData, getRowKey, selectedRows.size]);

  const handleBulkActionComplete = () => {
    setSelectedRows(new Set());
    setIsBulkActionsOpen(false);
  };

  // Sort handler - follows industry pattern: first click = asc, second = desc, new column = asc
  const handleSort = (columnKey: string) => {
    if (deletedOnlyMode) return; // Disable sorting in deleted-only mode

    let newSort: DataTableSort;
    
    if (sort.key === columnKey) {
      // Same column: toggle between asc and desc
      newSort = {
        key: columnKey,
        order: sort.order === "asc" ? "desc" : "asc",
      };
    } else {
      // New column: start with asc
      newSort = {
        key: columnKey,
        order: "asc",
      };
    }

    // Update sort state
    if (urlSync) {
      updateSearchParams({ sort: newSort.key, order: newSort.order, page: 1 });
    } else {
      setLocalSort(newSort);
      setLocalPage(1);
    }
  };

  // Error state
  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive">{errorMessage}</p>
          {error instanceof Error && (
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          )}
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header with Search & Filters */}
        <div className="p-4 border-b border-border">
          <DataTableHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filters={filters}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            selectedCount={selectedRows.size}
            onBulkActionsToggle={() => setIsBulkActionsOpen(!isBulkActionsOpen)}
            isBulkActionsOpen={isBulkActionsOpen}
            deletedOnlyMode={isDeletedOnlyMode}
          />
        </div>

        {/* Bulk Action Bar - Slides down from header */}
        {isBulkActionsOpen && bulkActions.length > 0 && (
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isBulkActionsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <BulkActionBar
              selectedCount={selectedRows.size}
              selectedRows={selectedRowsData}
              actions={bulkActions}
              onActionComplete={handleBulkActionComplete}
            />
          </div>
        )}

        <div className="p-4">
          {isLoading ? (
            <div className="overflow-hidden">
              <TableSkeleton rows={10} columns={columns.length + (effectiveSelectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)} />
            </div>
          ) : (
            <DataTableTable
              columns={columns}
              data={tableData}
              selectable={effectiveSelectable}
              selectedRows={selectedRows}
              onSelectAll={handleSelectAll}
              onSelectRow={handleSelectRow}
              getRowKey={getRowKey}
              renderRow={renderRow}
              actions={rowActions}
              emptyMessage={emptyMessage}
              deletedOnlyMode={isDeletedOnlyMode}
              onRowClick={onRowClick}
              sort={sort}
              onSort={handleSort}
            />
          )}
        </div>

        {/* Pagination Footer */}
        {!isLoading && pagination.total > 0 && (
          <DataTablePagination
            pagination={pagination}
            pageSizeOptions={pageSizeOptions}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
