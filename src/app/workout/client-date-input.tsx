"use client"

import { useEffect, useState } from "react"

export function ClientDateInput() {
  const [date, setDate] = useState("")

  // en-CA formats as YYYY-MM-DD. Set in an effect so it is the browser's
  // local date, not the server's.
  useEffect(() => setDate(new Date().toLocaleDateString('en-CA')), [])
  
  if (!date) return null

  return <input type="hidden" name="localDate" value={date} />
}
