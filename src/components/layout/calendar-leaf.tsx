// A tear-off calendar page: month on a pink band, day underneath. Dates here
// are stored without a time, so they are read at noon UTC to stay on the day.
export function CalendarLeaf({ date }: { date: string }) {
  const day = new Date(date + "T12:00:00Z")
  return (
    <span aria-hidden="true" className="flex w-14 shrink-0 flex-col overflow-hidden rounded-2xl border-2 border-border text-center">
      <span className="bg-primary py-0.5 text-[0.6875rem] font-bold tracking-wide text-primary-foreground uppercase">
        {day.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" })}
      </span>
      <span className="bg-card py-1 font-display text-xl">{day.getUTCDate()}</span>
    </span>
  )
}
