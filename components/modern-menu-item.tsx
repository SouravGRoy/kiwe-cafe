"use client";

import { useState } from "react";
import type { MenuItem, AddOn } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { getSelectedTable } from "@/lib/table-storage";
import { isPhoneVerified } from "@/lib/phone-auth";
import { PhoneAuthModal } from "./phone-auth-modal";
import { CustomizationModal } from "./customization-modal";
import { Plus } from "lucide-react";

interface ModernMenuItemProps {
  item: MenuItem & { category?: string; food_type?: string };
  addOns: AddOn[];
}

export function ModernMenuItem({ item, addOns }: ModernMenuItemProps) {
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { dispatch } = useCart();
  const { toast } = useToast();

  const validateAddToCart = () => {
    const tableNumber = getSelectedTable();

    if (!tableNumber) {
      toast({
        title: "Table not selected",
        description: "Please select your table number first.",
        variant: "destructive",
      });
      return false;
    }

    const phone = isPhoneVerified();
    if (!phone) {
      setShowPhoneAuth(true);
      return false;
    }

    setVerifiedPhone(phone);
    return true;
  };

  const handleAddToCart = () => {
    if (!validateAddToCart()) return;

    if (addOns.length > 0) {
      setShowCustomization(true);
    } else {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          menuItem: item,
          quantity: 1,
          selectedAddOns: [],
          notes: "",
        },
      });

      toast({
        title: "Added to cart",
        description: `${item.name} has been added to your cart.`,
      });
    }
  };

  const handlePhoneVerified = (phone: string) => {
    setVerifiedPhone(phone);
    setShowPhoneAuth(false);
    setTimeout(() => handleAddToCart(), 500);
  };

  const handleCustomizationComplete = (
    selectedAddOns: AddOn[],
    notes: string,
    quantity: number
  ) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        menuItem: item,
        quantity,
        selectedAddOns,
        notes,
      },
    });

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });

    setShowCustomization(false);
  };

  const getFoodTypeIndicator = () => {
    const foodType = item.food_type || "veg";

    if (foodType === "non-veg") {
      return (
        <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center">
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
        </div>
      );
    } else if (foodType === "egg") {
      return (
        <div className="w-4 h-4 border-2 border-yellow-600 flex items-center justify-center">
          <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
        </div>
      );
    } else {
      return (
        <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
        </div>
      );
    }
  };

  const shouldShowReadMore = item.description && item.description.length > 80;
  const displayDescription =
    shouldShowReadMore && !isDescriptionExpanded
      ? `${item.description.substring(0, 80)}...`
      : item.description;

  return (
    <>
      <div className="bg-white border-b border-gray-50 p-6 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            {/* Food type indicator */}
            <div className="mb-3">{getFoodTypeIndicator()}</div>

            {/* Item name */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
              {item.name}
            </h3>

            {/* Price */}
            <div className="text-lg font-bold text-gray-900 mb-3">
              ₹{item.price.toFixed(2)}
            </div>

            {/* Description */}
            {item.description && (
              <div className="text-sm text-gray-600 mb-4 leading-relaxed">
                <p>{displayDescription}</p>
                {shouldShowReadMore && (
                  <button
                    onClick={() =>
                      setIsDescriptionExpanded(!isDescriptionExpanded)
                    }
                    className="text-orange-600 hover:text-orange-700 mt-1 font-medium text-sm"
                  >
                    {isDescriptionExpanded ? "Read Less" : "Read More"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Add button */}
          <div className="flex flex-col items-end">
            <Button
              onClick={handleAddToCart}
              disabled={!item.available}
              className="bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-200 hover:border-orange-300 font-semibold px-6 py-2 rounded-lg shadow-sm transition-all duration-200 min-w-[80px]"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              {item.available ? "Add" : "Unavailable"}
            </Button>

            {/* Customizable label */}
            {addOns.length > 0 && item.available && (
              <span className="text-xs text-gray-500 mt-2">Customisable</span>
            )}
          </div>
        </div>
      </div>

      <PhoneAuthModal
        isOpen={showPhoneAuth}
        onClose={() => setShowPhoneAuth(false)}
        onSuccess={handlePhoneVerified}
      />

      <CustomizationModal
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        item={item}
        addOns={addOns}
        onComplete={handleCustomizationComplete}
      />
    </>
  );
}
