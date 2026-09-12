"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database"
import { setActiveSplit, deleteSplit } from "@/app/splits/actions"
import { useTransition } from "react"
import { Check, CheckCircle2, Trash2, GripVertical, Link as LinkIcon, Settings2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateSplitDayTemplate } from "@/app/splits/actions"

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Split = Database["public"]["Tables"]["splits"]["Row"]
type SplitDay = Database["public"]["Tables"]["split_days"]["Row"]

interface SplitCardProps {
  split: Split & { split_days: SplitDay[] }
  templates: { id: string, name: string }[]
}

function SortableSplitDayBadge({ day, templates }: { day: SplitDay, templates: { id: string, name: string }[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id })
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  async function handleLinkTemplate(templateId: string | null) {
    startTransition(async () => {
      await updateSplitDayTemplate(day.id, templateId === "none" || templateId === null ? null : templateId)
    })
  }

  const linkedTemplate = templates.find(t => t.id === day.default_template_id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<div ref={setNodeRef} style={style} className={`group flex cursor-pointer items-center gap-1.5 rounded-full border-2 bg-card py-1.5 pr-3 pl-1.5 text-sm font-bold text-foreground shadow-[inset_0_-3px_0_0_var(--lip)] transition-[border-color,transform] duration-300 ease-spring hover:-translate-y-0.5 hover:border-input ${isDragging ? "scale-105 border-primary" : "border-border"}`} />}>
        <div {...attributes} {...listeners} aria-label={`Move ${day.name}`} className="grid size-6 cursor-grab touch-none place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-strawberry active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="size-3.5" />
        </div>
        <span>{day.name}</span>
        {linkedTemplate && <LinkIcon className="size-3.5 text-strawberry" />}
        <Settings2 className="size-3.5 text-muted-foreground transition-transform duration-500 ease-spring group-hover:rotate-45" />
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{day.name}</DialogTitle>
          <DialogDescription>
            Pick a template to load when this day is up next.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pb-1">
          <div className="flex flex-col gap-2">
            <label className="text-[0.8125rem] font-bold text-muted-foreground">Linked template</label>
            <Select
              value={day.default_template_id || "none"}
              onValueChange={handleLinkTemplate}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Blank Workout)</SelectItem>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SplitCard({ split, templates }: SplitCardProps) {
  const [isPending, startTransition] = useTransition()
  const [days, setDays] = useState(split.split_days.sort((a, b) => a.day_order - b.day_order))
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  function handleSetActive() {
    startTransition(async () => {
      await setActiveSplit(split.id)
    })
  }

  function handleDelete() {
    if (window.confirm("Are you sure you want to delete this split?")) {
      startTransition(async () => {
        await deleteSplit(split.id)
      })
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setDays((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)

        // Update DB
        const updates = newItems.map((item, index) => ({
          id: item.id,
          day_order: index + 1
        }))

        updates.forEach(async (update) => {
          await supabase.from("split_days").update({ day_order: update.day_order }).eq("id", update.id)
        })

        return newItems
      })
    }
  }

  return (
    <Card className={split.is_active ? "border-primary" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-title">{split.name}</CardTitle>
            {split.is_active && (
              <Badge className="mt-2">
                <Check /> Active plan
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${split.name}`}
            className="text-muted-foreground hover:text-destructive [--slide:var(--destructive-soft)]"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={days.map(d => d.id)} strategy={horizontalListSortingStrategy}>
              {days.map((day) => (
                <SortableSplitDayBadge key={day.id} day={day} templates={templates} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {!split.is_active && (
          <Button
            variant="outline"
            className="w-full text-strawberry"
            onClick={handleSetActive}
            disabled={isPending}
          >
            <CheckCircle2 />
            Set as active
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
