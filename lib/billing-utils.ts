import { supabase } from "./supabase"

export type BillCalculation = {
  subtotal: number
  cgstAmount: number
  sgstAmount: number
  totalGst: number
  serviceChargeAmount: number
  serviceChargePercentage: number
  finalTotal: number
  isServiceChargeEnabled: boolean
}

export type MenuItem = {
  id: string
  name: string
  price: number
  gst_rate: number
  is_tax_included: boolean
}

export type CartItem = {
  menuItem: MenuItem
  quantity: number
  selectedAddOns: Array<{ name: string; price: number }>
  notes: string
}

// Get global settings from database
export async function getGlobalSettings(): Promise<Record<string, any>> {
  try {
    console.log("Fetching global settings...")
    const { data, error } = await supabase.from("global_settings").select("setting_key, setting_value, setting_type")

    if (error) {
      console.error("Error fetching global settings:", error)
      throw error
    }

    console.log("Raw settings data:", data)

    const settings: Record<string, any> = {}
    data?.forEach((setting) => {
      let value: any = setting.setting_value

      // Convert based on type
      if (setting.setting_type === "number") {
        value = Number.parseFloat(setting.setting_value)
      } else if (setting.setting_type === "boolean") {
        value = setting.setting_value.toLowerCase() === "true"
      }

      settings[setting.setting_key] = value
    })

    console.log("Processed settings:", settings)
    return settings
  } catch (error) {
    console.error("Error fetching global settings:", error)
    // Return default values if database fetch fails
    return {
      service_charge_percentage: 10,
      service_charge_enabled: true,
      cgst_rate: 2.5,
      sgst_rate: 2.5,
      default_gst_rate: 5,
      restaurant_name: "DYU Art Cafe",
      restaurant_address: "123 Main Street, City, State - 123456",
      restaurant_phone: "+91 9876543210",
      restaurant_gstin: "22AAAAA0000A1Z5",
      number_of_tables: 15,
    }
  }
}

// Update global setting with proper UPSERT
export async function updateGlobalSetting(key: string, value: string, type = "string"): Promise<boolean> {
  try {
    console.log(`Updating setting: ${key} = ${value} (${type})`)

    // Use upsert with onConflict to handle existing keys
    const { data, error } = await supabase
      .from("global_settings")
      .upsert(
        {
          setting_key: key,
          setting_value: value,
          setting_type: type,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "setting_key", // Specify the conflict column
        },
      )
      .select()

    if (error) {
      console.error("Error updating global setting:", error)
      throw error
    }

    console.log("Setting updated successfully:", data)
    return true
  } catch (error) {
    console.error("Error updating global setting:", error)
    return false
  }
}

// Alternative update method using UPDATE with WHERE clause
export async function updateGlobalSettingAlternative(key: string, value: string, type = "string"): Promise<boolean> {
  try {
    console.log(`Updating setting (alternative method): ${key} = ${value} (${type})`)

    // First, try to update existing record
    const { data: updateData, error: updateError } = await supabase
      .from("global_settings")
      .update({
        setting_value: value,
        setting_type: type,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", key)
      .select()

    if (updateError) {
      console.error("Error in update:", updateError)
      throw updateError
    }

    // If no rows were updated, insert new record
    if (!updateData || updateData.length === 0) {
      console.log("No existing record found, inserting new one...")
      const { data: insertData, error: insertError } = await supabase
        .from("global_settings")
        .insert({
          setting_key: key,
          setting_value: value,
          setting_type: type,
        })
        .select()

      if (insertError) {
        console.error("Error in insert:", insertError)
        throw insertError
      }

      console.log("Setting inserted successfully:", insertData)
    } else {
      console.log("Setting updated successfully:", updateData)
    }

    return true
  } catch (error) {
    console.error("Error updating global setting (alternative method):", error)
    return false
  }
}

// Calculate bill with GST and service charges
export async function calculateBill(cartItems: CartItem[]): Promise<BillCalculation> {
  const settings = await getGlobalSettings()

  const serviceChargePercentage = settings.service_charge_percentage || 10
  const isServiceChargeEnabled = settings.service_charge_enabled !== false
  const cgstRate = settings.cgst_rate || 2.5
  const sgstRate = settings.sgst_rate || 2.5

  // Calculate subtotal (base prices without tax)
  let subtotal = 0

  cartItems.forEach((item) => {
    const itemPrice = item.menuItem.price
    const addOnsTotal = item.selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0)
    const itemTotal = (itemPrice + addOnsTotal) * item.quantity

    // If tax is included in the price, we need to extract the base price
    if (item.menuItem.is_tax_included) {
      const gstRate = item.menuItem.gst_rate || 5
      const basePrice = itemTotal / (1 + gstRate / 100)
      subtotal += basePrice
    } else {
      subtotal += itemTotal
    }
  })

  // Calculate GST amounts
  const cgstAmount = (subtotal * cgstRate) / 100
  const sgstAmount = (subtotal * sgstRate) / 100
  const totalGst = cgstAmount + sgstAmount

  // Calculate service charge
  const serviceChargeAmount = isServiceChargeEnabled ? (subtotal * serviceChargePercentage) / 100 : 0

  // Calculate final total
  const finalTotal = subtotal + totalGst + serviceChargeAmount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    totalGst: Math.round(totalGst * 100) / 100,
    serviceChargeAmount: Math.round(serviceChargeAmount * 100) / 100,
    serviceChargePercentage,
    finalTotal: Math.round(finalTotal * 100) / 100,
    isServiceChargeEnabled,
  }
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`
}

// Generate bill receipt data
export async function generateBillReceipt(cartItems: CartItem[], billCalculation: BillCalculation) {
  const settings = await getGlobalSettings()

  return {
    restaurantInfo: {
      name: settings.restaurant_name || "DYU Art Cafe",
      address: settings.restaurant_address || "123 Main Street, City, State - 123456",
      phone: settings.restaurant_phone || "+91 9876543210",
      gstin: settings.restaurant_gstin || "22AAAAA0000A1Z5",
    },
    billDetails: billCalculation,
    items: cartItems.map((item) => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      rate: item.menuItem.price,
      addOns: item.selectedAddOns,
      gstRate: item.menuItem.gst_rate,
      isTaxIncluded: item.menuItem.is_tax_included,
      total: (item.menuItem.price + item.selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0)) * item.quantity,
    })),
    timestamp: new Date().toISOString(),
  }
}
