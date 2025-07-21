"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SimpleAdminAuth } from "@/components/simple-admin-auth";
import { AdminMenuManager } from "@/components/admin-menu-manager";
import { AdminCategoryManager } from "@/components/admin-category-manager";
import { AdminAnalytics } from "@/components/admin-analytics";
import { AdminBillingSettings } from "@/components/admin-billing-settings";

// Simple auth functions inline to avoid import issues
function isAdminLoggedIn() {
  if (typeof window === "undefined") return false;
  try {
    const session = localStorage.getItem("admin_session");
    if (!session) return false;
    const adminData = JSON.parse(session);
    const isValid = Date.now() - adminData.loginTime < 24 * 60 * 60 * 1000;
    return isValid;
  } catch {
    return false;
  }
}

function getAdminSession() {
  if (typeof window === "undefined") return null;
  try {
    const session = localStorage.getItem("admin_session");
    if (!session) return null;
    const adminData = JSON.parse(session);
    const isValid = Date.now() - adminData.loginTime < 24 * 60 * 60 * 1000;
    return isValid ? adminData : null;
  } catch {
    return null;
  }
}

function adminLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_session");
  }
}

type Order = {
  id: string;
  total: number;
  status: string;
  ready_to_pay: boolean;
  customer_name: string | null;
  table_number: number | null;
  created_at: string;
  updated_at: string;
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const loggedIn = isAdminLoggedIn();
    const session = getAdminSession();

    setIsAuthenticated(loggedIn);
    setAdminInfo(session);
    setLoading(false);

    if (loggedIn) {
      loadOrders();
      setupRealtimeSubscription();
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
    setAdminInfo(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const loadOrders = async () => {
    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setOrders(data);

      // Load order items
      const { data: items } = await supabase.from("order_items").select(`
          *,
          menu_items (name, price)
        `);

      if (items) setOrderItems(items);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          toast({
            title: "New Order!",
            description: `Order #${payload.new.id.slice(-8)} has been placed.`,
          });
          loadOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          if (payload.new.ready_to_pay && !payload.old.ready_to_pay) {
            toast({
              title: "Payment Request",
              description: `Customer wants to pay for order #${payload.new.id.slice(
                -8
              )}.`,
            });
          }
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update order status.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Order Updated",
          description: `Order status changed to ${status}.`,
        });
        loadOrders();
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SimpleAdminAuth onAuthSuccess={checkAuth} />;
  }

  const pendingOrders = orders.filter((order) => order.status === "pending");
  const readyToPayOrders = orders.filter(
    (order) => order.ready_to_pay && order.status !== "completed"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {adminInfo?.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {readyToPayOrders.length > 0 && (
                <Badge variant="destructive" className="flex items-center">
                  💰 {readyToPayOrders.length} Ready to Pay
                </Badge>
              )}
              {pendingOrders.length > 0 && (
                <Badge variant="default" className="flex items-center">
                  🔔 {pendingOrders.length} New Orders
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="ml-auto sm:ml-0"
              >
                🚪 Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs defaultValue="orders" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full flex overflow-x-auto gap-1 sm:gap-2 p-1 bg-transparent">
            <TabsTrigger value="orders" className="flex-1 sm:flex-none">
              Orders
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 sm:flex-none">
              Categories
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex-1 sm:flex-none">
              Menu
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex-1 sm:flex-none">
              Billing
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 sm:flex-none">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Ready to Pay Orders */}
            {readyToPayOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  💰 Ready to Pay ({readyToPayOrders.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {readyToPayOrders.map((order) => {
                    const items = orderItems.filter(
                      (item) => item.order_id === order.id
                    );
                    return (
                      <Card
                        key={order.id}
                        className="border-green-200 bg-green-50"
                      >
                        <CardHeader className="p-4 sm:p-6">
                          <CardTitle className="flex flex-wrap gap-2 justify-between items-center text-base sm:text-lg">
                            <span>#{order.id.slice(-8)}</span>
                            <Badge variant="outline" className="bg-green-100">
                              Ready to Pay
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {order.customer_name &&
                              `Customer: ${order.customer_name}`}
                            {order.table_number &&
                              ` • Table ${order.table_number}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                          <div className="space-y-2 mb-4">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-wrap justify-between text-sm gap-1"
                              >
                                <span className="min-w-[60%]">
                                  {item.quantity}x{" "}
                                  {item.menu_items?.name || "Unknown Item"}
                                </span>
                                <span className="font-medium">
                                  ₹
                                  {(item.item_price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between font-semibold mb-4 text-base sm:text-lg">
                            <span>Total:</span>
                            <span>₹{order.total.toFixed(2)}</span>
                          </div>
                          <Button
                            onClick={() =>
                              updateOrderStatus(order.id, "completed")
                            }
                            className="w-full"
                            variant="default"
                          >
                            ✅ Mark as Paid
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending Orders */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                ⏰ Pending Orders ({pendingOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map((order) => {
                  const items = orderItems.filter(
                    (item) => item.order_id === order.id
                  );
                  return (
                    <Card key={order.id}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>#{order.id.slice(-8)}</span>
                          <Badge variant="secondary">Pending</Badge>
                        </CardTitle>
                        <CardDescription>
                          {order.customer_name &&
                            `Customer: ${order.customer_name}`}
                          {order.table_number &&
                            ` • Table ${order.table_number}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          {items.map((item) => (
                            <div key={item.id}>
                              <div className="flex justify-between text-sm">
                                <span>
                                  {item.quantity}x{" "}
                                  {item.menu_items?.name || "Unknown Item"}
                                </span>
                                <span>
                                  ₹
                                  {(item.item_price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                              {item.selected_add_ons &&
                                item.selected_add_ons.length > 0 && (
                                  <div className="text-xs text-gray-600 ml-4">
                                    Add-ons:{" "}
                                    {item.selected_add_ons
                                      .map((addon: any) => addon.name)
                                      .join(", ")}
                                  </div>
                                )}
                              {item.notes && (
                                <div className="text-xs text-gray-600 ml-4">
                                  Notes: {item.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between font-semibold mb-4">
                          <span>Total:</span>
                          <span>₹{order.total.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2">
                          <Button
                            onClick={() =>
                              updateOrderStatus(order.id, "preparing")
                            }
                            className="w-full"
                            variant="outline"
                          >
                            🍳 Start Preparing
                          </Button>
                          <Button
                            onClick={() => updateOrderStatus(order.id, "ready")}
                            className="w-full"
                          >
                            ✅ Mark as Ready
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {pendingOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No pending orders at the moment.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <AdminCategoryManager />
          </TabsContent>

          <TabsContent value="menu">
            <AdminMenuManager />
          </TabsContent>

          <TabsContent value="billing">
            <AdminBillingSettings />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
