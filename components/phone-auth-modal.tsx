"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { sendOTP, verifyOTP } from "@/lib/phone-auth";

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phone: string) => void;
}

export function PhoneAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: PhoneAuthModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSendOTP = async () => {
    setError("");
    setLoading(true);

    const result = await sendOTP(phone);

    if (result.success) {
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${phone}`,
      });
    } else {
      setError(result.error || "Failed to send OTP");
    }

    setLoading(false);
  };

  const handleVerifyOTP = () => {
    setError("");

    const result = verifyOTP(phone, otp);

    if (result.success) {
      toast({
        title: "Phone Verified",
        description: "You can now place orders",
      });
      onSuccess(phone);
      onClose();
      resetForm();
    } else {
      setError(result.error || "Verification failed");
    }
  };

  const resetForm = () => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setError("");
  };

  const handleResendOTP = async () => {
    setLoading(true);
    const result = await sendOTP(phone);

    if (result.success) {
      toast({
        title: "OTP Resent",
        description: "New verification code sent",
      });
    } else {
      setError(result.error || "Failed to resend OTP");
    }

    setLoading(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "phone" ? "Enter Phone Number" : "Verify OTP"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone"
              ? "We'll send you a verification code to confirm your order"
              : `Enter the 6-digit code sent to ${phone}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === "phone" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  maxLength={10}
                />
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={phone.length !== 10 || loading}
                className="w-full"
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleVerifyOTP}
                  disabled={otp.length !== 6}
                  className="flex-1"
                >
                  Verify OTP
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="bg-transparent"
                >
                  {loading ? "..." : "Resend"}
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => setStep("phone")}
                className="w-full"
              >
                Change Phone Number
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
