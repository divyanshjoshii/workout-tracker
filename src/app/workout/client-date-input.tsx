"use client"

import { useEffect, useState } from "react"

export function ClientDateInput() {
  const [date, setDate] = useState("")

  useEffect(() => {
    const localDate = new Date()
    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    setDate(`${year}-${month}-${day}`)
  }, [])
  
  if (!date) return null

  return <input type="hidden" name="localDate" value={date} />
}
