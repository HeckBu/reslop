'use strict';

const { indexAtRow } = require('../term/wrap.js');

const hitAt = (hits, cell) =>
  hits.find((hit) => {
    if (hit.y !== cell.y) return false;
    const x0 = hit.x0 ?? hit.textX;
    return cell.x >= x0 && (hit.x1 === undefined || cell.x < hit.x1);
  });

const offsetOf = (hit, cellX) => {
  const col = Math.max(0, cellX - hit.textX) + (hit.scroll || 0);
  const at = indexAtRow(hit.start || 0, hit.text, col);
  return Math.min(at, hit.limit ?? Infinity);
};

const focusField = (ui, hit) => {
  if (ui.composeKind !== 'npm' || !hit.field) return true;
  if (hit.field === ui.npm.editField) return true;
  return ui.npm.focusField(hit.field);
};

const activeEditor = (ui) => {
  if (ui.pane === 'agents' && ui.agents.pick) return ui.agents.pick.editor;
  if (ui.pane === 'tasks' && ui.composer.tasks.planOpen) {
    return ui.composer.tasks.planPick.editor;
  }
  if (ui.mode === 'find') return ui.nav.find?.editor;
  if (ui.mode === 'import') return ui.nav.import?.editor;
  return ui.mode === 'compose' ? ui.editor : null;
};

const editorHits = (ui, editor) =>
  (ui.lastFrame?.editHits ?? []).filter(
    (hit) => (hit.editor ?? ui.editor) === editor,
  );

const revealEditor = (ui) => {
  if (ui.mode === 'compose') ui.composer.afterEdit();
  ui.paint();
};

const beginEditDrag = (ui, cell, extend = false) => {
  const editor = activeEditor(ui);
  if (!editor) return false;
  const hit = hitAt(editorHits(ui, editor), cell);
  if (!hit) return false;
  if (!focusField(ui, hit)) {
    ui.paint();
    return true;
  }
  const previous = editor.anchor ?? editor.cursor;
  const anchor = extend ? previous : offsetOf(hit, cell.x);
  editor.place(offsetOf(hit, cell.x));
  if (extend && anchor !== editor.cursor) editor.anchor = anchor;
  ui.nav.clearSelection();
  ui.nav.editDrag = { editor, anchor, field: hit.field, cell };
  revealEditor(ui);
  return true;
};

const moveEditDrag = (ui, cell, release = false) => {
  const drag = ui.nav.editDrag;
  if (!drag) return false;
  if (release && drag.cell.x === cell.x && drag.cell.y === cell.y) {
    ui.nav.editDrag = null;
    return true;
  }
  if (activeEditor(ui) === drag.editor) {
    const hits = editorHits(ui, drag.editor).filter(
      (hit) => hit.field === drag.field,
    );
    const hit = hits.reduce((nearest, candidate) => {
      if (!nearest) return candidate;
      return Math.abs(candidate.y - cell.y) < Math.abs(nearest.y - cell.y)
        ? candidate
        : nearest;
    }, null);
    if (hit) {
      const x = Math.min(cell.x, (hit.x1 ?? cell.x + 1) - 1);
      drag.editor.place(offsetOf(hit, x));
      if (drag.anchor !== drag.editor.cursor) drag.editor.anchor = drag.anchor;
      drag.cell = cell;
      revealEditor(ui);
    }
  }
  if (release) ui.nav.editDrag = null;
  return true;
};

module.exports = {
  hitAt,
  offsetOf,
  focusField,
  beginEditDrag,
  moveEditDrag,
};
