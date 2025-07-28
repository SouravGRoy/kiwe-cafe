// Session management using phone + table combination
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

// New session management functions
export function createSessionId(phone: string, tableNumber: number): string {
  return `${phone}_table_${tableNumber}`
}

export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null
  
  const phone = localStorage.getItem("verified_phone")
  const table = getSelectedTable()
  
  if (!phone || !table) return null
  
  return createSessionId(phone, table)
}

export function setCurrentSession(phone: string, tableNumber: number) {
  if (typeof window !== "undefined") {
    const sessionId = createSessionId(phone, tableNumber)
    localStorage.setItem("current_session_id", sessionId)
    localStorage.setItem("verified_phone", phone)
    localStorage.setItem("selected_table", tableNumber.toString())
  }
}

export function clearCurrentSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("current_session_id")
    localStorage.removeItem("verified_phone")
    localStorage.removeItem("selected_table")
  }
}
