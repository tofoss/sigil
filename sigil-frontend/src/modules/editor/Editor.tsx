/* eslint-disable no-console */
import {
  Box,
  Text,
  Button,
  Menu,
  Portal,
} from "@chakra-ui/react"
import { fileClient, noteClient, shoppingListClient } from "api"
import { MarkdownViewer } from "modules/markdown"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  LuFileEdit,
  LuPresentation,
  LuSave,
  LuTrash2,
  LuShoppingCart,
} from "react-icons/lu"
import { colorPalette } from "theme"
import { apiRequest } from "utils/http"
import { Note } from "api/model/note"
import { Tag } from "api/model/tag"
import { ShoppingList } from "api/model/shopping-list"
import { useTreeStore } from "stores/treeStore"
import { useShoppingListStore } from "stores/shoppingListStore"
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { sigilDarkTheme, sigilLightTheme } from './editorThemes';
import { useColorModeValue } from 'components/ui/color-mode';
import { vim } from "@replit/codemirror-vim"
import { historyField } from '@codemirror/commands';
import { Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { completionStatus } from '@codemirror/autocomplete';
import { useTOC } from 'shared/Layout';
import { useShouldEnableVimMode } from "./useShouldEnableVimMode"
import { shoppingListExtension, toggleShoppingListModeEffect } from './shoppingListExtensions';
import { hasChecklistItems } from './utils';

interface EditorProps {
  note?: Note
  shoppingList?: ShoppingList
  mode?: "Display" | "Edit"
  onDelete?: () => void
  onModeChange?: (isPreview: boolean) => void
  onSave?: (content: string) => void | Promise<void>
  onConvert?: (mode: "new" | "merge") => void
  hasLastShoppingList?: boolean
  isConverting?: boolean
}

const stateFields = { history: historyField };

export function Editor(props: EditorProps) {
  // Auto-detect if this is a shopping list
  const isShoppingList = !!props.shoppingList

  const [note, setNote] = useState<Note | undefined>(props.note)
  const [shoppingList, setShoppingList] = useState<ShoppingList | undefined>(props.shoppingList)
  const [text, setText] = useState((props.note?.content ?? props.shoppingList?.content) ?? "")
  const [selectedTags, setSelectedTags] = useState<Tag[]>(note?.tags || [])
  const [togglePreview, setTogglePreview] = useState(props.mode === "Display")
  const { call, loading, error } = apiRequest<Note>()
  const { call: assignTags, loading: assigningTags } = apiRequest<Tag[]>()
  const { updateNoteTitle, addNoteToTree, fetchTree, treeData, unassignedNotes } = useTreeStore()
  const { updateShoppingListTitle } = useShoppingListStore()
  const { setContent: setTOCContent } = useTOC()
  const documentId = note?.id ?? shoppingList?.id
  const initialState = documentId ? localStorage.getItem(documentId) : null
  const editorViewRef = useRef<EditorView | null>(null)

  // Use custom theme based on color mode
  const editorTheme = useColorModeValue(sigilLightTheme, sigilDarkTheme)
  const vimMode = useShouldEnableVimMode()

  // Autosave refs
  const lastSavedContentRef = useRef(text)
  const isAutosavingRef = useRef(false)
  const textRef = useRef(text)
  const documentIdRef = useRef(documentId)
  const AUTOSAVE_INTERVAL = 10000 // 10 seconds


  // Keep refs updated
  useEffect(() => {
    textRef.current = text
  }, [text])

  useEffect(() => {
    documentIdRef.current = documentId
  }, [documentId])


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
    const currentDocumentId = documentIdRef.current

    // Don't autosave if already saving or content hasn't changed
    if (
      isAutosavingRef.current ||
      currentText === lastSavedContentRef.current
    ) {
      return
    }

    isAutosavingRef.current = true

    try {
      if (isShoppingList) {
        // Autosave shopping list
        if (currentDocumentId) {
          const updatedList = await shoppingListClient.update(currentDocumentId, currentText)
          setShoppingList(updatedList)
          lastSavedContentRef.current = currentText
          // Update sidebar tree via store
          updateShoppingListTitle(updatedList.id, updatedList.title)
        } else {
          // Creating new shopping list - this shouldn't happen in autosave
          console.warn("Cannot autosave new shopping list without ID")
        }
      } else {
        // Autosave note
        const updatedNote = await noteClient.upsert(currentText, currentDocumentId)
        if (updatedNote) {
          setNote(updatedNote)
          lastSavedContentRef.current = currentText

          // Update TOC with current content
          setTOCContent(currentText)

          // Update sidebar tree via store
          if (currentDocumentId) {
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
      }
    } catch (err) {
      // Silently handle errors - don't interrupt user
      console.error("Autosave failed:", err)
    } finally {
      isAutosavingRef.current = false
    }
  }, [isShoppingList, updateNoteTitle, updateShoppingListTitle, fetchTree, addNoteToTree, treeData.length, unassignedNotes.length, setTOCContent])

  // Autosave interval
  useEffect(() => {
    // Only autosave when in edit mode
    if (togglePreview) return

    const intervalId = setInterval(performAutosave, AUTOSAVE_INTERVAL)

    return () => clearInterval(intervalId)
  }, [togglePreview, performAutosave])

  // Initialize lastSavedContentRef when document is loaded
  useEffect(() => {
    const content = note?.content ?? shoppingList?.content
    if (content) {
      lastSavedContentRef.current = content
    }
  }, [documentId])

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
    // If external onSave callback provided, use it
    if (props.onSave) {
      await props.onSave(text)
      return
    }

    // Otherwise, use existing internal save logic
    if (isShoppingList) {
      // Save shopping list
      if (shoppingList?.id) {
        const updatedList = await shoppingListClient.update(shoppingList.id, text)
        setShoppingList(updatedList)
        lastSavedContentRef.current = text
        // Update sidebar tree via store
        updateShoppingListTitle(updatedList.id, updatedList.title)
      } else {
        console.error("Shopping list ID is undefined")
      }
    } else {
      // Save note
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

  // Custom keymap to fix Enter key in vim INSERT mode on empty lines
  // This fixes the issue where pressing Enter on an empty last line doesn't create a new line
  const enterKeyFix = useMemo(() => {
    return keymap.of([
      {
        key: "Enter",
        run: (view) => {
          // Don't intercept if autocomplete menu is active
          const status = completionStatus(view.state);
          if (status === "active") {
            return false; // Let autocomplete handle it
          }

          // Don't intercept if we're in shopping list mode on a checkbox line
          // Let the shopping list keymap handle it instead
          if (isShoppingList) {
            const { from } = view.state.selection.main;
            const line = view.state.doc.lineAt(from);
            if (/^\s*-\s*\[([ xX])\]/.test(line.text)) {
              return false; // Let shopping list extension handle it
            }
          }

          const { state } = view;
          const { from, to } = state.selection.main;

          // Insert newline at cursor position
          view.dispatch({
            changes: { from, to, insert: "\n" },
            selection: { anchor: from + 1 },
          });

          return true;
        },
      },
    ]);
  }, [isShoppingList]);

  const extensions = useMemo(() => {
    const exts = [];

    if (vimMode) {
      // Add Enter key fix with higher precedence than vim mode
      exts.push(Prec.highest(vim()));
    }

    exts.push(
      Prec.high(enterKeyFix),
      markdown(),
      markdownPasteHandler,
      fullHeightEditor,
      clickToFocus,
      EditorView.lineWrapping,
    );

    // Only add shopping list extension when editing a shopping list
    if (isShoppingList) {
      exts.push(shoppingListExtension());
    }

    return exts;
  }, [vimMode, enterKeyFix, markdownPasteHandler, fullHeightEditor, clickToFocus, isShoppingList]);

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
        {/* Show convert button only for notes with checklists */}
        {!isShoppingList && note && hasChecklistItems(text) && (
          <>
            <Box borderLeftWidth="1px" height="auto" />
            <Menu.Root positioning={{ placement: "top" }}>
              <Menu.Trigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={props.isConverting}
                  aria-label="Convert to shopping list"
                >
                  <LuShoppingCart />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="new" onClick={() => props.onConvert?.("new")}>
                      Create new shopping list
                    </Menu.Item>
                    {props.hasLastShoppingList && (
                      <Menu.Item value="merge" onClick={() => props.onConvert?.("merge")}>
                        Add to previous shopping list
                      </Menu.Item>
                    )}
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </>
        )}
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
          onCreateEditor={(view) => {
            editorViewRef.current = view
            // Auto-enable shopping list mode if this is a shopping list
            if (isShoppingList) {
              view.dispatch({
                effects: toggleShoppingListModeEffect.of(true),
              })
            }
          }}
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
            if (documentId) {
              const state = viewUpdate.state.toJSON(stateFields);
              localStorage.setItem(documentId, JSON.stringify(state));
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
