"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Check, X, Loader2 } from "lucide-react";

interface CouponInputProps {
  orderTotal: number;
  customerPhone: string;
  onCouponApplied: (couponData: {
    couponId: string;
    discountAmount: number;
    finalTotal: number;
    couponCode: string;
  }) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: {
    couponCode: string;
    discountAmount: number;
    finalTotal: number;
  } | null;
}

export function CouponInput({
  orderTotal,
  customerPhone,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    if (!customerPhone) {
      setError("Phone number is required to apply coupon");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode: couponCode.trim().toUpperCase(),
          customerPhone,
          orderTotal,
        }),
      });

      const data = await response.json();

      if (response.ok && data.isValid) {
        onCouponApplied({
          couponId: data.couponId,
          discountAmount: data.discountAmount,
          finalTotal: data.finalTotal,
          couponCode: couponCode.trim().toUpperCase(),
        });

        toast({
          title: "Coupon Applied!",
          description: `You saved ₹${data.discountAmount.toFixed(2)}`,
        });

        setCouponCode("");
      } else {
        setError(data.error || "Invalid coupon code");
        toast({
          title: "Invalid Coupon",
          description: data.error || "Coupon could not be applied",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      setError("Failed to validate coupon. Please try again.");
      toast({
        title: "Error",
        description: "Failed to validate coupon",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    onCouponRemoved();
    setCouponCode("");
    setError("");
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your order",
    });
  };

  if (appliedCoupon) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">
                  Coupon Applied: {appliedCoupon.couponCode}
                </div>
                <div className="text-sm text-green-600">
                  You saved ₹{appliedCoupon.discountAmount.toFixed(2)}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeCoupon}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-gray-400" />
            <span className="font-medium">Have a coupon?</span>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setError("");
                }}
                onKeyPress={(e) => e.key === "Enter" && validateCoupon()}
                className={error ? "border-red-300 focus:border-red-500" : ""}
                disabled={loading}
              />
              {error && (
                <div className="text-sm text-red-600 mt-1">{error}</div>
              )}
            </div>
            <Button
              onClick={validateCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-6"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            Enter your coupon code to get discount on this order
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
