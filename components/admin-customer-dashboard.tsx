"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, UserCheck, Crown, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/billing-utils";

interface Customer {
  id: string;
  phone: string;
  first_name: string | null;
  last_name: string | null;
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  first_order_date: string;
  last_order_date: string;
  customer_tier: string;
  days_since_last_order: number;
}

interface CustomerStats {
  "New Customer": number;
  "Regular Customer": number;
  "VIP Customer": number;
}

export function AdminCustomerDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [stats, setStats] = useState<CustomerStats>({
    "New Customer": 0,
    "Regular Customer": 0,
    "VIP Customer": 0,
  });
  const [sortBy, setSortBy] = useState("last_order_date");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchCustomers = async (
    page = 1,
    search = "",
    sort = sortBy,
    order = sortOrder
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        sortBy: sort,
        sortOrder: order,
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers);
        setTotalPages(data.totalPages);
        setTotalCustomers(data.totalCustomers);
        setStats(data.stats);
      } else {
        console.error("Error fetching customers:", data.error);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(currentPage, searchTerm, sortBy, sortOrder);
  }, [currentPage, sortBy, sortOrder]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCustomers(1, searchTerm, sortBy, sortOrder);
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "VIP Customer":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "Regular Customer":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "VIP Customer":
        return "bg-yellow-100 text-yellow-800";
      case "Regular Customer":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats["New Customer"] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Regular Customers
            </CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats["Regular Customer"] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats["VIP Customer"] || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by phone, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>

            <Select value={sortBy} onValueChange={(value) => handleSort(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_order_date">Last Order Date</SelectItem>
                <SelectItem value="total_orders">Total Orders</SelectItem>
                <SelectItem value="total_spent">Total Spent</SelectItem>
                <SelectItem value="first_order_date">
                  First Order Date
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("total_orders")}
                  >
                    Orders{" "}
                    {sortBy === "total_orders" &&
                      (sortOrder === "desc" ? "↓" : "↑")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("total_spent")}
                  >
                    Total Spent{" "}
                    {sortBy === "total_spent" &&
                      (sortOrder === "desc" ? "↓" : "↑")}
                  </TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Days Since Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.phone}</div>
                          {(customer.first_name || customer.last_name) && (
                            <div className="text-sm text-gray-500">
                              {customer.first_name} {customer.last_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierColor(customer.customer_tier)}>
                          <div className="flex items-center gap-1">
                            {getTierIcon(customer.customer_tier)}
                            {customer.customer_tier}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.total_orders}</TableCell>
                      <TableCell>
                        {formatCurrency(customer.total_spent)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(customer.last_order_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            customer.days_since_last_order > 30
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {Math.floor(customer.days_since_last_order)} days
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
