"use client";

import { useEffect, useState } from "react";
import { supabase, type MenuItem, type AddOn } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getGlobalSettings } from "@/lib/billing-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Percent,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";

type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
};

type MenuItemWithCategory = MenuItem & {
  category_id: string | null;
  food_type: string;
  gst_rate: number;
  is_tax_included: boolean;
  categories?: Category;
};

export function AdminMenuManager() {
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItemWithCategory | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    item: MenuItemWithCategory | null;
  }>({
    isOpen: false,
    item: null,
  });

  // Add mobile view detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [globalSettings, setGlobalSettings] = useState<Record<string, any>>({});
  const [imagePreview, setImagePreview] = useState<string>("");
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image_url: "",
    category_id: "",
    food_type: "veg",
    available: true,
    gst_rate: "",
    is_tax_included: false,
  });
  const [itemAddOns, setItemAddOns] = useState<
    { name: string; price: string }[]
  >([]);

  useEffect(() => {
    loadMenuItems();
    loadCategories();
    loadAddOns();
    loadGlobalSettings();
  }, []);

  // Update image preview when image_url changes
  useEffect(() => {
    setImagePreview(formData.image_url);
  }, [formData.image_url]);

  const loadGlobalSettings = async () => {
    const settings = await getGlobalSettings();
    setGlobalSettings(settings);
  };

  const loadMenuItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select(
        `
        *,
        categories (
          id,
          name,
          color
        )
      `
      )
      .order("name");

    if (error) {
      console.error("Error loading menu items:", error);
      return;
    }

    if (data) setMenuItems(data);
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      console.error("Error loading categories:", error);
      return;
    }

    if (data) setCategories(data);
  };

  const loadAddOns = async () => {
    const { data } = await supabase.from("add_ons").select("*");
    if (data) setAddOns(data);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
      image_url: "",
      category_id: "",
      food_type: "veg",
      available: true,
      gst_rate: globalSettings.default_gst_rate?.toString() || "5",
      is_tax_included: false,
    });
    setItemAddOns([]);
    setEditingItem(null);
    setImagePreview("");
  };

  const openDialog = (item?: MenuItemWithCategory) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price.toString(),
        description: item.description || "",
        image_url: item.image_url || "",
        category_id: item.category_id || "",
        food_type: item.food_type || "veg",
        available: item.available,
        gst_rate:
          item.gst_rate?.toString() ||
          globalSettings.default_gst_rate?.toString() ||
          "5",
        is_tax_included: item.is_tax_included || false,
      });

      // Load existing add-ons for this item
      const existingAddOns = addOns
        .filter((addOn) => addOn.menu_item_id === item.id)
        .map((addOn) => ({ name: addOn.name, price: addOn.price.toString() }));
      setItemAddOns(existingAddOns);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const addAddOn = () => {
    setItemAddOns([...itemAddOns, { name: "", price: "" }]);
  };

  const updateAddOn = (
    index: number,
    field: "name" | "price",
    value: string
  ) => {
    const updated = [...itemAddOns];
    updated[index][field] = value;
    setItemAddOns(updated);
  };

  const removeAddOn = (index: number) => {
    setItemAddOns(itemAddOns.filter((_, i) => i !== index));
  };

  const saveMenuItem = async () => {
    if (!formData.name || !formData.price || !formData.category_id) {
      toast({
        title: "Validation Error",
        description: "Name, price, and category are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const menuItemData = {
        name: formData.name,
        price: Number.parseFloat(formData.price),
        description: formData.description || null,
        image_url: formData.image_url || null,
        category_id: formData.category_id,
        food_type: formData.food_type,
        available: formData.available,
        gst_rate:
          Number.parseFloat(formData.gst_rate) ||
          globalSettings.default_gst_rate ||
          5,
        is_tax_included: formData.is_tax_included,
      };

      let menuItemId: string;

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("menu_items")
          .update(menuItemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        menuItemId = editingItem.id;

        // Delete existing add-ons
        await supabase
          .from("add_ons")
          .delete()
          .eq("menu_item_id", editingItem.id);
      } else {
        // Create new item
        const { data, error } = await supabase
          .from("menu_items")
          .insert(menuItemData)
          .select()
          .single();

        if (error) throw error;
        menuItemId = data.id;
      }

      // Add new add-ons
      if (itemAddOns.length > 0) {
        const addOnData = itemAddOns
          .filter((addOn) => addOn.name && addOn.price)
          .map((addOn) => ({
            menu_item_id: menuItemId,
            name: addOn.name,
            price: Number.parseFloat(addOn.price),
          }));

        if (addOnData.length > 0) {
          const { error } = await supabase.from("add_ons").insert(addOnData);
          if (error) throw error;
        }
      }

      toast({
        title: "Success",
        description: `Menu item ${
          editingItem ? "updated" : "created"
        } successfully.`,
      });

      loadMenuItems();
      loadAddOns();
      closeDialog();
    } catch (error: any) {
      console.error("Error saving menu item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save menu item.",
        variant: "destructive",
      });
    }
  };

  const checkItemUsage = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("id")
        .eq("menu_item_id", itemId)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error("Error checking item usage:", error);
      return false;
    }
  };

  const handleDeleteClick = async (item: MenuItemWithCategory) => {
    const isUsed = await checkItemUsage(item.id);
    setDeleteConfirm({ isOpen: true, item: { ...item, isUsed } as any });
  };

  const confirmDelete = async () => {
    const item = deleteConfirm.item;
    if (!item) return;

    try {
      // First, update order_items to store the menu item name for historical purposes
      await supabase
        .from("order_items")
        .update({ menu_item_name: item.name })
        .eq("menu_item_id", item.id)
        .is("menu_item_name", null);

      // Now delete the menu item (foreign key constraint will set menu_item_id to NULL in order_items)
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description:
          "Menu item deleted successfully. Order history has been preserved.",
      });

      loadMenuItems();
      loadAddOns();
      setDeleteConfirm({ isOpen: false, item: null });
    } catch (error: any) {
      console.error("Error deleting menu item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete menu item.",
        variant: "destructive",
      });
    }
  };

  const toggleAvailability = async (item: MenuItemWithCategory) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ available: !item.available })
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${item.name} is now ${
          !item.available ? "available" : "unavailable"
        }.`,
      });

      loadMenuItems();
    } catch (error: any) {
      console.error("Error updating availability:", error);
      toast({
        title: "Error",
        description: "Failed to update availability.",
        variant: "destructive",
      });
    }
  };

  const getFoodTypeColor = (foodType: string) => {
    switch (foodType) {
      case "veg":
        return "bg-green-100 text-green-800";
      case "non-veg":
        return "bg-red-100 text-red-800";
      case "egg":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Menu Items</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Update the menu item details."
                  : "Create a new menu item with pricing and tax settings."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Menu item name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="food_type">Food Type *</Label>
                  <Select
                    value={formData.food_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, food_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                      <SelectItem value="egg">Contains Egg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Section */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Item Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      placeholder="https://example.com/food-image.jpg"
                    />
                    <p className="text-xs text-gray-600">
                      Add a high-quality image URL for better customer
                      experience. Recommended size: 400x400px
                    </p>
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                          onError={() => setImagePreview("")}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* GST Settings */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Tax Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gst_rate">GST Rate (%)</Label>
                      <Input
                        id="gst_rate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="28"
                        value={formData.gst_rate}
                        onChange={(e) =>
                          setFormData({ ...formData, gst_rate: e.target.value })
                        }
                        placeholder={
                          globalSettings.default_gst_rate?.toString() || "5"
                        }
                      />
                      <p className="text-xs text-gray-600">
                        Default: {globalSettings.default_gst_rate || 5}%
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Tax Included in Price</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="is_tax_included"
                          checked={formData.is_tax_included}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              is_tax_included: checked,
                            })
                          }
                        />
                        <Label htmlFor="is_tax_included" className="text-sm">
                          {formData.is_tax_included
                            ? "Tax Included"
                            : "Tax Extra"}
                        </Label>
                      </div>
                      <p className="text-xs text-gray-600">
                        {formData.is_tax_included
                          ? "Price includes GST (MRP style)"
                          : "GST will be added to price"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the menu item..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, available: checked })
                  }
                />
                <Label htmlFor="available">Available</Label>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Add-ons</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAddOn}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Add-on
                  </Button>
                </div>

                {itemAddOns.map((addOn, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Add-on name"
                      value={addOn.name}
                      onChange={(e) =>
                        updateAddOn(index, "name", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={addOn.price}
                      onChange={(e) =>
                        updateAddOn(index, "price", e.target.value)
                      }
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAddOn(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={saveMenuItem}>
                {editingItem ? "Update" : "Create"} Menu Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => {
          const itemAddOns = addOns.filter(
            (addOn) => addOn.menu_item_id === item.id
          );

          return (
            <Card key={item.id} className={!item.available ? "opacity-75" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="text-green-600 font-semibold">
                      ₹{item.price.toFixed(2)}
                      {item.is_tax_included && (
                        <span className="text-xs ml-1">(incl. tax)</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={item.available ? "default" : "secondary"}>
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                    <Badge className={getFoodTypeColor(item.food_type)}>
                      {item.food_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Image Preview */}
                {item.image_url && (
                  <div className="mb-3">
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        width={200}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {item.categories && (
                  <div className="mb-2">
                    <Badge variant="outline">{item.categories.name}</Badge>
                  </div>
                )}

                {/* Tax Information */}
                <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                  <div className="flex justify-between">
                    <span>GST Rate:</span>
                    <span>{item.gst_rate || 5}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Status:</span>
                    <span>{item.is_tax_included ? "Included" : "Extra"}</span>
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {item.description}
                  </p>
                )}

                {itemAddOns.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Add-ons:</p>
                    <div className="flex flex-wrap gap-1">
                      {itemAddOns.map((addOn) => (
                        <Badge
                          key={addOn.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {addOn.name} (+₹{addOn.price.toFixed(2)})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={item.available}
                      onCheckedChange={() => toggleAvailability(item)}
                    />
                    <span className="text-sm">Available</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No menu items found. Create your first menu item to get started.
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => setDeleteConfirm({ isOpen: open, item: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Delete Menu Item
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete "{deleteConfirm.item?.name}"?
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This item will be removed from the
                  menu, but order history will be preserved. Past orders will
                  show the item name for reference.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
