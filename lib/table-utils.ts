// Get table ID from URL parameters
export function getTableId(): string | null {
  if (typeof window === "undefined") return null

  const urlParams = new URLSearchParams(window.location.search)
  const tableId = urlParams.get("table")
  console.log("Getting table ID from URL:", tableId)
  return tableId
}

// Set table ID in URL
export function setTableId(tableId: string) {
  if (typeof window === "undefined") return

  const url = new URL(window.location.href)
  url.searchParams.set("table", tableId)
  window.history.replaceState({}, "", url.toString())
  console.log("Set table ID in URL:", tableId)
}

// Get table-specific cart key
export function getTableCartKey(tableId: string | null): string {
  const key = tableId ? `cafe-cart-table-${tableId}` : "cafe-cart-general"
  console.log("Generated cart key:", key)
  return key
}

// Validate table ID format
export function isValidTableId(tableId: string | null): boolean {
  if (!tableId) return false
  const tableNum = Number.parseInt(tableId)
  const isValid = !isNaN(tableNum) && tableNum > 0 && tableNum <= 100 // Assuming max 100 tables
  console.log("Validating table ID:", tableId, "Valid:", isValid)
  return isValid
}
