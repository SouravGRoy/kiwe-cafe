"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  getGlobalSettings,
  updateGlobalSetting,
  updateGlobalSettingAlternative,
} from "@/lib/billing-utils";
import { Percent, Receipt, Building, RefreshCw } from "lucide-react";

export function AdminBillingSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log("Loading settings...");
      const globalSettings = await getGlobalSettings();
      console.log("Loaded settings:", globalSettings);
      setSettings(globalSettings);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error Loading Settings",
        description: "Failed to load settings. Using default values.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any, type = "string") => {
    console.log(`Setting changed: ${key} = ${value} (${type})`);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        {
          key: "service_charge_percentage",
          value: settings.service_charge_percentage || 10,
          type: "number",
        },
        {
          key: "service_charge_enabled",
          value: settings.service_charge_enabled !== false,
          type: "boolean",
        },
        {
          key: "default_gst_rate",
          value: settings.default_gst_rate || 5,
          type: "number",
        },
        { key: "cgst_rate", value: settings.cgst_rate || 2.5, type: "number" },
        { key: "sgst_rate", value: settings.sgst_rate || 2.5, type: "number" },
        {
          key: "restaurant_name",
          value: settings.restaurant_name || "DYU Art Cafe",
          type: "string",
        },
        {
          key: "restaurant_address",
          value: settings.restaurant_address || "",
          type: "string",
        },
        {
          key: "restaurant_phone",
          value: settings.restaurant_phone || "",
          type: "string",
        },
        {
          key: "restaurant_gstin",
          value: settings.restaurant_gstin || "",
          type: "string",
        },
        {
          key: "number_of_tables",
          value: settings.number_of_tables || 15,
          type: "number",
        },
      ];

      console.log("Saving settings:", settingsToSave);

      let successCount = 0;
      let errorCount = 0;

      for (const setting of settingsToSave) {
        try {
          // Try the primary method first
          let success = await updateGlobalSetting(
            setting.key,
            setting.value.toString(),
            setting.type
          );

          // If primary method fails, try alternative method
          if (!success) {
            console.log(
              `Primary method failed for ${setting.key}, trying alternative...`
            );
            success = await updateGlobalSettingAlternative(
              setting.key,
              setting.value.toString(),
              setting.type
            );
          }

          if (success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Both methods failed for setting: ${setting.key}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error saving setting ${setting.key}:`, error);
        }
      }

      if (errorCount === 0) {
        toast({
          title: "Settings Saved Successfully! 🎉",
          description: `All ${successCount} settings have been updated.`,
        });
        // Reload settings to confirm they were saved
        await loadSettings();
      } else {
        toast({
          title: "Partial Save",
          description: `${successCount} settings saved, ${errorCount} failed. Please try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Save Failed",
        description:
          "Failed to save settings. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const refreshSettings = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
    toast({
      title: "Settings Refreshed",
      description: "Settings have been reloaded from the database.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Billing Settings</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshSettings}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={saveAllSettings} disabled={saving}>
            {saving ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>

      {/* Debug Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">Debug Information</h4>
          <div className="text-sm text-blue-800">
            <p>Settings loaded: {Object.keys(settings).length} items</p>
            <p>
              Service charge enabled:{" "}
              {settings.service_charge_enabled ? "Yes" : "No"}
            </p>
            <p>Number of tables: {settings.number_of_tables || "Not set"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Charge Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Service Charge
            </CardTitle>
            <CardDescription>
              Configure service charge settings for all orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Service Charge</Label>
                <p className="text-sm text-gray-600">
                  Apply service charge to all bills
                </p>
              </div>
              <Switch
                checked={settings.service_charge_enabled !== false}
                onCheckedChange={(checked) =>
                  handleSettingChange(
                    "service_charge_enabled",
                    checked,
                    "boolean"
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_charge_percentage">
                Service Charge Percentage
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="service_charge_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="25"
                  value={settings.service_charge_percentage || 10}
                  onChange={(e) =>
                    handleSettingChange(
                      "service_charge_percentage",
                      Number.parseFloat(e.target.value) || 10,
                      "number"
                    )
                  }
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
              <p className="text-xs text-gray-500">Recommended: 10-15%</p>
            </div>
          </CardContent>
        </Card>

        {/* GST Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              GST Configuration
            </CardTitle>
            <CardDescription>
              Configure GST rates and tax settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default_gst_rate">Default GST Rate</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="default_gst_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="28"
                  value={settings.default_gst_rate || 5}
                  onChange={(e) =>
                    handleSettingChange(
                      "default_gst_rate",
                      Number.parseFloat(e.target.value) || 5,
                      "number"
                    )
                  }
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
              <p className="text-xs text-gray-500">For new menu items</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cgst_rate">CGST Rate</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cgst_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={settings.cgst_rate || 2.5}
                    onChange={(e) =>
                      handleSettingChange(
                        "cgst_rate",
                        Number.parseFloat(e.target.value) || 2.5,
                        "number"
                      )
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sgst_rate">SGST Rate</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sgst_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={settings.sgst_rate || 2.5}
                    onChange={(e) =>
                      handleSettingChange(
                        "sgst_rate",
                        Number.parseFloat(e.target.value) || 2.5,
                        "number"
                      )
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Total GST = CGST + SGST (Usually 2.5% + 2.5% = 5% for restaurants)
            </p>
          </CardContent>
        </Card>

        {/* Restaurant Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Restaurant Information
            </CardTitle>
            <CardDescription>
              Information that appears on bills and receipts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restaurant_name">Restaurant Name</Label>
                <Input
                  id="restaurant_name"
                  value={settings.restaurant_name || ""}
                  onChange={(e) =>
                    handleSettingChange("restaurant_name", e.target.value)
                  }
                  placeholder="DYU Art Cafe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurant_phone">Phone Number</Label>
                <Input
                  id="restaurant_phone"
                  value={settings.restaurant_phone || ""}
                  onChange={(e) =>
                    handleSettingChange("restaurant_phone", e.target.value)
                  }
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant_address">Address</Label>
              <Input
                id="restaurant_address"
                value={settings.restaurant_address || ""}
                onChange={(e) =>
                  handleSettingChange("restaurant_address", e.target.value)
                }
                placeholder="123 Main Street, City, State - 123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant_gstin">GSTIN Number</Label>
              <Input
                id="restaurant_gstin"
                value={settings.restaurant_gstin || ""}
                onChange={(e) =>
                  handleSettingChange("restaurant_gstin", e.target.value)
                }
                placeholder="22AAAAA0000A1Z5"
              />
              <p className="text-xs text-gray-500">
                15-digit GST Identification Number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_tables">Number of Tables</Label>
              <Input
                id="number_of_tables"
                type="number"
                min="1"
                max="100"
                value={settings.number_of_tables || 15}
                onChange={(e) =>
                  handleSettingChange(
                    "number_of_tables",
                    Number.parseInt(e.target.value) || 15,
                    "number"
                  )
                }
                placeholder="15"
              />
              <p className="text-xs text-gray-500">
                Total number of tables available for customers to select
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Preview</CardTitle>
          <CardDescription>
            Preview how charges will be calculated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sample Item (₹100 × 2)</span>
              <span>₹200.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>CGST ({settings.cgst_rate || 2.5}%)</span>
              <span>
                ₹{((200 * (settings.cgst_rate || 2.5)) / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>SGST ({settings.sgst_rate || 2.5}%)</span>
              <span>
                ₹{((200 * (settings.sgst_rate || 2.5)) / 100).toFixed(2)}
              </span>
            </div>
            {settings.service_charge_enabled !== false && (
              <div className="flex justify-between text-sm">
                <span>
                  Service Charge ({settings.service_charge_percentage || 10}%)
                </span>
                <span>
                  ₹
                  {(
                    (200 * (settings.service_charge_percentage || 10)) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>
                ₹
                {(
                  200 +
                  (200 * (settings.cgst_rate || 2.5)) / 100 +
                  (200 * (settings.sgst_rate || 2.5)) / 100 +
                  (settings.service_charge_enabled !== false
                    ? (200 * (settings.service_charge_percentage || 10)) / 100
                    : 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
