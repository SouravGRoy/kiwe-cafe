import { createClient } from "@supabase/supabase-js"

// Use environment variables or fallback to demo values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export type MenuItem = {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  available: boolean
  created_at: string
  updated_at: string
}

export type AddOn = {
  id: string
  menu_item_id: string
  name: string
  price: number
  created_at: string
}

export type Order = {
  id: string
  total: number
  status: string
  ready_to_pay: boolean
  customer_name: string | null
  table_number: number | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  item_price: number
  selected_add_ons: AddOn[]
  notes: string | null
  created_at: string
}

export type CartItem = {
  menuItem: MenuItem
  quantity: number
  selectedAddOns: AddOn[]
  notes: string
}
