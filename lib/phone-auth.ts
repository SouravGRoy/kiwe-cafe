// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Store OTP in localStorage temporarily (in production, use a proper backend)
export function storeOTP(phone: string, otp: string) {
  const otpData = {
    phone,
    otp,
    timestamp: Date.now(),
    verified: false,
  }
  localStorage.setItem(`otp_${phone}`, JSON.stringify(otpData))

  // Auto-expire after 5 minutes
  setTimeout(
    () => {
      localStorage.removeItem(`otp_${phone}`)
    },
    5 * 60 * 1000,
  )
}

// Send OTP (simulate SMS - in production, integrate with SMS service)
export async function sendOTP(phone: string): Promise<{ success: boolean; otp?: string; error?: string }> {
  try {
    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return { success: false, error: "Please enter a valid 10-digit mobile number" }
    }

    const otp = generateOTP()
    storeOTP(phone, otp)

    // In production, send actual SMS here
    console.log(`SMS to ${phone}: Your OTP is ${otp}`)

    // For demo purposes, show OTP in alert
    alert(`Demo OTP for ${phone}: ${otp}`)

    return { success: true, otp } // Remove otp from return in production
  } catch (error) {
    return { success: false, error: "Failed to send OTP" }
  }
}

// Verify OTP
export function verifyOTP(phone: string, enteredOTP: string): { success: boolean; error?: string } {
  try {
    const storedData = localStorage.getItem(`otp_${phone}`)
    if (!storedData) {
      return { success: false, error: "OTP expired or not found" }
    }

    const otpData = JSON.parse(storedData)

    // Check if OTP is expired (5 minutes)
    if (Date.now() - otpData.timestamp > 5 * 60 * 1000) {
      localStorage.removeItem(`otp_${phone}`)
      return { success: false, error: "OTP expired" }
    }

    if (otpData.otp === enteredOTP) {
      // Mark as verified
      otpData.verified = true
      localStorage.setItem(`otp_${phone}`, JSON.stringify(otpData))

      // Store verified phone session
      localStorage.setItem("verified_phone", phone)

      return { success: true }
    } else {
      return { success: false, error: "Invalid OTP" }
    }
  } catch (error) {
    return { success: false, error: "Verification failed" }
  }
}

// Check if phone is verified
export function isPhoneVerified(): string | null {
  return localStorage.getItem("verified_phone")
}

// Clear phone verification
export function clearPhoneVerification() {
  localStorage.removeItem("verified_phone")
  // Clear all OTP data
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("otp_")) {
      localStorage.removeItem(key)
    }
  })
}
