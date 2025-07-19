"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/cart-context";
import Link from "next/link";

export function CartButton() {
  const { state } = useCart();

  return (
    <Link href="/cart">
      <Button
        variant="outline"
        className="relative bg-white border-orange-200 text-orange-600 hover:bg-orange-50"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Cart
        {state.items.length > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-500">
            {state.items.reduce((sum, item) => sum + item.quantity, 0)}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
