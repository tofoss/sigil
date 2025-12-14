import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Chakra UI Teal palette colors
const teal = {
  50: '#E6FFFA',
  100: '#B2F5EA',
  200: '#81E6D9',
  300: '#4FD1C5',
  400: '#38B2AC',
  500: '#319795',
  600: '#2C7A7B',
  700: '#285E61',
  800: '#234E52',
  900: '#1D4044',
};

// Chakra UI Red palette colors
const red = {
  50: '#FFF5F5',
  100: '#FED7D7',
  200: '#FEB2B2',
  300: '#FC8181',
  400: '#F56565',
  500: '#E53E3E',
  600: '#C53030',
  700: '#9B2C2C',
  800: '#822727',
  900: '#63171B',
};

// Dark theme - white text with teal and red highlights
export const sigilDarkTheme: Extension = [
  EditorView.theme({
    '&': {
      color: '#ffffff',
      backgroundColor: '#111111',
    },
    '.cm-content': {
      caretColor: teal[400],
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: teal[400],
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: teal[400],
      color: '#000000',
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
      backgroundColor: teal[400],
    },
    '.cm-activeLine': {
      backgroundColor: '#161b22',
    },
    '.cm-gutters': {
      backgroundColor: '#0d1117',
      color: '#8b949e',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#161b22',
    },
  }, { dark: true }),
  syntaxHighlighting(HighlightStyle.define([
    { tag: t.heading, color: teal[300], fontWeight: 'bold' },
    { tag: t.heading1, color: teal[300], fontWeight: 'bold', fontSize: '1.6em' },
    { tag: t.heading2, color: teal[400], fontWeight: 'bold', fontSize: '1.4em' },
    { tag: t.heading3, color: teal[500], fontWeight: 'bold', fontSize: '1.2em' },
    { tag: t.emphasis, color: '#ffffff', fontStyle: 'italic' },
    { tag: t.strong, color: '#ffffff', fontWeight: 'bold' },
    { tag: t.strikethrough, color: '#8b949e', textDecoration: 'line-through' },
    { tag: t.link, color: teal[400], textDecoration: 'underline' },
    { tag: t.url, color: teal[500] },
    { tag: t.monospace, color: red[400], backgroundColor: '#161b22', fontFamily: 'monospace' },
    { tag: t.quote, color: '#8b949e', fontStyle: 'italic' },
    { tag: t.list, color: teal[400] },
    { tag: t.comment, color: '#8b949e', fontStyle: 'italic' },
    { tag: t.meta, color: '#8b949e' },
    { tag: [t.keyword, t.operator], color: red[400] },
    { tag: [t.string, t.regexp], color: teal[400] },
    { tag: [t.number, t.bool, t.null], color: teal[300] },
    { tag: t.variableName, color: '#ffffff' },
    { tag: t.propertyName, color: teal[300] },
    { tag: t.className, color: teal[200] },
    { tag: t.typeName, color: teal[300] },
  ])),
];

// Light theme - black text with teal and red highlights
export const sigilLightTheme: Extension = [
  EditorView.theme({
    '&': {
      color: '#24292f',
      backgroundColor: '#fafafa',
    },
    '.cm-content': {
      caretColor: teal[600],
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: teal[600],
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: teal[100],
    },
    '.cm-activeLine': {
      backgroundColor: '#f6f8fa',
    },
    '.cm-gutters': {
      backgroundColor: '#ffffff',
      color: '#57606a',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#f6f8fa',
    },
  }, { dark: false }),
  syntaxHighlighting(HighlightStyle.define([
    { tag: t.heading, color: teal[700], fontWeight: 'bold' },
    { tag: t.heading1, color: teal[700], fontWeight: 'bold', fontSize: '1.6em' },
    { tag: t.heading2, color: teal[600], fontWeight: 'bold', fontSize: '1.4em' },
    { tag: t.heading3, color: teal[600], fontWeight: 'bold', fontSize: '1.2em' },
    { tag: t.emphasis, color: '#24292f', fontStyle: 'italic' },
    { tag: t.strong, color: '#24292f', fontWeight: 'bold' },
    { tag: t.strikethrough, color: '#57606a', textDecoration: 'line-through' },
    { tag: t.link, color: teal[600], textDecoration: 'underline' },
    { tag: t.url, color: teal[700] },
    { tag: t.monospace, color: red[600], backgroundColor: '#f6f8fa', fontFamily: 'monospace' },
    { tag: t.quote, color: '#57606a', fontStyle: 'italic' },
    { tag: t.list, color: teal[600] },
    { tag: t.comment, color: '#57606a', fontStyle: 'italic' },
    { tag: t.meta, color: '#57606a' },
    { tag: [t.keyword, t.operator], color: red[600] },
    { tag: [t.string, t.regexp], color: teal[600] },
    { tag: [t.number, t.bool, t.null], color: teal[700] },
    { tag: t.variableName, color: '#24292f' },
    { tag: t.propertyName, color: teal[700] },
    { tag: t.className, color: teal[800] },
    { tag: t.typeName, color: teal[700] },
  ])),
];
