"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { CategorySection } from "@/components/category-section";
import { CategoryTabs } from "@/components/category-tabs";
import { FoodFilters } from "@/components/food-filters";
import { CartButton } from "@/components/cart-button";
import { TableSelector } from "@/components/table-selector";
import { LandingPage } from "@/components/landing-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getSelectedTable,
  setSelectedTable,
  clearSelectedTable,
} from "@/lib/table-storage";
import { useCart } from "@/contexts/cart-context";
import { Search, Home, Menu, FileText, CreditCard } from "lucide-react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
};

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [currentTable, setCurrentTable] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFilters, setSelectedFilters] = useState(["all"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLanding, setShowLanding] = useState(true);
  const { dispatch, state } = useCart();
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    loadData();
    const table = getSelectedTable();
    setCurrentTable(table);

    // If table is already selected, skip landing page
    if (table) {
      setShowLanding(false);
    }

    setLoading(false);
  }, []);

  // Set up intersection observer to track which category is in view
  useEffect(() => {
    if (categories.length === 0 || showLanding) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const categoryId = entry.target.id.replace("category-", "");
            setSelectedCategory(categoryId);
          }
        });
      },
      {
        rootMargin: "-100px 0px -50% 0px",
        threshold: 0.1,
      }
    );

    // Observe all category sections
    categories.forEach((category) => {
      const element = document.getElementById(`category-${category.id}`);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [categories, showLanding]);

  const loadData = async () => {
    try {
      // Load categories first
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      console.log("Categories loaded:", categoryData, "Error:", categoryError);

      if (categoryData && categoryData.length > 0) {
        setCategories(categoryData);
        setSelectedCategory(categoryData[0].id); // Set first category as default
      } else {
        // If no categories exist, create a default one
        console.log("No categories found, creating default category...");
        const { data: defaultCategory, error: createError } = await supabase
          .from("categories")
          .insert({
            name: "All Items",
            description: "All menu items",
            icon: "utensils",
            color: "gray",
            display_order: 0,
            is_active: true,
          })
          .select()
          .single();

        if (defaultCategory && !createError) {
          setCategories([defaultCategory]);
          setSelectedCategory(defaultCategory.id);
        }
      }

      // Load menu items with category info
      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select(
          `
          *,
          categories (
            id,
            name,
            color
          )
        `
        )
        .order("name");

      console.log("Menu items loaded:", menuData?.length, "Error:", menuError);

      const { data: addOnData } = await supabase.from("add_ons").select("*");

      if (menuData) setMenuItems(menuData);
      if (addOnData) setAddOns(addOnData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleOrderNow = () => {
    setShowLanding(false);
  };

  const handleGoHome = () => {
    setShowLanding(true);
    setCurrentTable(null);
    clearSelectedTable();
    dispatch({ type: "CLEAR_CART" });
  };

  const handleTableSelected = (tableNumber: number) => {
    setSelectedTable(tableNumber);
    setCurrentTable(tableNumber);
    dispatch({ type: "SET_TABLE", payload: tableNumber });

    const cartKey = `cafe-cart-table-${tableNumber}`;
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({
          type: "LOAD_CART",
          payload: { items: cartItems, tableNumber },
        });
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      // Scroll to the category section with offset for sticky headers
      const headerOffset = 140; // Account for sticky headers
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const addOnsByItem = addOns.reduce((acc, addOn) => {
    if (!acc[addOn.menu_item_id]) {
      acc[addOn.menu_item_id] = [];
    }
    acc[addOn.menu_item_id].push(addOn);
    return acc;
  }, {} as Record<string, typeof addOns>);

  // Filter items based on food type and search (not category since we show all)
  const filteredMenuItems = menuItems.filter((item) => {
    // Food type filter
    const foodTypeMatch =
      selectedFilters.includes("all") ||
      selectedFilters.includes(item.food_type || "veg");

    // Search filter
    const searchMatch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return foodTypeMatch && searchMatch && item.available;
  });

  // Group items by category
  const itemsByCategory = categories.reduce((acc, category) => {
    acc[category.id] = filteredMenuItems.filter(
      (item) => item.category_id === category.id
    );
    return acc;
  }, {} as Record<string, typeof filteredMenuItems>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show landing page first
  if (showLanding) {
    return <LandingPage onOrderNow={handleOrderNow} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Table Selection */}
      <TableSelector
        onTableSelected={handleTableSelected}
        currentTable={currentTable}
      />

      {/* Main Content */}
      {currentTable && (
        <>
          {/* Header */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">D</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">
                      Kiwe Cafe
                    </h1>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600">
                    T{currentTable}
                  </span>
                  <CartButton />
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-4 pb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search item"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-200"
                  />
                </div>
                <FoodFilters
                  selectedFilters={selectedFilters}
                  onFiltersChange={setSelectedFilters}
                />
              </div>
            </div>
          </header>

          {/* Category Tabs - Only show if categories exist */}
          {categories.length > 0 && (
            <CategoryTabs
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />
          )}

          {/* Menu Sections */}
          <main className="max-w-6xl mx-auto">
            {categories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                items={itemsByCategory[category.id] || []}
                addOnsByItem={addOnsByItem}
              />
            ))}

            {filteredMenuItems.length === 0 && (
              <div className="text-center py-12 bg-white">
                <p className="text-gray-500 mb-4">
                  No items found matching your criteria.
                </p>
                {categories.length === 0 && (
                  <p className="text-sm text-gray-400">
                    Admin needs to create categories and add menu items first.
                  </p>
                )}
              </div>
            )}
          </main>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-around py-3">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-gray-600"
                  onClick={handleGoHome}
                >
                  <Home className="h-5 w-5" />
                  <span className="text-xs">Home</span>
                </Button>

                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-orange-600"
                >
                  <Menu className="h-5 w-5" />
                  <span className="text-xs">Menu</span>
                </Button>

                <Link href="/cart">
                  <Button
                    variant="ghost"
                    className="flex flex-col items-center gap-1 text-gray-600 relative"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">Orders</span>
                    {state.items.length > 0 && (
                      <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {state.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}
                      </div>
                    )}
                  </Button>
                </Link>

                <Link href="/pay-bill">
                  <Button
                    variant="ghost"
                    className="flex flex-col items-center gap-1 text-gray-600"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs">Pay Bill</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom padding to account for fixed navigation */}
          <div className="h-20"></div>
        </>
      )}
    </div>
  );
}
