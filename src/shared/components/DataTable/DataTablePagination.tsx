import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DataTablePagination as PaginationData } from "./types";

interface DataTablePaginationProps {
  pagination: PaginationData;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
}

export function DataTablePagination({
  pagination,
  pageSizeOptions = [5, 10, 20, 50],
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const { page, limit, total, pages } = pagination;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Generate page numbers to show (max 5 pages with ellipsis)
  const getPageNumbers = () => {
    const maxPages = 5;
    if (pages <= maxPages) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }

    if (page <= 3) {
      return [1, 2, 3, 4, 5, 'ellipsis', pages];
    }

    if (page >= pages - 2) {
      return [1, 'ellipsis', pages - 4, pages - 3, pages - 2, pages - 1, pages];
    }

    return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', pages];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t">
      <div className="text-sm text-muted-foreground">
        Showing <strong>{start}</strong> to <strong>{end}</strong> of <strong>{total}</strong> results
      </div>
      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                onPageSizeChange(Number(value));
                onPageChange(1); // Reset to first page when changing page size
              }}
            >
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pageNumbers.map((pageNum, idx) => {
            if (pageNum === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              );
            }
            return (
              <Button
                key={pageNum}
                variant="outline"
                size="sm"
                className={`h-9 min-w-9 ${
                  page === pageNum 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : ""
                }`}
                onClick={() => onPageChange(pageNum as number)}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="icon"
            disabled={page === pages}
            onClick={() => onPageChange(page + 1)}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

