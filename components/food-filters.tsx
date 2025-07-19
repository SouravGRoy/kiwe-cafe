"use client";

import { foodTypeFilters } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, ChevronDown } from "lucide-react";

interface FoodFiltersProps {
  selectedFilters: string[];
  onFiltersChange: (filters: string[]) => void;
}

export function FoodFilters({
  selectedFilters,
  onFiltersChange,
}: FoodFiltersProps) {
  const handleFilterToggle = (filterId: string) => {
    if (filterId === "all") {
      onFiltersChange(["all"]);
    } else {
      const newFilters = selectedFilters.includes(filterId)
        ? selectedFilters.filter((f) => f !== filterId && f !== "all")
        : [...selectedFilters.filter((f) => f !== "all"), filterId];

      onFiltersChange(newFilters.length === 0 ? ["all"] : newFilters);
    }
  };

  const activeFiltersCount = selectedFilters.filter((f) => f !== "all").length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 bg-white">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Food Type</h4>
          {foodTypeFilters.map((filter) => (
            <div key={filter.id} className="flex items-center space-x-2">
              <Checkbox
                id={filter.id}
                checked={selectedFilters.includes(filter.id)}
                onCheckedChange={() => handleFilterToggle(filter.id)}
              />
              <label
                htmlFor={filter.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {filter.name}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
