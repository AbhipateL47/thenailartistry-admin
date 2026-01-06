import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FilterSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex gap-3 flex-wrap items-end">
          {/* Search input skeleton */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Filter dropdowns skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-[140px]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

