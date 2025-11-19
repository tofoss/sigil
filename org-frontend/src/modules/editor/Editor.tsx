/* eslint-disable no-console */
import {
  Box,
  HStack,
  Textarea,
  Text,
  Collapsible,
  VStack,
} from "@chakra-ui/react"
import { Button } from "components/ui/button"
import { fileClient, noteClient } from "api"
import { MarkdownViewer } from "modules/markdown"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  LuFileEdit,
  LuInfo,
  LuPresentation,
  LuSave,
  LuTag,
  LuBookOpen,
  LuTrash2,
} from "react-icons/lu"
import { colorPalette } from "theme"
import { apiRequest } from "utils/http"
import { Note } from "api/model/note"
import { Tag } from "api/model/tag"
import { Notebook } from "api/model/notebook"
import { DataListItem, DataListRoot } from "components/ui/data-list"
import { TagSelector } from "components/ui/tag-selector"
import { NotebookSelector } from "components/ui/notebook-selector"
import { notebooks } from "api"
import { useFetch } from "utils/http"

interface EditorProps {
  note?: Note
  mode?: "Display" | "Edit"
  onDelete?: () => void
}

export function Editor(props: EditorProps) {
  const [note, setNote] = useState<Note | undefined>(props.note)
  const [text, setText] = useState(note?.content ?? "")
  const [selectedTags, setSelectedTags] = useState<Tag[]>(note?.tags || [])
  const [selectedNotebooks, setSelectedNotebooks] = useState<Notebook[]>([])
  const [togglePreview, setTogglePreview] = useState(props.mode === "Display")
  const [showTagEditor, setShowTagEditor] = useState(false)
  const [showNotebookEditor, setShowNotebookEditor] = useState(false)
  const { call, loading, error } = apiRequest<Note>()
  const { call: assignTags, loading: assigningTags } = apiRequest<Tag[]>()

  // Autosave refs
  const lastSavedContentRef = useRef(text)
  const isAutosavingRef = useRef(false)
  const textRef = useRef(text)
  const noteIdRef = useRef(note?.id)
  const AUTOSAVE_INTERVAL = 10000 // 10 seconds

  // Keep refs updated
  useEffect(() => {
    textRef.current = text
  }, [text])

  useEffect(() => {
    noteIdRef.current = note?.id
  }, [note?.id])

  // Fetch notebooks for this note
  const { data: noteNotebooks = [] } = useFetch(
    () =>
      note?.id ? notebooks.getNotebooksForNote(note.id) : Promise.resolve([]),
    [note?.id]
  )

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (!file) continue

        // Get cursor position
        const textarea = textareaRef.current
        const cursorPos = textarea?.selectionStart || text.length

        const fileID = await fileClient.upload(file, note?.id)
        const imageMarkdown = `![uploaded image](/files/${fileID})`

        // Insert at cursor position
        setText((prev) => {
          const before = prev.slice(0, cursorPos)
          const after = prev.slice(cursorPos)
          return before + imageMarkdown + after
        })

        // Move cursor after inserted image
        setTimeout(() => {
          if (textarea) {
            const newPos = cursorPos + imageMarkdown.length
            textarea.setSelectionRange(newPos, newPos)
            textarea.focus()
          }
        }, 0)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()

      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      // Insert tab character at cursor position
      const newText = text.substring(0, start) + "\t" + text.substring(end)
      setText(newText)

      // Move cursor after the inserted tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1
      }, 0)
    }
  }

  useEffect(() => {
    adjustHeight()
    adjustHeight()
  }, [togglePreview])

  useEffect(() => {
    if (props.note) {
      setSelectedTags(props.note.tags || [])
    }
  }, [props.note])

  useEffect(() => {
    console.log("noteNotebooks from backend:", noteNotebooks)
    setSelectedNotebooks(noteNotebooks || [])
  }, [noteNotebooks])

  // Autosave function
  const performAutosave = useCallback(async () => {
    const currentText = textRef.current
    const currentNoteId = noteIdRef.current

    // Don't autosave if already saving or content hasn't changed
    if (
      isAutosavingRef.current ||
      currentText === lastSavedContentRef.current
    ) {
      return
    }

    isAutosavingRef.current = true

    try {
      const updatedNote = await noteClient.upsert(currentText, currentNoteId)
      if (updatedNote) {
        setNote(updatedNote)
        lastSavedContentRef.current = currentText

        // Dispatch event to update sidebar tree
        window.dispatchEvent(
          new CustomEvent("note-saved", {
            detail: { note: updatedNote },
          })
        )
      }
    } catch (err) {
      // Silently handle errors - don't interrupt user
      console.error("Autosave failed:", err)
    } finally {
      isAutosavingRef.current = false
    }
  }, [])

  // Autosave interval
  useEffect(() => {
    // Only autosave when in edit mode
    if (togglePreview) return

    const intervalId = setInterval(performAutosave, AUTOSAVE_INTERVAL)

    return () => clearInterval(intervalId)
  }, [togglePreview, performAutosave])

  // Initialize lastSavedContentRef when note is loaded
  useEffect(() => {
    if (note?.content) {
      lastSavedContentRef.current = note.content
    }
  }, [note?.id])

  // Auto-save when switching to preview mode
  const prevTogglePreviewRef = useRef(togglePreview)
  useEffect(() => {
    // Only save when transitioning from edit to preview
    if (togglePreview && !prevTogglePreviewRef.current) {
      performAutosave()
    }
    prevTogglePreviewRef.current = togglePreview
  }, [togglePreview, performAutosave])

  const onSave = async () => {
    const updatedNote = await call(() => noteClient.upsert(text, note?.id))
    if (updatedNote === undefined) {
      console.error("Note is undefined")
      return
    }

    setNote(updatedNote)
    lastSavedContentRef.current = text

    // Save tags if note has an ID and tags have changed
    if (
      updatedNote.id &&
      (note?.tags?.length !== selectedTags.length ||
        !note?.tags?.every((tag) =>
          selectedTags.some((selected) => selected.id === tag.id)
        ))
    ) {
      try {
        const tagIds = selectedTags.map((tag) => tag.id)
        const updatedTags = await assignTags(() =>
          noteClient.assignTagsToNote(updatedNote.id, tagIds)
        )
        if (updatedTags) {
          setNote((prev) => (prev ? { ...prev, tags: updatedTags } : prev))
        }
      } catch (error) {
        console.error("Failed to assign tags:", error)
      }
    }

    // Dispatch event to update sidebar tree with the updated note data
    window.dispatchEvent(
      new CustomEvent("note-saved", {
        detail: { note: updatedNote },
      })
    )
  }

  return (
    <Box
      minHeight="100vh"
      pl="0.5rem"
      pr="0.5rem"
      width="100%"
      maxWidth="100%"
      minWidth="0"
    >
      <Collapsible.Root>
        <VStack width="100%" maxWidth="100%" minWidth="0">
          <HStack width="100%">
            <Button variant="ghost" onClick={() => setTogglePreview(false)}>
              <LuFileEdit />
            </Button>
            <Button variant="ghost" onClick={() => setTogglePreview(true)}>
              <LuPresentation />
            </Button>
            {import.meta.env.VITE_ENABLE_TAGS === "true" && (
              <Button
                variant="ghost"
                onClick={() => setShowTagEditor(!showTagEditor)}
                colorPalette={showTagEditor ? "teal" : undefined}
              >
                <LuTag />
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowNotebookEditor(!showNotebookEditor)}
              colorPalette={showNotebookEditor ? "teal" : undefined}
            >
              <LuBookOpen />
            </Button>
            {note && (
              <Collapsible.Trigger paddingY="3">
                <Button variant="ghost">
                  <LuInfo />
                </Button>
              </Collapsible.Trigger>
            )}
            <Button
              variant="ghost"
              colorPalette="red"
              ml="auto"
              onClick={props.onDelete}
              disabled={!props.onDelete}
            >
              <LuTrash2 />
            </Button>
            <Button
              variant="ghost"
              colorPalette={colorPalette}
              onClick={onSave}
              loading={loading || assigningTags}
            >
              <LuSave />
            </Button>
          </HStack>

          {/* Tag Editor */}
          {showTagEditor && (
            <Box
              width="100%"
              paddingY="4"
              borderTopWidth="1px"
              borderColor="gray.200"
            >
              <TagSelector
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
              />
            </Box>
          )}

          {/* Notebook Editor */}
          {showNotebookEditor && (
            <Box
              width="100%"
              paddingY="4"
              borderTopWidth="1px"
              borderColor="gray.200"
            >
              <NotebookSelector
                selectedNotebooks={selectedNotebooks}
                onNotebooksChange={setSelectedNotebooks}
                noteId={note?.id}
              />
            </Box>
          )}

          {note && (
            <Collapsible.Content width="100%">
              <Box paddingLeft="4">
                <DataListRoot orientation="horizontal" size="sm">
                  <DataListItem label="id" value={note.id} />
                  <DataListItem label="user" value={note.userId} />
                  <DataListItem
                    label="created at"
                    value={note.createdAt.toString()}
                  />
                  <DataListItem
                    label="updated at"
                    value={note.updatedAt.toString()}
                  />
                  <DataListItem
                    label="published"
                    value={note.published.toString()}
                  />
                  {note.publishedAt && (
                    <DataListItem
                      label="published at"
                      value={note.publishedAt.toString()}
                    />
                  )}
                </DataListRoot>
              </Box>
            </Collapsible.Content>
          )}
        </VStack>
      </Collapsible.Root>
      {error && (
        <Text color="red.500" mb={4} textAlign="center">
          {error.message}
        </Text>
      )}
      {togglePreview ? (
        <Box
          mt="1rem"
          padding="1rem"
          borderWidth="1px"
          borderRadius="md"
          maxWidth="100%"
          width="100%"
        >
          <MarkdownViewer text={text} />
        </Box>
      ) : (
        <Textarea
          ref={textareaRef}
          value={text}
          mt="1rem"
          mb="0.5rem"
          resize="none"
          onInput={adjustHeight}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          overflow="hidden"
          minHeight="80vh"
        />
      )}
    </Box>
  )
}
