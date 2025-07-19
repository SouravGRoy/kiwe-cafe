import { supabase } from "./supabase"

// Simple admin authentication without Supabase Auth
export async function adminLogin(email: string, password: string) {
  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single()

    if (error || !data) {
      return { success: false, error: "Invalid credentials" }
    }

    // Store admin session in localStorage
    localStorage.setItem(
      "admin_session",
      JSON.stringify({
        id: data.id,
        email: data.email,
        loginTime: Date.now(),
      }),
    )

    return { success: true, admin: data }
  } catch (error) {
    return { success: false, error: "Login failed" }
  }
}

export function getAdminSession() {
  try {
    const session = localStorage.getItem("admin_session")
    if (!session) return null

    const adminData = JSON.parse(session)

    // Check if session is less than 24 hours old
    const isValid = Date.now() - adminData.loginTime < 24 * 60 * 60 * 1000

    return isValid ? adminData : null
  } catch {
    return null
  }
}

export function adminLogout() {
  localStorage.removeItem("admin_session")
}

export function isAdminLoggedIn() {
  return getAdminSession() !== null
}
