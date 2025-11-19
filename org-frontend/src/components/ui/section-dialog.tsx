import { Button, Input, Stack } from "@chakra-ui/react"
import { sections } from "api"
import { Section } from "api/model"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "components/ui/dialog"
import { Field } from "components/ui/field"
import { useState } from "react"

interface SectionDialogProps {
  open: boolean
  onClose: () => void
  notebookId: string
  section?: Section
  maxPosition: number
  onSuccess?: () => void
}

export function SectionDialog({
  open,
  onClose,
  notebookId,
  section,
  maxPosition,
  onSuccess,
}: SectionDialogProps) {
  const [name, setName] = useState(section?.name || "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (name.trim() && !saving) {
      try {
        setSaving(true)
        if (section) {
          // Update existing section
          await sections.updateName(section.id, name.trim())

          // Dispatch event to update treeview
          window.dispatchEvent(
            new CustomEvent("section-renamed", {
              detail: { sectionId: section.id, newName: name.trim() },
            })
          )
        } else {
          // Create new section
          const newSection = await sections.create({
            notebook_id: notebookId,
            name: name.trim(),
            position: maxPosition + 1,
          })

          // Dispatch event to update treeview
          window.dispatchEvent(
            new CustomEvent("section-created", {
              detail: { notebookId, section: newSection },
            })
          )
        }
        handleClose()
        onSuccess?.()
      } catch (error) {
        console.error("Error saving section:", error)
      } finally {
        setSaving(false)
      }
    }
  }

  const handleClose = () => {
    setName(section?.name || "")
    onClose()
  }

  return (
    <DialogRoot open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {section ? "Edit Section" : "Create New Section"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Stack gap={4}>
            <Field label="Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter section name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave()
                  }
                }}
              />
            </Field>
          </Stack>
        </DialogBody>
        <DialogFooter>
          <DialogCloseTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogCloseTrigger>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving..." : section ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
