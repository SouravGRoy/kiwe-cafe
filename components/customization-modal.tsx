"use client";

import { useState } from "react";
import type { MenuItem, AddOn } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Plus, Minus } from "lucide-react";

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  addOns: AddOn[];
  onComplete: (
    selectedAddOns: AddOn[],
    notes: string,
    quantity: number
  ) => void;
}

export function CustomizationModal({
  isOpen,
  onClose,
  item,
  addOns,
  onComplete,
}: CustomizationModalProps) {
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const handleAddOnChange = (addOn: AddOn, checked: boolean) => {
    if (checked) {
      setSelectedAddOns([...selectedAddOns, addOn]);
    } else {
      setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addOn.id));
    }
  };

  const totalAddOnPrice = selectedAddOns.reduce(
    (sum, addOn) => sum + addOn.price,
    0
  );
  const totalPrice = (item.price + totalAddOnPrice) * quantity;

  const handleComplete = () => {
    onComplete(selectedAddOns, notes, quantity);
    // Reset form
    setSelectedAddOns([]);
    setNotes("");
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <Card className="w-full max-w-md mx-auto mb-0 rounded-t-2xl rounded-b-none max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto">
          <div className="space-y-6">
            {/* Add-ons */}
            {addOns.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Customize your order</h4>
                <div className="space-y-3">
                  {addOns.map((addOn) => (
                    <div
                      key={addOn.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={addOn.id}
                          checked={selectedAddOns.some(
                            (a) => a.id === addOn.id
                          )}
                          onCheckedChange={(checked) =>
                            handleAddOnChange(addOn, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={addOn.id}
                          className="text-sm font-medium"
                        >
                          {addOn.name}
                        </label>
                      </div>
                      <span className="text-sm font-medium">
                        +₹{addOn.price.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                Special Instructions (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Any special requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to cart button */}
            <Button
              onClick={handleComplete}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Add to Cart - ₹{totalPrice.toFixed(0)}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
