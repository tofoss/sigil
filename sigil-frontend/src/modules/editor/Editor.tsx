/* eslint-disable no-console */
import {
  Box,
  Text,
  Button,
} from "@chakra-ui/react"
import { fileClient, noteClient } from "api"
import { MarkdownViewer } from "modules/markdown"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  LuFileEdit,
  LuPresentation,
  LuSave,
  LuTrash2,
} from "react-icons/lu"
import { colorPalette } from "theme"
import { apiRequest } from "utils/http"
import { Note } from "api/model/note"
import { Tag } from "api/model/tag"
import { useTreeStore } from "stores/treeStore"
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { sigilDarkTheme, sigilLightTheme } from './editorThemes';
import { useColorModeValue } from 'components/ui/color-mode';
import { vim } from "@replit/codemirror-vim"
import { historyField } from '@codemirror/commands';
import { Prec } from '@codemirror/state';
import { useTOC } from 'shared/Layout';
import { useShouldEnableVimMode } from "./useShouldEnableVimMode"

interface EditorProps {
  note?: Note
  mode?: "Display" | "Edit"
  onDelete?: () => void
  onModeChange?: (isPreview: boolean) => void
}

const stateFields = { history: historyField };

export function Editor(props: EditorProps) {
  const [note, setNote] = useState<Note | undefined>(props.note)
  const [text, setText] = useState(note?.content ?? "")
  const [selectedTags, setSelectedTags] = useState<Tag[]>(note?.tags || [])
  const [togglePreview, setTogglePreview] = useState(props.mode === "Display")
  const { call, loading, error } = apiRequest<Note>()
  const { call: assignTags, loading: assigningTags } = apiRequest<Tag[]>()
  const { updateNoteTitle, addNoteToTree, fetchTree, treeData, unassignedNotes } = useTreeStore()
  const { setContent: setTOCContent } = useTOC()
  const initialState = note?.id ? localStorage.getItem(note.id) : null

  // Use custom theme based on color mode
  const editorTheme = useColorModeValue(sigilLightTheme, sigilDarkTheme)
  const vimMode = useShouldEnableVimMode()

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


  const markdownPasteHandler = EditorView.domEventHandlers({
    paste(event, view) {
      const items = event.clipboardData?.items
      if (!items) return false

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (!file) continue
          event.preventDefault();

          const { from, to } = view.state.selection.main;
          const placeholder = `![⏳](uploading image...)`;

          // Insert placeholder immediately
          view.dispatch({
            changes: { from, to, insert: placeholder },
          });

          (async () => {
            const fileID = await fileClient.upload(file, note?.id)

            const doc = view.state.doc.toString();
            const placeholderPos = doc.indexOf(placeholder);

            if (placeholderPos !== -1) {
              const imageMarkdown = `![uploaded image](/files/${fileID})`
              view.dispatch({
                changes: {
                  from: placeholderPos,
                  to: placeholderPos + placeholder.length,
                  insert: imageMarkdown,
                },
              });
            }
          })()

          return true; // We handled it
        }
      }

      return false; // Let default paste happen
    },
  })

  const fullHeightEditor = EditorView.theme({
    "&": {
      fontSize: "1.0rem",
    },
    ".cm-scroller": {
      minHeight: "80vh",
      cursor: "text",
    },
    ".cm-content": {
      minHeight: "80vh",
    },
  })

  // Click handler to focus editor when clicking in empty space
  const clickToFocus = EditorView.domEventHandlers({
    mousedown(event, view) {
      const target = event.target as HTMLElement
      // If clicking on the scroller but not on content, focus at end
      if (target.classList.contains('cm-scroller') || target.classList.contains('cm-content')) {
        const pos = view.state.doc.length
        view.dispatch({
          selection: { anchor: pos },
        })
        view.focus()
        return true
      }
      return false
    },
  })


  useEffect(() => {
    if (props.note) {
      setSelectedTags(props.note.tags || [])
    }
  }, [props.note])

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

        // Update TOC with current content
        setTOCContent(currentText)

        // Update sidebar tree via store
        if (currentNoteId) {
          updateNoteTitle(updatedNote.id, updatedNote.title)
        } else {
          // New note - add to tree
          // Only fetch if tree is completely empty, otherwise use optimistic update
          if (treeData.length === 0 && unassignedNotes.length === 0) {
            fetchTree()
          } else {
            addNoteToTree({ id: updatedNote.id, title: updatedNote.title })
          }
        }
      }
    } catch (err) {
      // Silently handle errors - don't interrupt user
      console.error("Autosave failed:", err)
    } finally {
      isAutosavingRef.current = false
    }
  }, [updateNoteTitle, fetchTree, addNoteToTree, treeData.length, unassignedNotes.length, setTOCContent])

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

  // Notify parent component when mode changes
  useEffect(() => {
    if (props.onModeChange) {
      props.onModeChange(togglePreview)
    }
  }, [togglePreview, props.onModeChange])

  const onSave = async () => {
    const updatedNote = await call(() => noteClient.upsert(text, note?.id))
    if (updatedNote === undefined) {
      console.error("Note is undefined")
      return
    }

    setNote(updatedNote)
    lastSavedContentRef.current = text

    // Update TOC with current content
    setTOCContent(text)

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

    // Update sidebar tree via store
    if (note?.id) {
      updateNoteTitle(updatedNote.id, updatedNote.title)
    } else {
      // New note - add to tree
      // Only fetch if tree is completely empty, otherwise use optimistic update
      if (treeData.length === 0 && unassignedNotes.length === 0) {
        fetchTree()
      } else {
        addNoteToTree({ id: updatedNote.id, title: updatedNote.title })
      }
    }
  }
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const scrollTimeout = useRef<number | null>(null)
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return

    el.classList.add("scrolling")

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }

    scrollTimeout.current = window.setTimeout(() => {
      el.classList.remove("scrolling")
    }, 500)
  }

  const extensions = useMemo(() => {
    const exts = [];

    if (vimMode) {
      exts.push(Prec.highest(vim()));
    }

    exts.push(
      markdown(),
      markdownPasteHandler,
      fullHeightEditor,
      clickToFocus,
      EditorView.lineWrapping
    );

    return exts;
  }, [vimMode]);

  return (
    <Box
      ref={scrollRef}
      height="87vh"
      pl="0.5rem"
      pr="0.5rem"
      width="100%"
      maxWidth="100%"
      minWidth="0"
      overflow="auto"
      className="scrollbox"
      onScroll={handleScroll}
    >
      {/* Custom floating toolbar - no Portal, no Chakra UI event magic */}
      <Box
        position="fixed"
        bottom="4"
        left="50%"
        transform="translateX(-50%)"
        display="flex"
        gap="2"
        bg="bg.panel"
        borderWidth="1px"
        borderRadius="md"
        p="2"
        shadow="lg"
        zIndex="sticky"
        opacity="0.95"
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setTogglePreview(false)}
          aria-label="Edit mode"
        >
          <LuFileEdit />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setTogglePreview(true)}
          aria-label="Preview mode"
        >
          <LuPresentation />
        </Button>
        <Box borderLeftWidth="1px" height="auto" />
        <Button
          size="sm"
          variant="ghost"
          colorPalette="red"
          onClick={props.onDelete}
          disabled={!props.onDelete}
          aria-label="Delete note"
        >
          <LuTrash2 />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          colorPalette={colorPalette}
          onClick={onSave}
          loading={loading || assigningTags}
          aria-label="Save note"
        >
          <LuSave />
        </Button>
      </Box>
      {error && (
        <Text color="red.500" mb={4} textAlign="center">
          {error.message}
        </Text>
      )}
      {togglePreview ? (
        <Box
          maxWidth="100%"
          width="100%"
        >
          <MarkdownViewer text={text} />
        </Box>
      ) : (
        <CodeMirror
          value={text}
          minHeight="80vh"
          theme={editorTheme}
          extensions={extensions}
          initialState={
            initialState
              ? {
                json: JSON.parse(initialState),
                fields: stateFields,
              }
              : undefined
          }
          onChange={(val, viewUpdate) => {
            setText(val)
            if (note?.id) {
              const state = viewUpdate.state.toJSON(stateFields);
              localStorage.setItem(note.id, JSON.stringify(state));
            }
          }}
          basicSetup={{
            lineNumbers: false,
            highlightActiveLineGutter: false,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: false,
            defaultKeymap: false,
            autocompletion: true,
            rectangularSelection: false,
            crosshairCursor: false,
            highlightActiveLine: false,
            highlightSelectionMatches: false,
            closeBracketsKeymap: false,
            searchKeymap: false,
            foldKeymap: false,
            completionKeymap: false,
            lintKeymap: false,
          }}
        />
      )}
    </Box>
  )
}
