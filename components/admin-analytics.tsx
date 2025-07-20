"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Award,
  MapPin,
  Clock,
} from "lucide-react";

type DailySales = {
  sale_date: string;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  tables_served: number;
  unique_customers: number;
};

type PopularItem = {
  item_name: string;
  total_quantity: number;
  order_count: number;
  total_revenue: number;
  average_price: number;
};

type TablePerformance = {
  table_number: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  active_days: number;
};

type AnalyticsData = {
  order_id: string;
  table_number: number;
  total_amount: number;
  payment_method: string;
  customer_phone: string | null;
  order_date: string;
  payment_date: string;
};

export function AdminAnalytics() {
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [tablePerformance, setTablePerformance] = useState<TablePerformance[]>(
    []
  );
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("7"); // days
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      // Load daily sales summary
      const { data: salesData } = await supabase
        .from("daily_sales_summary")
        .select("*")
        .limit(Number.parseInt(selectedPeriod));

      if (salesData) setDailySales(salesData);

      // Load popular items
      const { data: itemsData } = await supabase
        .from("popular_items")
        .select("*")
        .limit(10);

      if (itemsData) setPopularItems(itemsData);

      // Load table performance
      const { data: tablesData } = await supabase
        .from("table_performance")
        .select("*");

      if (tablesData) setTablePerformance(tablesData);

      // Load raw analytics data for additional calculations
      const { data: analyticsRaw } = await supabase
        .from("analytics")
        .select("*")
        .gte(
          "payment_date",
          new Date(
            Date.now() - Number.parseInt(selectedPeriod) * 24 * 60 * 60 * 1000
          ).toISOString()
        )
        .order("payment_date", { ascending: false });

      if (analyticsRaw) setAnalyticsData(analyticsRaw);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalRevenue = () => {
    return dailySales.reduce((sum, day) => sum + day.total_revenue, 0);
  };

  const getTotalOrders = () => {
    return dailySales.reduce((sum, day) => sum + day.total_orders, 0);
  };

  const getAverageOrderValue = () => {
    const total = getTotalRevenue();
    const orders = getTotalOrders();
    return orders > 0 ? total / orders : 0;
  };

  const getPaymentMethodStats = () => {
    const stats = analyticsData.reduce((acc, item) => {
      acc[item.payment_method] = (acc[item.payment_method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(stats).map(([method, count]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      count,
      percentage: ((count / analyticsData.length) * 100).toFixed(1),
    }));
  };

  const getBusiestHours = () => {
    const hourStats = analyticsData.reduce((acc, item) => {
      const hour = new Date(item.payment_date).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourStats)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        count,
        percentage: ((count / analyticsData.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  const paymentMethodStats = getPaymentMethodStats();
  const busiestHours = getBusiestHours();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{getTotalRevenue().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {selectedPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalOrders()}</div>
            <p className="text-xs text-muted-foreground">Orders completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{getAverageOrderValue().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Per order average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailySales.reduce((sum, day) => sum + day.unique_customers, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Phone verified customers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Sales</TabsTrigger>
          <TabsTrigger value="items">Popular Items</TabsTrigger>
          <TabsTrigger value="tables">Table Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Performance</CardTitle>
              <CardDescription>
                Revenue and order trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailySales.map((day, index) => (
                  <div
                    key={day.sale_date}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {new Date(day.sale_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {day.total_orders} orders • {day.tables_served} tables
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        ₹{day.total_revenue.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Avg: ₹{day.average_order_value.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Items</CardTitle>
              <CardDescription>
                Top selling menu items by quantity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularItems.map((item, index) => (
                  <div
                    key={item.item_name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-orange-600">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{item.item_name}</div>
                        <div className="text-sm text-gray-600">
                          {item.order_count} orders • ₹
                          {item.average_price.toFixed(2)} avg price
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {item.total_quantity} sold
                      </div>
                      <div className="text-sm text-gray-600">
                        ₹{item.total_revenue.toFixed(2)} revenue
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Table Performance</CardTitle>
              <CardDescription>
                Revenue and usage by table number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tablePerformance.map((table) => (
                  <Card key={table.table_number}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Table {table.table_number}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Orders:</span>
                          <span className="font-medium">
                            {table.total_orders}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Revenue:
                          </span>
                          <span className="font-medium">
                            ₹{table.total_revenue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Avg Order:
                          </span>
                          <span className="font-medium">
                            ₹{table.average_order_value.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Active Days:
                          </span>
                          <span className="font-medium">
                            {table.active_days}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethodStats.map((stat) => (
                    <div
                      key={stat.method}
                      className="flex items-center justify-between"
                    >
                      <span className="font-medium">{stat.method}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{stat.count} orders</Badge>
                        <span className="text-sm text-gray-600">
                          {stat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Busiest Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Busiest Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {busiestHours.map((hour, index) => (
                    <div
                      key={hour.hour}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{hour.hour}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{hour.count} orders</Badge>
                        <span className="text-sm text-gray-600">
                          {hour.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
