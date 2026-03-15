/**
 * Dashboard Layout
 *
 * A Notion-style dashboard that arranges widgets in rows and columns.
 * Each row can hold up to 4 widgets. Column widths are adjustable
 * by dragging the resize handles between them. Row heights are
 * adjustable by dragging the border between rows.
 *
 * The dashboard is the top-level container for a kubo workspace.
 * It replaces the tab bar — each widget is a view into the workspace.
 *
 * Layout state is a simple JSON structure:
 *   { rows: [{ id, height, cells: [{ id, width, widgetType, context }] }] }
 */

const { createWidget, become } = require("../widget");

/**
 * Create a dashboard inside an element.
 *
 * @param {HTMLElement} el - Container element
 * @param {object} opts
 * @param {object} opts.layout - Initial layout state
 * @param {function} opts.onLayoutChange - Called when layout changes (for persistence)
 * @returns {object} Dashboard API
 */
function createDashboard(el, opts = {}) {
  const { onLayoutChange } = opts;
  let layout = opts.layout || { rows: [] };
  const widgets = new Map(); // cellId → widget instance

  el.classList.add("habi-dashboard");

  /**
   * Render the full dashboard from layout state.
   */
  function render() {
    // Unmount all existing widgets
    for (const [, widget] of widgets) {
      try { widget.unmount(); } catch { /* already unmounted */ }
    }
    widgets.clear();
    el.innerHTML = "";

    for (const row of layout.rows) {
      const rowEl = document.createElement("div");
      rowEl.className = "habi-row";
      rowEl.dataset.rowId = row.id;
      if (row.height) rowEl.style.height = row.height;

      for (let i = 0; i < row.cells.length; i++) {
        const cell = row.cells[i];

        // Resize handle between cells
        if (i > 0) {
          const handle = document.createElement("div");
          handle.className = "habi-col-handle";
          handle.addEventListener("mousedown", (e) => startColResize(e, row, i - 1, i));
          rowEl.appendChild(handle);
        }

        const cellEl = document.createElement("div");
        cellEl.className = "habi-cell";
        cellEl.dataset.cellId = cell.id;
        if (cell.width) cellEl.style.flex = `0 0 ${cell.width}`;
        else cellEl.style.flex = "1";

        // Widget container
        const widgetEl = document.createElement("div");
        widgetEl.className = "habi-widget-container";
        cellEl.appendChild(widgetEl);

        if (cell.widgetType) {
          try {
            const widget = become(widgetEl, cell.widgetType, cell.context || {});
            widgets.set(cell.id, widget);
          } catch (err) {
            widgetEl.textContent = `Widget error: ${err.message}`;
            widgetEl.classList.add("habi-widget-error");
          }
        } else {
          // Empty cell — show add button
          renderEmptyCell(widgetEl, cell);
        }

        rowEl.appendChild(cellEl);
      }

      el.appendChild(rowEl);

      // Row resize handle
      const rowHandle = document.createElement("div");
      rowHandle.className = "habi-row-handle";
      rowHandle.addEventListener("mousedown", (e) => startRowResize(e, row));
      el.appendChild(rowHandle);
    }

    // Add-row button
    const addRowBtn = document.createElement("button");
    addRowBtn.className = "habi-add-row";
    addRowBtn.textContent = "+";
    addRowBtn.title = "Add row";
    addRowBtn.addEventListener("click", () => {
      addRow();
    });
    el.appendChild(addRowBtn);
  }

  function renderEmptyCell(el, cell) {
    const btn = document.createElement("button");
    btn.className = "habi-add-widget";
    btn.textContent = "+ Add widget";
    btn.addEventListener("click", () => {
      if (opts.onAddWidget) {
        opts.onAddWidget(cell.id, (widgetType, context) => {
          cell.widgetType = widgetType;
          cell.context = context;
          notifyChange();
          render();
        });
      }
    });
    el.appendChild(btn);
  }

  // --- Layout mutations ---

  function addRow(cells) {
    const row = {
      id: generateId(),
      height: null,
      cells: cells || [{ id: generateId(), width: null, widgetType: null, context: {} }],
    };
    layout.rows.push(row);
    notifyChange();
    render();
    return row;
  }

  function addCell(rowId, widgetType, context) {
    const row = layout.rows.find((r) => r.id === rowId);
    if (!row) return null;
    if (row.cells.length >= 4) return null; // Max 4 per row

    const cell = { id: generateId(), width: null, widgetType, context: context || {} };
    row.cells.push(cell);
    notifyChange();
    render();
    return cell;
  }

  function removeCell(cellId) {
    for (const row of layout.rows) {
      const idx = row.cells.findIndex((c) => c.id === cellId);
      if (idx !== -1) {
        const widget = widgets.get(cellId);
        if (widget) {
          try { widget.unmount(); } catch { /* ok */ }
          widgets.delete(cellId);
        }
        row.cells.splice(idx, 1);
        // Remove empty rows
        if (row.cells.length === 0) {
          layout.rows = layout.rows.filter((r) => r.id !== row.id);
        }
        notifyChange();
        render();
        return true;
      }
    }
    return false;
  }

  function setCellWidget(cellId, widgetType, context) {
    for (const row of layout.rows) {
      const cell = row.cells.find((c) => c.id === cellId);
      if (cell) {
        // Unmount existing widget
        const existing = widgets.get(cellId);
        if (existing) {
          try { existing.unmount(); } catch { /* ok */ }
          widgets.delete(cellId);
        }
        cell.widgetType = widgetType;
        cell.context = context || {};
        notifyChange();
        render();
        return true;
      }
    }
    return false;
  }

  // --- Resize handling ---

  function startColResize(e, row, leftIdx, rightIdx) {
    e.preventDefault();
    const rowEl = el.querySelector(`[data-row-id="${row.id}"]`);
    if (!rowEl) return;

    const cells = rowEl.querySelectorAll(".habi-cell");
    const leftCell = cells[leftIdx];
    const rightCell = cells[rightIdx];
    if (!leftCell || !rightCell) return;

    const startX = e.clientX;
    const leftWidth = leftCell.offsetWidth;
    const rightWidth = rightCell.offsetWidth;
    const totalWidth = leftWidth + rightWidth;

    function onMove(e) {
      const dx = e.clientX - startX;
      const newLeft = Math.max(100, Math.min(totalWidth - 100, leftWidth + dx));
      const newRight = totalWidth - newLeft;
      const leftPct = ((newLeft / totalWidth) * 100).toFixed(1) + "%";
      const rightPct = ((newRight / totalWidth) * 100).toFixed(1) + "%";

      leftCell.style.flex = `0 0 ${leftPct}`;
      rightCell.style.flex = `0 0 ${rightPct}`;

      row.cells[leftIdx].width = leftPct;
      row.cells[rightIdx].width = rightPct;
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      notifyChange();
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function startRowResize(e, row) {
    e.preventDefault();
    const rowEl = el.querySelector(`[data-row-id="${row.id}"]`);
    if (!rowEl) return;

    const startY = e.clientY;
    const startHeight = rowEl.offsetHeight;

    function onMove(e) {
      const dy = e.clientY - startY;
      const newHeight = Math.max(100, startHeight + dy);
      rowEl.style.height = newHeight + "px";
      row.height = newHeight + "px";
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      notifyChange();
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // --- Helpers ---

  function notifyChange() {
    if (onLayoutChange) onLayoutChange(layout);
  }

  function getLayout() {
    return layout;
  }

  function getWidget(cellId) {
    return widgets.get(cellId);
  }

  function unmount() {
    for (const [, widget] of widgets) {
      try { widget.unmount(); } catch { /* ok */ }
    }
    widgets.clear();
    el.innerHTML = "";
  }

  // Initial render
  render();

  return {
    render,
    addRow,
    addCell,
    removeCell,
    setCellWidget,
    getLayout,
    getWidget,
    unmount,
  };
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

module.exports = { createDashboard };
