import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, MoreVertical } from "lucide-react";
import { DataTableFilter } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface DataTableHeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  filters?: DataTableFilter[];
  filterValues?: Record<string, any>;
  onFilterChange?: (key: string, value: any) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  selectedCount?: number;
  onBulkActionsToggle?: () => void;
  isBulkActionsOpen?: boolean;
  deletedOnlyMode?: boolean;
}

export function DataTableHeader({
  searchQuery = "",
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  hasActiveFilters = false,
  selectedCount = 0,
  onBulkActionsToggle,
  isBulkActionsOpen = false,
  deletedOnlyMode = false,
}: DataTableHeaderProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Get active filter chips
  const activeFilters = filters.filter((filter) => {
    const value = filterValues[filter.key];
    if (filter.type === "select") {
      return value && value !== "all" && value !== filter.defaultValue;
    }
    if (filter.type === "boolean") {
      return value === true;
    }
    if (filter.type === "text") {
      return value && value.trim() !== "";
    }
    return value !== undefined && value !== null && value !== "";
  });

  const handleRemoveFilter = (filterKey: string) => {
    const filter = filters.find((f) => f.key === filterKey);
    if (!filter) return;

    if (filter.type === "select") {
      onFilterChange?.(filterKey, filter.defaultValue || "all");
    } else if (filter.type === "boolean") {
      onFilterChange?.(filterKey, false);
    } else {
      onFilterChange?.(filterKey, "");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Header - Flexbox Layout */}
      <div className="flex flex-col gap-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex md:items-center md:gap-3 md:flex-wrap">
          {/* Search Input - Grows first */}
          {onSearchChange && (
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}
          
          {/* Filters - Wrap if needed */}
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter) => (
              <FilterControl
                key={filter.key}
                filter={filter}
                value={filterValues[filter.key]}
                onChange={(value) => onFilterChange?.(filter.key, value)}
              />
            ))}
          </div>

          {/* 3-dot Menu Button - Always right-aligned */}
          {selectedCount > 0 && onBulkActionsToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkActionsToggle}
              className="ml-auto"
              title="Bulk actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-3">
          {onSearchChange && (
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="gap-2 flex-1 min-w-[120px]"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilters.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </Button>
            {hasActiveFilters && onClearFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
            {/* 3-dot Menu Button - Mobile */}
            {selectedCount > 0 && onBulkActionsToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkActionsToggle}
                title="Bulk actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
          </div>
          {mobileFiltersOpen && (
            <div className="space-y-3 pt-2 border-t">
              {filters.map((filter) => (
                <FilterControl
                  key={filter.key}
                  filter={filter}
                  value={filterValues[filter.key]}
                  onChange={(value) => onFilterChange?.(filter.key, value)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {(activeFilters.length > 0 || (searchQuery && searchQuery.trim() !== "")) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchQuery && searchQuery.trim() !== "" && (
            <Badge variant="secondary" className="gap-1.5 px-2 py-1">
              <span className="text-xs">Search: {searchQuery}</span>
              <button
                onClick={() => onSearchChange?.("")}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeFilters.map((filter) => {
            const value = filterValues[filter.key];
            let displayValue = value?.toString() || "";
            
            if (filter.type === "select" && filter.options) {
              const option = filter.options.find((opt) => opt.value === value);
              displayValue = option?.label || value?.toString() || "";
            }

            return (
              <Badge key={filter.key} variant="secondary" className="gap-1.5 px-2 py-1">
                <span className="text-xs">
                  {filter.label}: {displayValue}
                </span>
                <button
                  onClick={() => handleRemoveFilter(filter.key)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {onClearFilters && (activeFilters.length > 0 || (searchQuery && searchQuery.trim() !== "")) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-7 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Filter Control Component
interface FilterControlProps {
  filter: DataTableFilter;
  value: any;
  onChange: (value: any) => void;
}

function FilterControl({ filter, value, onChange }: FilterControlProps) {
  switch (filter.type) {
    case "select":
      return (
        <Select
          value={value?.toString() || filter.defaultValue?.toString() || ""}
          onValueChange={onChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "boolean":
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={filter.key}
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <Label htmlFor={filter.key} className="text-sm cursor-pointer">
            {filter.label}
          </Label>
        </div>
      );

    case "text":
      return (
        <Input
          placeholder={filter.placeholder || filter.label}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-[140px]"
        />
      );

    default:
      return null;
  }
}
