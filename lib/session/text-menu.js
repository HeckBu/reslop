'use strict';

const TEXT_ACTIONS = [
  'textCut',
  'textCopy',
  'textPaste',
  'textDelete',
  'textSelectAll',
];

const textEditor = (ui, cell) => {
  if (ui.mode === 'compose') return ui.editor;
  const statusY = ui.lastFrame?.height - 1;
  if (cell.y !== statusY) return null;
  if (ui.mode === 'find') return ui.nav.find?.editor;
  if (ui.mode === 'import') return ui.nav.import?.editor;
  return null;
};

const textDisabled = (editor) => {
  const off = editor.hasSelect() ? [] : ['textCut', 'textCopy'];
  if (!editor.hasSelect() && editor.cursor >= editor.text.length) {
    off.push('textDelete');
  }
  if (!editor.text) off.push('textSelectAll');
  return off;
};

const TEXT_KEYS = {
  textCut: 'ctrl-x',
  textCopy: 'ctrl-c',
  textPaste: 'ctrl-v',
  textDelete: 'delete',
};

const runTextAction = (ui, menu, action) => {
  const editor = menu.editor;
  if (!editor) return false;
  if (action === 'textSelectAll') {
    editor.anchor = 0;
    editor.cursor = editor.text.length;
    if (ui.mode === 'compose') ui.composer.afterEdit();
  } else {
    const key = TEXT_KEYS[action];
    if (key) ui.handleEvent({ type: 'key', key });
  }
  return true;
};

module.exports = { TEXT_ACTIONS, textEditor, textDisabled, runTextAction };
