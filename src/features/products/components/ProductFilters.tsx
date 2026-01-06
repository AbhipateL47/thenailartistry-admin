import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  stockFilter: string;
  onStockFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  flagFilter: string;
  onFlagFilterChange: (value: string) => void;
  deletedFilter: string;
  onDeletedFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  stockFilter,
  onStockFilterChange,
  statusFilter,
  onStatusFilterChange,
  flagFilter,
  onFlagFilterChange,
  deletedFilter,
  onDeletedFilterChange,
  onClearFilters,
}: ProductFiltersProps) {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Local state for mobile filters (not applied until "Apply Filters" is clicked)
  const [mobileCategoryFilter, setMobileCategoryFilter] = useState(categoryFilter);
  const [mobileStockFilter, setMobileStockFilter] = useState(stockFilter);
  const [mobileStatusFilter, setMobileStatusFilter] = useState(statusFilter);
  const [mobileFlagFilter, setMobileFlagFilter] = useState(flagFilter);
  const [mobileDeletedFilter, setMobileDeletedFilter] = useState(deletedFilter);

  // Sync local state when props change (when filters are applied from desktop or cleared)
  useEffect(() => {
    setMobileCategoryFilter(categoryFilter);
    setMobileStockFilter(stockFilter);
    setMobileStatusFilter(statusFilter);
    setMobileFlagFilter(flagFilter);
    setMobileDeletedFilter(deletedFilter);
  }, [categoryFilter, stockFilter, statusFilter, flagFilter, deletedFilter]);

  // Count active filters based on actual applied filters
  const activeFiltersCount = [
    categoryFilter !== "all",
    stockFilter !== "all",
    statusFilter !== "all",
    flagFilter !== "all",
    deletedFilter !== "active",
  ].filter(Boolean).length;

  const handleClearFilters = useCallback(() => {
    onClearFilters();
    setFilterDialogOpen(false);
  }, [onClearFilters]);

  const handleApplyFilters = useCallback(() => {
    onCategoryFilterChange(mobileCategoryFilter);
    onStockFilterChange(mobileStockFilter);
    onStatusFilterChange(mobileStatusFilter);
    onFlagFilterChange(mobileFlagFilter);
    onDeletedFilterChange(mobileDeletedFilter);
    setFilterDialogOpen(false);
  }, [mobileCategoryFilter, mobileStockFilter, mobileStatusFilter, mobileFlagFilter, mobileDeletedFilter, onCategoryFilterChange, onStockFilterChange, onStatusFilterChange, onFlagFilterChange, onDeletedFilterChange]);

  // Helper function to get filter display labels with type info
  const getFilterLabel = (type: string, value: string) => {
    switch (type) {
      case "category":
        if (value === "all") return null;
        if (value === "gel") return { type, label: "Category: Gel Polish" };
        if (value === "tools") return { type, label: "Category: Tools" };
        return null;
      case "stock":
        if (value === "all") return null;
        if (value === "in-stock") return { type, label: "Stock: In Stock" };
        if (value === "low-stock") return { type, label: "Stock: Low Stock" };
        if (value === "out-of-stock") return { type, label: "Stock: Out of Stock" };
        return null;
      case "status":
        if (value === "all") return null;
        if (value === "active") return { type, label: "Status: Active" };
        if (value === "inactive") return { type, label: "Status: Inactive" };
        return null;
      case "flag":
        if (value === "all") return null;
        if (value === "featured-and-onsale") return { type, label: "Flags: Featured & On Sale" };
        if (value === "featured-not-onsale") return { type, label: "Flags: Featured & Not On Sale" };
        if (value === "not-featured-onsale") return { type, label: "Flags: Not Featured & On Sale" };
        if (value === "not-featured-not-onsale") return { type, label: "Flags: Not Featured & Not On Sale" };
        return null;
      case "deleted":
        if (value === "active") return null;
        if (value === "all") return { type, label: "Deleted: All (Incl. Deleted)" };
        if (value === "deleted") return { type, label: "Deleted: Deleted Only" };
        return null;
      case "search":
        if (!value || value.trim() === "") return null;
        return { type, label: `Search: "${value}"` };
      default:
        return null;
    }
  };

  // Get active filter labels with type info
  const activeFilterLabels = [
    getFilterLabel("category", categoryFilter),
    getFilterLabel("stock", stockFilter),
    getFilterLabel("status", statusFilter),
    getFilterLabel("flag", flagFilter),
    getFilterLabel("deleted", deletedFilter),
    getFilterLabel("search", searchQuery),
  ].filter(Boolean) as Array<{ type: string; label: string }>;

  // Handler to remove individual filter
  const handleRemoveFilter = (filterType: string) => {
    switch (filterType) {
      case "category":
        onCategoryFilterChange("all");
        break;
      case "stock":
        onStockFilterChange("all");
        break;
      case "status":
        onStatusFilterChange("all");
        break;
      case "flag":
        onFlagFilterChange("all");
        break;
      case "deleted":
        onDeletedFilterChange("active");
        break;
      case "search":
        onSearchChange("");
        break;
    }
  };

  // Desktop filters (horizontal layout)
  const DesktopFilters = () => (
    <div className="flex gap-3 flex-wrap items-end">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-filter" className="text-xs text-muted-foreground">Category</Label>
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger id="category-filter" className="w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="gel">Gel Polish</SelectItem>
            <SelectItem value="tools">Tools</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stock-filter" className="text-xs text-muted-foreground">Stock</Label>
        <Select value={stockFilter} onValueChange={onStockFilterChange}>
          <SelectTrigger id="stock-filter" className="w-[140px]">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status-filter" className="text-xs text-muted-foreground">Status</Label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger id="status-filter" className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="flag-filter" className="text-xs text-muted-foreground">Flags</Label>
        <Select value={flagFilter} onValueChange={onFlagFilterChange}>
          <SelectTrigger id="flag-filter" className="w-[180px]">
            <SelectValue placeholder="Flags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="featured-and-onsale">Featured / On Sale</SelectItem>
            <SelectItem value="featured-not-onsale">Featured / Not On Sale</SelectItem>
            <SelectItem value="not-featured-onsale">Not Featured / On Sale</SelectItem>
            <SelectItem value="not-featured-not-onsale">Not Featured / Not On Sale</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="deleted-filter" className="text-xs text-muted-foreground">Deleted Products</Label>
        <Select value={deletedFilter} onValueChange={onDeletedFilterChange}>
          <SelectTrigger id="deleted-filter" className="w-[140px]">
            <SelectValue placeholder="Deleted" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="all">All (Incl. Deleted)</SelectItem>
            <SelectItem value="deleted">Deleted Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Mobile filters (in dialog)
  const MobileFiltersDialog = () => (
    <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative flex-shrink-0 h-10 w-10">
          <Filter className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[350px]"
        onPointerDownOutside={(e) => {
          // Prevent dialog from closing when clicking on Select dropdown
          const target = e.target as HTMLElement;
          if (target.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={mobileCategoryFilter} onValueChange={setMobileCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="gel">Gel Polish</SelectItem>
                <SelectItem value="tools">Tools</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Stock</label>
            <Select value={mobileStockFilter} onValueChange={setMobileStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select stock status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={mobileStatusFilter} onValueChange={setMobileStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Flags</label>
            <Select value={mobileFlagFilter} onValueChange={setMobileFlagFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select flags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="featured-and-onsale">Featured / On Sale</SelectItem>
                <SelectItem value="featured-not-onsale">Featured / Not On Sale</SelectItem>
                <SelectItem value="not-featured-onsale">Not Featured / On Sale</SelectItem>
                <SelectItem value="not-featured-not-onsale">Not Featured / Not On Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Deleted Products</label>
            <Select value={mobileDeletedFilter} onValueChange={setMobileDeletedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="all">All (Incl. Deleted)</SelectItem>
                <SelectItem value="deleted">Deleted Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClearFilters}
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button
              className="flex-1"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card className="w-fit md:w-full">
      <CardContent className="p-4 space-y-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex md:flex-row md:items-end md:gap-4">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Label htmlFor="search-input" className="text-xs text-muted-foreground mb-1.5 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                placeholder="Search by name, SKU, or tag..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {/* Desktop Filters */}
          <DesktopFilters />
        </div>

        {/* Mobile Layout - Search and Filter button on same line */}
        <div className="flex md:hidden gap-2 items-center">
          {/* Search Input - Takes less space on mobile, leaves room for filter icon button */}
          <div className="relative flex-[1_1_0%] min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Mobile Filter Button - Icon only */}
          <MobileFiltersDialog />
        </div>

        {/* Active Filters Labels - Desktop and Mobile */}
        {activeFilterLabels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground font-medium">Active Filters:</span>
            {activeFilterLabels.map((filter, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs flex items-center gap-1.5 pr-1"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => handleRemoveFilter(filter.type)}
                  className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${filter.type} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleClearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

