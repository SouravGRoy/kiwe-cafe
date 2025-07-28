"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Ticket,
  Gift,
  Star,
  Send,
  Calendar,
  Phone,
  IndianRupee,
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  customer_phone: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount: number | null;
  is_used: boolean;
  used_at: string | null;
  expires_at: string;
  generated_by: string;
  whatsapp_sent: boolean;
  created_at: string;
  coupon_types: {
    name: string;
    description: string;
  } | null;
  orders: {
    id: string;
    total: number;
    created_at: string;
  } | null;
}

export function AdminCouponDashboard() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [totalSavingsProvided, setTotalSavingsProvided] = useState(0);
  const [totalUsedCoupons, setTotalUsedCoupons] = useState(0);
  const { toast } = useToast();

  // Form state for creating new coupon
  const [newCoupon, setNewCoupon] = useState({
    customerPhone: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minimumOrderAmount: "",
    maximumDiscountAmount: "",
    expiresAt: "",
    sendWhatsApp: false,
  });

  const fetchCoupons = async (
    page = 1,
    search = "",
    type = filterType,
    status = filterStatus
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        type: type === "all" ? "" : type,
        status: status === "all" ? "" : status,
      });

      const response = await fetch(`/api/admin/coupons?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCoupons(data.coupons);
        setTotalPages(data.totalPages);
        setTotalSavingsProvided(data.totalSavingsProvided);
        setTotalUsedCoupons(data.totalUsedCoupons);
      } else {
        console.error("Error fetching coupons:", data.error);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons(currentPage, searchTerm, filterType, filterStatus);
  }, [currentPage, filterType, filterStatus]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCoupons(1, searchTerm, filterType, filterStatus);
  };

  const handleCreateCoupon = async () => {
    // Basic validation
    if (
      !newCoupon.customerPhone ||
      !newCoupon.discountValue ||
      !newCoupon.expiresAt
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerPhone: newCoupon.customerPhone,
          discountType: newCoupon.discountType,
          discountValue: parseFloat(newCoupon.discountValue),
          minimumOrderAmount: parseFloat(newCoupon.minimumOrderAmount) || 0,
          maximumDiscountAmount: newCoupon.maximumDiscountAmount
            ? parseFloat(newCoupon.maximumDiscountAmount)
            : null,
          expiresAt: newCoupon.expiresAt,
          sendWhatsApp: newCoupon.sendWhatsApp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Coupon ${data.coupon.code} created successfully`,
        });
        setShowCreateModal(false);
        setNewCoupon({
          customerPhone: "",
          discountType: "percentage",
          discountValue: "",
          minimumOrderAmount: "",
          maximumDiscountAmount: "",
          expiresAt: getDefaultExpiryDate(),
          sendWhatsApp: false,
        });
        // Refresh the coupon list
        fetchCoupons(currentPage, searchTerm, filterType, filterStatus);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create coupon",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast({
        title: "Error",
        description: "Failed to create coupon",
        variant: "destructive",
      });
    }
  };

  const getCouponTypeIcon = (type: string) => {
    switch (type) {
      case "WELCOME":
        return <Gift className="h-4 w-4 text-green-500" />;
      case "LOYALTY":
        return <Star className="h-4 w-4 text-yellow-500" />;
      case "CAMPAIGN":
        return <Send className="h-4 w-4 text-blue-500" />;
      default:
        return <Ticket className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCouponTypeColor = (type: string) => {
    switch (type) {
      case "WELCOME":
        return "bg-green-100 text-green-800";
      case "LOYALTY":
        return "bg-yellow-100 text-yellow-800";
      case "CAMPAIGN":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (coupon.is_used) {
      return <Badge className="bg-gray-100 text-gray-800">Used</Badge>;
    }

    const isExpired = new Date(coupon.expires_at) < new Date();
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}% off`;
    }
    return `₹${coupon.discount_value} off`;
  };

  // Set default expiry date to 30 days from now
  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  };

  const handleOpenCreateModal = () => {
    setNewCoupon({
      customerPhone: "",
      discountType: "percentage",
      discountValue: "",
      minimumOrderAmount: "",
      maximumDiscountAmount: "",
      expiresAt: getDefaultExpiryDate(),
      sendWhatsApp: false,
    });
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coupons Used</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsedCoupons}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Savings Given
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSavingsProvided}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Coupon Management</CardTitle>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Campaign Coupon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    id="customerPhone"
                    placeholder="10-digit phone number"
                    value={newCoupon.customerPhone}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        customerPhone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={newCoupon.discountType}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setNewCoupon({ ...newCoupon, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discountValue">
                    Discount Value{" "}
                    {newCoupon.discountType === "percentage" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    placeholder={
                      newCoupon.discountType === "percentage" ? "10" : "50"
                    }
                    value={newCoupon.discountValue}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        discountValue: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="minimumOrderAmount">
                    Minimum Order Amount (₹)
                  </Label>
                  <Input
                    id="minimumOrderAmount"
                    type="number"
                    placeholder="0"
                    value={newCoupon.minimumOrderAmount}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        minimumOrderAmount: e.target.value,
                      })
                    }
                  />
                </div>

                {newCoupon.discountType === "percentage" && (
                  <div>
                    <Label htmlFor="maximumDiscountAmount">
                      Maximum Discount Amount (₹)
                    </Label>
                    <Input
                      id="maximumDiscountAmount"
                      type="number"
                      placeholder="Optional"
                      value={newCoupon.maximumDiscountAmount}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          maximumDiscountAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="expiresAt">Expires On</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={newCoupon.expiresAt}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, expiresAt: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendWhatsApp"
                    checked={newCoupon.sendWhatsApp}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        sendWhatsApp: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="sendWhatsApp">Send via WhatsApp</Label>
                </div>

                <Button onClick={handleCreateCoupon} className="w-full">
                  Create Coupon
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by code or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="WELCOME">Welcome</SelectItem>
                <SelectItem value="LOYALTY">Loyalty</SelectItem>
                <SelectItem value="CAMPAIGN">Campaign</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unused">Active</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coupon Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Used On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading coupons...
                    </TableCell>
                  </TableRow>
                ) : coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No coupons found
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="font-mono font-bold">{coupon.code}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getCouponTypeColor(
                            coupon.coupon_types?.name || ""
                          )}
                        >
                          <div className="flex items-center gap-1">
                            {getCouponTypeIcon(coupon.coupon_types?.name || "")}
                            {coupon.coupon_types?.name}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {coupon.customer_phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{formatDiscount(coupon)}</div>
                        {coupon.minimum_order_amount > 0 && (
                          <div className="text-xs text-gray-500">
                            Min: ₹{coupon.minimum_order_amount}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(coupon)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(coupon.expires_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.is_used ? (
                          <div>{formatDate(coupon.used_at!)}</div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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
