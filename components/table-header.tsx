"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTableId, isValidTableId, setTableId } from "@/lib/table-utils";
import { isPhoneVerified, clearPhoneVerification } from "@/lib/phone-auth";
import { PhoneAuthModal } from "./phone-auth-modal";
import { useToast } from "@/hooks/use-toast";

interface TableHeaderProps {
  onPhoneVerified?: (phone: string) => void;
}

export function TableHeader({ onPhoneVerified }: TableHeaderProps) {
  const [tableId, setTableIdState] = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [manualTableId, setManualTableId] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const currentTableId = getTableId();
    setTableIdState(currentTableId);
    setManualTableId(currentTableId || "");

    const phone = isPhoneVerified();
    setVerifiedPhone(phone);
  }, []);

  const handlePhoneVerification = (phone: string) => {
    setVerifiedPhone(phone);
    onPhoneVerified?.(phone);
  };

  const handleLogout = () => {
    clearPhoneVerification();
    setVerifiedPhone(null);
    setShowPhoneAuth(true);
  };

  const handleManualTableSet = () => {
    if (!manualTableId || !isValidTableId(manualTableId)) {
      toast({
        title: "Invalid Table",
        description: "Please enter a valid table number (1-100)",
        variant: "destructive",
      });
      return;
    }

    setTableId(manualTableId);
    setTableIdState(manualTableId);
    setShowManualEntry(false);

    toast({
      title: "Table Set",
      description: `You are now at Table ${manualTableId}`,
    });

    // Reload the page to refresh cart context
    window.location.reload();
  };

  return (
    <>
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {tableId && isValidTableId(tableId) ? (
              <Badge variant="default" className="bg-blue-600">
                🪑 Table {tableId}
              </Badge>
            ) : (
              <Badge variant="secondary">⚠️ No Table Selected</Badge>
            )}

            {verifiedPhone ? (
              <Badge variant="outline" className="bg-green-50 border-green-200">
                📱 {verifiedPhone}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-orange-50 border-orange-200"
              >
                📱 Not Verified
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!tableId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowManualEntry(!showManualEntry)}
              >
                Set Table
              </Button>
            )}

            {verifiedPhone ? (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Change Phone
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowPhoneAuth(true)}>
                Verify Phone
              </Button>
            )}
          </div>
        </div>

        {showManualEntry && (
          <div className="max-w-7xl mx-auto mt-3 flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Enter table number"
              value={manualTableId}
              onChange={(e) => setManualTableId(e.target.value)}
              className="w-32"
              min="1"
              max="100"
            />
            <Button size="sm" onClick={handleManualTableSet}>
              Set Table
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowManualEntry(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <PhoneAuthModal
        isOpen={showPhoneAuth}
        onClose={() => setShowPhoneAuth(false)}
        onSuccess={handlePhoneVerification}
      />
    </>
  );
}
