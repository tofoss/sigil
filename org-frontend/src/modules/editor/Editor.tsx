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
import { useEffect, useRef, useState } from "react"
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
        const fileID = await fileClient.upload(file, note?.id)
        // Use API-relative URL that persists across page refreshes
        // The markdown renderer will prepend the API base URL
        setText((prev) => prev + `![uploaded image](/files/${fileID})`)
      }
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

  const onSave = async () => {
    const updatedNote = await call(() => noteClient.upsert(text, note?.id))
    if (updatedNote === undefined) {
      console.error("Note is undefined")
      return
    }

    setNote(updatedNote)

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
    <Box minHeight="100vh" pl="0.5rem" pr="0.5rem" width="100%">
      <Collapsible.Root>
        <VStack width="100%">
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
        <Box mt="1rem" padding="1rem" borderWidth="1px" borderRadius="md">
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
          overflow="hidden"
          minHeight="80vh"
        />
      )}
    </Box>
  )
}
