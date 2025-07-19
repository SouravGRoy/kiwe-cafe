"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Coffee,
  Utensils,
  Pizza,
  Sandwich,
  Salad,
  IceCream,
  Soup,
  ChefHat,
  Egg,
  Star,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  display_order: number;
}

interface CategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

// Icon mapping
const iconMap: Record<string, any> = {
  coffee: Coffee,
  utensils: Utensils,
  pizza: Pizza,
  sandwich: Sandwich,
  salad: Salad,
  "ice-cream": IceCream,
  soup: Soup,
  "chef-hat": ChefHat,
  egg: Egg,
};

export function CategoryTabs({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryTabsProps) {
  // Don't render if no categories
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex overflow-x-auto scrollbar-hide py-4 gap-3">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon] || Star;
            const isSelected = selectedCategory === category.id;

            return (
              <Button
                key={category.id}
                variant="ghost"
                onClick={() => onCategorySelect(category.id)}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center gap-2 p-4 h-auto min-w-[80px] rounded-xl transition-all duration-200",
                  isSelected
                    ? "bg-orange-50 text-orange-600 border-2 border-orange-200 shadow-sm"
                    : "hover:bg-gray-50 text-gray-600 border-2 border-transparent"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isSelected ? "bg-orange-100" : "bg-gray-100"
                  )}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium">{category.name}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
