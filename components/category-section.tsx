"use client";

import { ModernMenuItem } from "./modern-menu-item";
import type { MenuItem, AddOn } from "@/lib/supabase";

interface CategorySectionProps {
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  items: (MenuItem & { category_id?: string; food_type?: string })[];
  addOnsByItem: Record<string, AddOn[]>;
}

export function CategorySection({
  category,
  items,
  addOnsByItem,
}: CategorySectionProps) {
  if (items.length === 0) return null;

  return (
    <section id={`category-${category.id}`} className="bg-white">
      {/* Category Header */}
      <div className="sticky top-32 bg-gray-50 border-b border-gray-200 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <h2 className="text-lg font-bold text-gray-900">
            {category.name} ({items.length})
          </h2>
        </div>
      </div>

      {/* Menu Items */}
      <div>
        {items.map((item) => (
          <ModernMenuItem
            key={item.id}
            item={item}
            addOns={addOnsByItem[item.id] || []}
          />
        ))}
      </div>
    </section>
  );
}
