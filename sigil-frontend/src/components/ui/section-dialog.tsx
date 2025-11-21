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
import { useTreeStore } from "stores/treeStore"

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
  const { renameSection, addSection } = useTreeStore()

  const handleSave = async () => {
    if (name.trim() && !saving) {
      try {
        setSaving(true)
        if (section) {
          // Update existing section
          await sections.updateName(section.id, name.trim())

          // Update treeview via store
          renameSection(section.id, name.trim())
        } else {
          // Create new section
          const newSection = await sections.create({
            notebook_id: notebookId,
            name: name.trim(),
            position: maxPosition + 1,
          })

          // Update treeview via store
          addSection(notebookId, newSection)
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
