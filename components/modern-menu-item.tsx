"use client";

import { useState } from "react";
import Image from "next/image";
import type { MenuItem, AddOn } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { getSelectedTable } from "@/lib/table-storage";
import { isPhoneVerified } from "@/lib/phone-auth";
import { PhoneAuthModal } from "./phone-auth-modal";
import { CustomizationModal } from "./customization-modal";
import { Star } from "lucide-react";

interface ModernMenuItemProps {
  item: MenuItem & { category?: string; food_type?: string };
  addOns: AddOn[];
}

export function ModernMenuItem({ item, addOns }: ModernMenuItemProps) {
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
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
        <div className="w-5 h-5 border-2 border-red-600 flex items-center justify-center rounded-sm">
          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
        </div>
      );
    } else if (foodType === "egg") {
      return (
        <div className="w-5 h-5 border-2 border-yellow-600 flex items-center justify-center rounded-sm">
          <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
        </div>
      );
    } else {
      return (
        <div className="w-5 h-5 border-2 border-green-600 flex items-center justify-center rounded-sm">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
        </div>
      );
    }
  };

  const shouldShowReadMore = item.description && item.description.length > 100;
  const displayDescription =
    shouldShowReadMore && !isDescriptionExpanded && item.description
      ? `${item.description.substring(0, 100)}...`
      : item.description;

  // Mock rating data - in real app, this would come from database
  const rating = (Math.random() * 2 + 3).toFixed(1); // Random rating between 3.0-5.0
  const reviewCount = Math.floor(Math.random() * 50) + 5; // Random review count

  return (
    <>
      <div className="bg-white border-b border-gray-100 p-6 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-start justify-between gap-4">
          {/* Left Content */}
          <div className="flex-1 min-w-0">
            {/* Food type indicator */}
            <div className="mb-3">{getFoodTypeIndicator()}</div>

            {/* Item name */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight line-clamp-2">
              {item.name}
            </h3>

            {/* Price */}
            <div className="text-lg font-bold text-gray-900 mb-2">
              ₹{item.price.toFixed(0)}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-3">
              <Star className="h-4 w-4 fill-green-600 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                {rating}
              </span>
              <span className="text-sm text-gray-500">({reviewCount})</span>
            </div>

            {/* Description */}
            {item.description && (
              <div className="text-sm text-gray-600 mb-4 leading-relaxed">
                <p className="line-clamp-2">{displayDescription}</p>
                {shouldShowReadMore && (
                  <button
                    onClick={() =>
                      setIsDescriptionExpanded(!isDescriptionExpanded)
                    }
                    className="text-orange-600 hover:text-orange-700 mt-1 font-medium text-sm"
                  >
                    {isDescriptionExpanded ? "less" : "more"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Side - Image and Add Button */}
          <div className="relative flex-shrink-0">
            {/* Food Image */}
            <div className="w-36 h-36 rounded-xl overflow-hidden bg-gray-100 -mb-5 relative">
              {item.image_url && !imageError ? (
                <Image
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="(max-width: 768px) 144px, 144px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🍽️</div>
                    <div className="text-xs text-gray-600 px-2">
                      {item.name.split(" ").slice(0, 2).join(" ")}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Button */}
            <div className="relative">
              <Button
                onClick={handleAddToCart}
                disabled={!item.available}
                className="w-full bg-white hover:bg-green-50 text-green-600 border-2 border-green-200 hover:border-green-300 font-bold px-6 py-2 rounded-xl shadow-sm transition-all duration-200 min-h-[44px]"
                variant="outline"
              >
                {item.available ? "ADD" : "Unavailable"}
              </Button>

              {/* Customizable label */}
              {addOns.length > 0 && item.available && (
                <div className="text-center mt-1">
                  <span className="text-xs text-gray-500">Customisable</span>
                </div>
              )}
            </div>
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
