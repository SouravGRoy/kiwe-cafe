"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getSelectedTable } from "@/lib/table-storage";
import { isPhoneVerified } from "@/lib/phone-auth";
import { PhoneAuthModal } from "@/components/phone-auth-modal";
import {
  calculateBill,
  formatCurrency,
  type BillCalculation,
} from "@/lib/billing-utils";
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  Wallet,
  Smartphone,
  Info,
  FileText,
} from "lucide-react";
import Link from "next/link";

type Order = {
  id: string;
  total: number;
  status: string;
  ready_to_pay: boolean;
  customer_name: string | null;
  customer_phone: string | null;
  table_number: number | null;
  created_at: string;
  updated_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  menu_item_name: string | null;
  quantity: number;
  item_price: number;
  selected_add_ons: any[];
  notes: string | null;
  menu_items?: {
    name: string;
    price: number;
    gst_rate: number;
    is_tax_included: boolean;
  };
};

type CartItem = {
  menuItem: {
    id: string;
    name: string;
    price: number;
    gst_rate: number;
    is_tax_included: boolean;
  };
  quantity: number;
  selectedAddOns: Array<{ name: string; price: number }>;
  notes: string;
};

export default function PayBillPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [billCalculations, setBillCalculations] = useState<
    Record<string, BillCalculation>
  >({});
  const [loading, setLoading] = useState(true);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const currentTable = getSelectedTable();
    const phone = isPhoneVerified();

    setTableNumber(currentTable);
    setVerifiedPhone(phone);

    if (currentTable) {
      loadOrders(currentTable);
    }

    setLoading(false);
  }, []);

  const loadOrders = async (table: number) => {
    try {
      // Get current session ID for secure filtering
      let sessionId = localStorage.getItem("current_session_id");
      const verifiedPhone = localStorage.getItem("verified_phone");

      // If no session ID but user is verified, create one
      if (!sessionId && verifiedPhone && table) {
        sessionId = `${verifiedPhone}_table_${table}`;
        localStorage.setItem("current_session_id", sessionId);
      }

      if (!sessionId) {
        console.warn("No session ID found, user needs to authenticate");
        setOrders([]);
        return;
      }

      // Load orders for this session (phone + table combination)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("session_id", sessionId)
        .in("status", ["pending", "preparing", "ready"])
        .order("created_at", { ascending: false });

      if (orderError) {
        console.error("Error loading orders:", orderError);
        return;
      }

      if (orderData) {
        setOrders(orderData);

        // Load order items for these orders with menu item details
        const orderIds = orderData.map((order) => order.id);
        if (orderIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select(
              `
              *,
              menu_items (name, price, gst_rate, is_tax_included)
            `
            )
            .in("order_id", orderIds);

          if (itemsData && !itemsError) {
            setOrderItems(itemsData);

            // Calculate detailed bills for each order
            await calculateOrderBills(orderData, itemsData);
          }
        }
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const calculateOrderBills = async (orders: Order[], items: OrderItem[]) => {
    const calculations: Record<string, BillCalculation> = {};

    for (const order of orders) {
      const orderItemsForOrder = items.filter(
        (item) => item.order_id === order.id
      );

      // Convert order items to cart items format for calculation
      const cartItems: CartItem[] = orderItemsForOrder.map((item) => ({
        menuItem: {
          id: item.menu_item_id || "",
          name: item.menu_items?.name || item.menu_item_name || "Unknown Item",
          price: item.menu_items?.price || item.item_price,
          gst_rate: item.menu_items?.gst_rate || 5,
          is_tax_included: item.menu_items?.is_tax_included || false,
        },
        quantity: item.quantity,
        selectedAddOns: item.selected_add_ons || [],
        notes: item.notes || "",
      }));

      if (cartItems.length > 0) {
        const billCalc = await calculateBill(cartItems);
        calculations[order.id] = billCalc;
      }
    }

    setBillCalculations(calculations);
  };

  const handlePayBill = async (orderId: string) => {
    if (!verifiedPhone) {
      setShowPhoneAuth(true);
      return;
    }

    setPayingOrderId(orderId);

    try {
      const billCalc = billCalculations[orderId];
      if (!billCalc) {
        throw new Error("Bill calculation not available");
      }

      // Update order status to completed and mark as paid
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
          ready_to_pay: true,
          total: billCalc.finalTotal, // Update with calculated total
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      // Create analytics entry with detailed billing breakdown
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        await supabase.from("analytics").insert({
          order_id: orderId,
          table_number: order.table_number,
          total_amount: billCalc.finalTotal,
          subtotal: billCalc.subtotal,
          cgst_amount: billCalc.cgstAmount,
          sgst_amount: billCalc.sgstAmount,
          service_charge_amount: billCalc.serviceChargeAmount,
          service_charge_percentage: billCalc.serviceChargePercentage,
          payment_method: "cash", // Default to cash, can be extended
          customer_phone: verifiedPhone,
          order_date: order.created_at,
          payment_date: new Date().toISOString(),
        });
      }

      toast({
        title: "Payment Successful! 🎉",
        description: `Bill paid successfully. Order #${orderId.slice(
          -8
        )} is now complete.`,
      });

      // Reload orders to update the list
      if (tableNumber) {
        loadOrders(tableNumber);
      }
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Failed",
        description:
          "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPayingOrderId(null);
    }
  };

  const handlePhoneVerified = (phone: string) => {
    setVerifiedPhone(phone);
    setShowPhoneAuth(false);
  };

  const getOrderItems = (orderId: string) => {
    return orderItems.filter((item) => item.order_id === orderId);
  };

  const getTotalBill = () => {
    return Object.values(billCalculations).reduce(
      (sum, calc) => sum + calc.finalTotal,
      0
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!tableNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Please select your table first</p>
            <Link href="/">
              <Button>Go to Menu</Button>
            </Link>
          </CardContent>
        </Card>
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
                Pay Bill - Table {tableNumber}
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Orders Found
              </h2>
              <p className="text-gray-600 mb-6">
                You don't have any pending orders for this table.
              </p>
              <Link href="/">
                <Button>Browse Menu</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Card with Detailed Billing */}
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Bill Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.keys(billCalculations).length > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>
                            {formatCurrency(
                              Object.values(billCalculations).reduce(
                                (sum, calc) => sum + calc.subtotal,
                                0
                              )
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>CGST (2.5%):</span>
                          <span>
                            {formatCurrency(
                              Object.values(billCalculations).reduce(
                                (sum, calc) => sum + calc.cgstAmount,
                                0
                              )
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>SGST (2.5%):</span>
                          <span>
                            {formatCurrency(
                              Object.values(billCalculations).reduce(
                                (sum, calc) => sum + calc.sgstAmount,
                                0
                              )
                            )}
                          </span>
                        </div>
                        {Object.values(billCalculations).some(
                          (calc) => calc.isServiceChargeEnabled
                        ) && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Service Charge:</span>
                            <span>
                              {formatCurrency(
                                Object.values(billCalculations).reduce(
                                  (sum, calc) => sum + calc.serviceChargeAmount,
                                  0
                                )
                              )}
                            </span>
                          </div>
                        )}
                        <Separator />
                      </>
                    )}
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-bold text-2xl text-orange-600">
                        {formatCurrency(getTotalBill())}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {orders.length} order{orders.length > 1 ? "s" : ""} •
                      Table {tableNumber}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Orders with Detailed Bills */}
              {orders.map((order) => {
                const items = getOrderItems(order.id);
                const billCalc = billCalculations[order.id];
                const isProcessingPayment = payingOrderId === order.id;

                return (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Order #{order.id.slice(-8)}
                          </CardTitle>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            order.status === "ready"
                              ? "default"
                              : order.status === "preparing"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {order.status === "ready"
                            ? "Ready"
                            : order.status === "preparing"
                            ? "Preparing"
                            : "Pending"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* Order Items */}
                      <div className="space-y-3 mb-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {item.quantity}x{" "}
                                  {item.menu_items?.name ||
                                    item.menu_item_name ||
                                    "Unknown Item"}
                                </span>
                                {item.menu_items && (
                                  <div className="flex gap-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      GST: {item.menu_items.gst_rate}%
                                    </Badge>
                                    {item.menu_items.is_tax_included && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Tax Incl.
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Add-ons */}
                              {item.selected_add_ons &&
                                item.selected_add_ons.length > 0 && (
                                  <div className="text-sm text-gray-600 ml-4">
                                    Add-ons:{" "}
                                    {item.selected_add_ons
                                      .map((addon: any) => addon.name)
                                      .join(", ")}
                                  </div>
                                )}

                              {/* Notes */}
                              {item.notes && (
                                <div className="text-sm text-gray-600 ml-4">
                                  Note: {item.notes}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                ₹{(item.item_price * item.quantity).toFixed(2)}
                              </div>
                              {item.selected_add_ons &&
                                item.selected_add_ons.length > 0 && (
                                  <div className="text-sm text-gray-600">
                                    +₹
                                    {(
                                      item.selected_add_ons.reduce(
                                        (sum: number, addon: any) =>
                                          sum + addon.price,
                                        0
                                      ) * item.quantity
                                    ).toFixed(2)}
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Detailed Bill Calculation */}
                      {billCalc && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-sm">
                              Bill Breakdown
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(billCalc.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>CGST (2.5%):</span>
                              <span>{formatCurrency(billCalc.cgstAmount)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>SGST (2.5%):</span>
                              <span>{formatCurrency(billCalc.sgstAmount)}</span>
                            </div>
                            {billCalc.isServiceChargeEnabled && (
                              <div className="flex justify-between text-gray-600">
                                <span>
                                  Service Charge (
                                  {billCalc.serviceChargePercentage}%):
                                </span>
                                <span>
                                  {formatCurrency(billCalc.serviceChargeAmount)}
                                </span>
                              </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>{formatCurrency(billCalc.finalTotal)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment Section */}
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-lg font-bold">
                            {billCalc
                              ? formatCurrency(billCalc.finalTotal)
                              : `₹${order.total.toFixed(2)}`}
                          </div>
                          {order.customer_name && (
                            <div className="text-sm text-gray-600">
                              Customer: {order.customer_name}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handlePayBill(order.id)}
                            disabled={isProcessingPayment}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isProcessingPayment ? (
                              "Processing..."
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay{" "}
                                {billCalc
                                  ? formatCurrency(billCalc.finalTotal)
                                  : `₹${order.total.toFixed(2)}`}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Payment Methods Info */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-medium text-blue-900 mb-3">
                    Payment Methods Available
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-sm text-blue-800">Cash</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-sm text-blue-800">Card</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-sm text-blue-800">UPI</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 text-center mt-3">
                    Please pay at the counter or inform the staff
                  </p>
                </CardContent>
              </Card>

              {/* Tax Information */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      Tax Information
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      • GST is calculated as CGST (2.5%) + SGST (2.5%) = 5%
                      total
                    </p>
                    <p>• Service charge is applied on the subtotal amount</p>
                    <p>
                      • All prices are inclusive/exclusive of taxes as marked on
                      menu items
                    </p>
                  </div>
                </CardContent>
              </Card>

              {!verifiedPhone && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-orange-800 mb-3">
                      📱 Phone verification required to pay bill
                    </p>
                    <Button
                      onClick={() => setShowPhoneAuth(true)}
                      variant="outline"
                      className="bg-transparent"
                    >
                      Verify Phone Number
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
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
