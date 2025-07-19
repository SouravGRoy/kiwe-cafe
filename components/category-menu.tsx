"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryMenuProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryMenu({
  categories,
  selectedCategory,
  onCategorySelect,
  isOpen,
  onClose,
}: CategoryMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <Card className="w-full max-w-md mx-auto mb-0 rounded-t-2xl rounded-b-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Menu Categories</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onCategorySelect(category.id);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                  selectedCategory === category.id
                    ? "bg-orange-50 border border-orange-200"
                    : "hover:bg-gray-50"
                )}
              >
                <span className="font-medium text-gray-900">
                  {category.name}
                </span>
                <Badge variant="secondary" className="bg-gray-100">
                  {category.count}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
