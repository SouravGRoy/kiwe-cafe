import { supabase } from "./supabase"

export async function signIn(email: string, password: string) {
  try {
    console.log("Attempting to sign in with:", email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log("Sign in response:", { data, error })
    return { data, error }
  } catch (err) {
    console.error("Sign in error:", err)
    return { data: null, error: err }
  }
}

export async function signUp(email: string, password: string) {
  try {
    console.log("Attempting to sign up with:", email)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation for development
      },
    })

    console.log("Sign up response:", { data, error })
    return { data, error }
  } catch (err) {
    console.error("Sign up error:", err)
    return { data: null, error: err }
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("Current user:", { user, error })
    return user
  } catch (err) {
    console.error("Get current user error:", err)
    return null
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    console.log("User profile:", { data, error })
    return { data, error }
  } catch (err) {
    console.error("Get user profile error:", err)
    return { data: null, error: err }
  }
}
