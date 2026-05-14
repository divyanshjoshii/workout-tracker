"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database"
import { setActiveSplit, deleteSplit } from "@/app/splits/actions"
import { useTransition } from "react"
import { CheckCircle2, Trash2, GripVertical, Link as LinkIcon, Settings2 } from "lucide-react"
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
      <DialogTrigger render={<div ref={setNodeRef} style={style} className="flex items-center gap-1.5 group bg-background hover:bg-accent cursor-pointer border border-border rounded-full px-3 py-1 text-xs font-semibold text-foreground transition-colors" />}>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none p-0.5 -ml-1.5" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="h-3 w-3" />
        </div>
        <span>{day.name}</span>
        {linkedTemplate && <LinkIcon className="h-3 w-3 text-primary ml-0.5" />}
        <Settings2 className="h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100 ml-1" />
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Configure Split Day</DialogTitle>
          <DialogDescription>
            {day.name}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Linked Template</label>
            <p className="text-xs text-muted-foreground">Select a template to automatically load when this split day is Up Next.</p>
            <Select 
              value={day.default_template_id || "none"} 
              onValueChange={handleLinkTemplate}
              disabled={isPending}
            >
              <SelectTrigger>
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
    <Card className={`border-border bg-card transition-all ${split.is_active ? 'border-primary ring-1 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{split.name}</CardTitle>
            {split.is_active && (
              <Badge variant="secondary" className="mt-2 bg-primary/20 text-primary hover:bg-primary/30">
                Active Plan
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
            className="w-full" 
            onClick={handleSetActive}
            disabled={isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Set as Active
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
