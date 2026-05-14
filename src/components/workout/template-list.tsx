"use client"

import { useState } from "react"
import { Database } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, GripVertical, Copy } from "lucide-react"
import { ClientDateInput } from "@/app/workout/client-date-input"
import { startWorkoutFromTemplate } from "@/app/workout/actions"
import { updateTemplateOrder } from "@/app/workout/actions"

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 w-full ${isDragging ? 'opacity-70 scale-105' : ''}`}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none p-2 shrink-0 bg-card border border-border rounded-md shadow-sm h-14 flex items-center justify-center">
        <GripVertical className="h-5 w-5" />
      </div>
      
      <form action={startWorkoutFromTemplate.bind(null, template.id)} className="flex-1 min-w-0">
        <ClientDateInput />
        <Button type="submit" variant="outline" className="w-full justify-between h-14 text-lg font-medium border-border hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm">
          <span className="truncate pr-2">{template.name}</span>
          <Plus className="h-5 w-5 opacity-50 shrink-0" />
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
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Your Templates</span>
        </div>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary flex items-center">
            <Copy className="mr-2 h-5 w-5" />
            Saved Templates
          </CardTitle>
          <p className="text-xs text-muted-foreground">Drag the handle to arrange your routines.</p>
        </CardHeader>
        <CardContent className="space-y-3">
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
