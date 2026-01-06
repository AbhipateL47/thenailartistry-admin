import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductPaginationProps {
  page: number;
  limit: number;
  total: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function ProductPagination({
  page,
  limit,
  total,
  pages,
  onPageChange,
}: ProductPaginationProps) {
  return (
    <div className="flex items-center justify-between p-4 border-t border-border">
      <div className="text-sm text-muted-foreground">
        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
      </div>
      <div className="flex items-center gap-4">
        <Select value={limit.toString()} disabled>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
            let pageNum: number;
            if (pages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= pages - 2) {
              pageNum = pages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                className={page === pageNum ? "bg-primary/10 text-primary" : ""}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
          {pages > 5 && (
            <>
              <span className="px-2 text-muted-foreground">...</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pages)}
              >
                {pages}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="icon"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

