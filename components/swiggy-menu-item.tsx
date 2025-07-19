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
import { Star } from "lucide-react";
import { CustomizationModal } from "./customization-modal";

interface SwiggyMenuItemProps {
  item: MenuItem;
  addOns: AddOn[];
}

export function SwiggyMenuItem({ item, addOns }: SwiggyMenuItemProps) {
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const { dispatch } = useCart();
  const { toast } = useToast();

  // Mock rating data - in real app, this would come from database
  const rating = (Math.random() * 2 + 3).toFixed(1); // Random rating between 3.0-5.0
  const reviewCount = Math.floor(Math.random() * 50) + 5; // Random review count

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
      // Add directly to cart without customization
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

  return (
    <>
      <div className="flex items-start gap-4 p-4 border-b border-gray-100 last:border-b-0">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Veg/Non-veg indicator */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            </div>
          </div>

          {/* Item name */}
          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
            {item.name}
          </h3>

          {/* Price */}
          <div className="text-lg font-semibold text-gray-900 mb-2">
            ₹{item.price.toFixed(0)}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
            <span className="text-sm font-medium text-gray-700">{rating}</span>
            <span className="text-sm text-gray-500">({reviewCount})</span>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {item.description}
            </p>
          )}
        </div>

        {/* Image and Add button */}
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={
                item.image_url ||
                "/placeholder.svg?height=128&width=128&query=delicious food"
              }
              alt={item.name}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Add button */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <Button
              onClick={handleAddToCart}
              disabled={!item.available}
              className="bg-white hover:bg-gray-50 text-green-600 border border-gray-200 font-semibold px-6 py-2 rounded-lg shadow-sm"
              variant="outline"
            >
              {item.available ? "ADD" : "Unavailable"}
            </Button>
          </div>

          {/* Customizable label */}
          {addOns.length > 0 && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <span className="text-xs text-gray-500">Customisable</span>
            </div>
          )}
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
