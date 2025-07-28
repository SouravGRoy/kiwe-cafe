"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { getSelectedTable } from "@/lib/table-storage";
import { isPhoneVerified } from "@/lib/phone-auth";
import { PhoneAuthModal } from "@/components/phone-auth-modal";
import { CouponInput } from "@/components/coupon-input";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { state, dispatch } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    couponCode: string;
    discountAmount: number;
    finalTotal: number;
  } | null>(null);

  useEffect(() => {
    const currentTable = getSelectedTable();
    const phone = isPhoneVerified();

    setTableNumber(currentTable);
    setVerifiedPhone(phone);
  }, []);

  const updateQuantity = (index: string, newQuantity: number) => {
    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { id: index, quantity: newQuantity },
    });
  };

  const removeItem = (index: string) => {
    dispatch({
      type: "REMOVE_ITEM",
      payload: index,
    });
  };

  const validateOrder = () => {
    if (state.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before placing an order.",
        variant: "destructive",
      });
      return false;
    }

    if (!tableNumber) {
      toast({
        title: "Table not selected",
        description: "Please select your table number first.",
        variant: "destructive",
      });
      return false;
    }

    if (!verifiedPhone) {
      setShowPhoneAuth(true);
      return false;
    }

    return true;
  };

  const placeOrder = async (readyToPay = false) => {
    if (!validateOrder()) return;

    setIsPlacingOrder(true);

    try {
      console.log("Placing order with data:", {
        total: state.total,
        customer_name: customerName || null,
        table_number: tableNumber!,
        status: "pending",
        ready_to_pay: readyToPay,
      });

      // Create order with simple total (detailed billing will be in pay bill)
      let sessionId = localStorage.getItem("current_session_id");

      // If no session ID exists, create one
      if (!sessionId && verifiedPhone && tableNumber) {
        sessionId = `${verifiedPhone}_table_${tableNumber}`;
        localStorage.setItem("current_session_id", sessionId);
      }

      // Calculate final total with coupon
      const finalTotal = appliedCoupon ? appliedCoupon.finalTotal : state.total;
      const originalTotal = state.total;
      const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;

      const orderData: any = {
        total: finalTotal,
        original_total: originalTotal,
        discount_amount: discountAmount,
        coupon_id: appliedCoupon?.couponId || null,
        coupon_code: appliedCoupon?.couponCode || null,
        customer_name: customerName || null,
        table_number: tableNumber!,
        status: "pending",
        ready_to_pay: readyToPay,
        customer_phone: verifiedPhone,
        session_id: sessionId, // Add session ID for user isolation
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = state.items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        item_price: item.menuItem.price,
        selected_add_ons: item.selectedAddOns,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Apply coupon if one was used
      if (appliedCoupon) {
        try {
          await fetch("/api/coupons/apply", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              couponId: appliedCoupon.couponId,
              orderId: order.id,
            }),
          });
        } catch (couponError) {
          console.error("Error applying coupon:", couponError);
          // Don't fail the entire order if coupon application fails
        }
      }

      // Clear cart and coupon
      dispatch({ type: "CLEAR_CART" });
      setAppliedCoupon(null);

      toast({
        title: readyToPay ? "Ready to pay!" : "Order placed successfully!",
        description: readyToPay
          ? `Order #${order.id.slice(
              -8
            )} is ready for payment at Table ${tableNumber}.`
          : `Your order #${order.id.slice(-8)} has been sent to the kitchen.`,
      });

      router.push("/");
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error placing order",
        description: "Please try again or contact staff for assistance.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePhoneVerified = (phone: string) => {
    setVerifiedPhone(phone);
    setShowPhoneAuth(false);
  };

  const handleCouponApplied = (couponData: {
    couponId: string;
    discountAmount: number;
    finalTotal: number;
    couponCode: string;
  }) => {
    setAppliedCoupon(couponData);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Menu
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 ml-4">
                Your Cart
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Link href="/">
              <Button>Browse Menu</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Menu
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 ml-4">
                Your Cart {tableNumber && `- Table ${tableNumber}`}
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {state.items.map((item, index) => {
                const addOnsTotal = item.selectedAddOns.reduce(
                  (sum, addOn) => sum + addOn.price,
                  0
                );
                const itemTotal =
                  (item.menuItem.price + addOnsTotal) * item.quantity;

                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{item.menuItem.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index.toString())}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        ₹{item.menuItem.price.toFixed(2)}
                      </p>

                      {item.selectedAddOns.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">Add-ons:</p>
                          <ul className="text-sm text-gray-600">
                            {item.selectedAddOns.map((addOn) => (
                              <li key={addOn.id}>
                                {addOn.name} (+₹{addOn.price.toFixed(2)})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Notes:</span>{" "}
                          {item.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(
                                index.toString(),
                                item.quantity - 1
                              )
                            }
                            className="h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(
                                index.toString(),
                                item.quantity + 1
                              )
                            }
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-semibold">₹{itemTotal.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tableNumber && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">
                        🪑 Table {tableNumber}
                      </p>
                    </div>
                  )}

                  {verifiedPhone && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        📱 {verifiedPhone}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name (Optional)</Label>
                    <Input
                      id="customerName"
                      placeholder="Your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <Separator />

                  {/* Coupon Input - Only show if phone is verified */}
                  {verifiedPhone && (
                    <>
                      <CouponInput
                        orderTotal={state.total}
                        customerPhone={verifiedPhone}
                        onCouponApplied={handleCouponApplied}
                        onCouponRemoved={handleCouponRemoved}
                        appliedCoupon={appliedCoupon}
                      />
                      <Separator />
                    </>
                  )}

                  {/* Order Summary */}
                  <div className="space-y-2">
                    {appliedCoupon && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>₹{state.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount ({appliedCoupon.couponCode}):</span>
                          <span>
                            -₹{appliedCoupon.discountAmount.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total:</span>
                      <span>
                        ₹
                        {(appliedCoupon
                          ? appliedCoupon.finalTotal
                          : state.total
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => placeOrder(false)}
                      disabled={isPlacingOrder}
                      className="w-full"
                    >
                      {isPlacingOrder ? "Placing Order..." : "Place Order"}
                    </Button>

                    <Button
                      onClick={() => placeOrder(true)}
                      disabled={isPlacingOrder}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      {isPlacingOrder ? "Processing..." : "Pay Bill"}
                    </Button>
                  </div>

                  {!verifiedPhone && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        📱 Phone verification required to place order
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <PhoneAuthModal
        isOpen={showPhoneAuth}
        onClose={() => setShowPhoneAuth(false)}
        onSuccess={handlePhoneVerified}
      />
    </>
  );
}
