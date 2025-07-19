// Simple table management using localStorage
export function setSelectedTable(tableNumber: number) {
  if (typeof window !== "undefined") {
    localStorage.setItem("selected_table", tableNumber.toString())
  }
}

export function getSelectedTable(): number | null {
  if (typeof window === "undefined") return null

  const table = localStorage.getItem("selected_table")
  return table ? Number.parseInt(table) : null
}

export function clearSelectedTable() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("selected_table")
  }
}

export function getTableCartKey(tableNumber: number | null): string {
  return tableNumber ? `cafe-cart-table-${tableNumber}` : "cafe-cart-general"
}
