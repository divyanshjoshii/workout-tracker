"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Play } from "lucide-react"
import { ClientDateInput } from "@/app/workout/client-date-input"
import { startWorkoutFromTemplate, updateTemplateOrder } from "@/app/workout/actions"

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { Database } from "@/types/database"

type Template = Database["public"]["Tables"]["workout_templates"]["Row"]

interface SortableTemplateItemProps {
  template: Template
}

function SortableTemplateItem({ template }: SortableTemplateItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: template.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: "relative" as const,
  }

  return (
    <div ref={setNodeRef} style={style} className={`flex w-full items-center gap-2 transition-[opacity,scale] ${isDragging ? 'scale-[1.03] opacity-80' : ''}`}>
      <div {...attributes} {...listeners} aria-label={`Move ${template.name}`} className="flex h-14 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-2xl bg-muted text-muted-foreground transition-colors hover:text-strawberry active:cursor-grabbing">
        <GripVertical className="size-5" />
      </div>
      
      <form action={startWorkoutFromTemplate.bind(null, template.id, null)} className="flex-1 min-w-0">
        <ClientDateInput />
        <Button type="submit" variant="outline" className="group h-14 w-full justify-between rounded-[1.25rem] pr-4 pl-4 text-base [--slide:var(--primary)]">
          <span className="truncate pr-2">{template.name}</span>
          <Play fill="currentColor" className="size-4 shrink-0 text-strawberry transition-transform duration-500 ease-spring group-hover:translate-x-1" />
        </Button>
      </form>
    </div>
  )
}

export function TemplateList({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState(initialTemplates)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setTemplates((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Prepare DB updates
        const updates = newItems.map((item, index) => ({
          id: item.id,
          template_order: index + 1
        }))
        
        // Fire and forget updates
        updateTemplateOrder(updates)

        return newItems
      })
    }
  }

  if (templates.length === 0) return null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Saved templates</CardTitle>
          <CardDescription>Drag the handle to arrange your routines.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={templates.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {templates.map((template) => (
                <SortableTemplateItem key={template.id} template={template} />
              ))}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </>
  )
}
