"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from "react";
import type { CartItem } from "@/lib/supabase";
import { getSelectedTable, getTableCartKey } from "@/lib/table-storage";

type CartState = {
  items: CartItem[];
  total: number;
  tableNumber: number | null;
};

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | {
      type: "LOAD_CART";
      payload: { items: CartItem[]; tableNumber: number | null };
    }
  | { type: "SET_TABLE"; payload: number | null };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_TABLE":
      return { ...state, tableNumber: action.payload };

    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.menuItem.id === action.payload.menuItem.id &&
          JSON.stringify(item.selectedAddOns) ===
            JSON.stringify(action.payload.selectedAddOns) &&
          item.notes === action.payload.notes
      );

      let newItems;
      if (existingItemIndex >= 0) {
        newItems = [...state.items];
        newItems[existingItemIndex].quantity += action.payload.quantity;
      } else {
        newItems = [...state.items, action.payload];
      }

      const total = newItems.reduce((sum, item) => {
        const addOnsTotal = item.selectedAddOns.reduce(
          (addOnSum, addOn) => addOnSum + addOn.price,
          0
        );
        return sum + (item.menuItem.price + addOnsTotal) * item.quantity;
      }, 0);

      return { ...state, items: newItems, total };
    }
    case "REMOVE_ITEM": {
      const newItems = state.items.filter(
        (_, index) => index.toString() !== action.payload
      );
      const total = newItems.reduce((sum, item) => {
        const addOnsTotal = item.selectedAddOns.reduce(
          (addOnSum, addOn) => addOnSum + addOn.price,
          0
        );
        return sum + (item.menuItem.price + addOnsTotal) * item.quantity;
      }, 0);
      return { ...state, items: newItems, total };
    }
    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item, index) =>
          index.toString() === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
        .filter((item) => item.quantity > 0);

      const total = newItems.reduce((sum, item) => {
        const addOnsTotal = item.selectedAddOns.reduce(
          (addOnSum, addOn) => addOnSum + addOn.price,
          0
        );
        return sum + (item.menuItem.price + addOnsTotal) * item.quantity;
      }, 0);

      return { ...state, items: newItems, total };
    }
    case "CLEAR_CART":
      return { ...state, items: [], total: 0 };
    case "LOAD_CART":
      const total = action.payload.items.reduce((sum, item) => {
        const addOnsTotal = item.selectedAddOns.reduce(
          (addOnSum, addOn) => addOnSum + addOn.price,
          0
        );
        return sum + (item.menuItem.price + addOnsTotal) * item.quantity;
      }, 0);
      return {
        items: action.payload.items,
        total,
        tableNumber: action.payload.tableNumber,
      };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    tableNumber: null,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize cart when component mounts
  useEffect(() => {
    const tableNumber = getSelectedTable();
    dispatch({ type: "SET_TABLE", payload: tableNumber });

    if (tableNumber) {
      // Load existing cart for this table
      const cartKey = getTableCartKey(tableNumber);
      const savedCart = localStorage.getItem(cartKey);

      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);
          dispatch({
            type: "LOAD_CART",
            payload: { items: cartItems, tableNumber },
          });
        } catch (error) {
          console.error("Error loading cart from localStorage:", error);
        }
      }
    }

    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes (table-specific)
  useEffect(() => {
    if (!isInitialized || !state.tableNumber) return;

    const cartKey = getTableCartKey(state.tableNumber);
    localStorage.setItem(cartKey, JSON.stringify(state.items));
  }, [state.items, state.tableNumber, isInitialized]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
