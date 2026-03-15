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
 *
 * Widget DOM preservation: when the layout re-renders (e.g. after adding
 * a row), existing widget containers are detached and re-inserted — not
 * destroyed. This preserves xterm.js terminals, WebSocket connections,
 * and other stateful widget content across layout changes.
 */

const { createWidget, become } = require("../widget");

/**
 * Create a dashboard inside an element.
 *
 * @param {HTMLElement} el - Container element
 * @param {object} opts
 * @param {object} opts.layout - Initial layout state
 * @param {function} opts.onLayoutChange - Called when layout changes (for persistence)
 * @param {function} opts.onAddWidget - Called when user clicks "+ Add widget"
 * @returns {object} Dashboard API
 */
function createDashboard(el, opts = {}) {
  const { onLayoutChange } = opts;
  let layout = opts.layout || { rows: [] };
  const widgets = new Map();       // cellId → widget instance
  const widgetEls = new Map();     // cellId → widget container DOM node (preserved across re-renders)

  el.classList.add("habi-dashboard");

  /**
   * Render the full dashboard from layout state.
   * Preserves existing widget DOM nodes by detaching and re-inserting them.
   */
  function render() {
    // Detach (don't destroy) existing widget containers
    for (const [cellId, widgetEl] of widgetEls) {
      if (widgetEl.parentNode) widgetEl.parentNode.removeChild(widgetEl);
    }

    // Clear scaffold (rows, handles, buttons) but widgets are safely detached
    el.innerHTML = "";

    // Track which cells are still in the layout
    const activeCellIds = new Set();

    for (const row of layout.rows) {
      const rowEl = document.createElement("div");
      rowEl.className = "habi-row";
      rowEl.dataset.rowId = row.id;
      if (row.height) rowEl.style.height = row.height;

      for (let i = 0; i < row.cells.length; i++) {
        const cell = row.cells[i];
        activeCellIds.add(cell.id);

        // Resize handle between cells
        if (i > 0) {
          const handle = document.createElement("div");
          handle.className = "habi-col-handle";
          addDragListeners(handle, (e) => startColResize(e, row, i - 1, i));
          rowEl.appendChild(handle);
        }

        const cellEl = document.createElement("div");
        cellEl.className = "habi-cell";
        cellEl.dataset.cellId = cell.id;
        if (cell.width) cellEl.style.flex = `0 0 ${cell.width}`;
        else cellEl.style.flex = "1";

        if (cell.widgetType) {
          // Re-use existing widget container or create new one
          let widgetEl = widgetEls.get(cell.id);
          if (!widgetEl) {
            widgetEl = document.createElement("div");
            widgetEl.className = "habi-widget-container";
            widgetEls.set(cell.id, widgetEl);

            try {
              const widget = become(widgetEl, cell.widgetType, cell.context || {});
              widgets.set(cell.id, widget);
            } catch (err) {
              widgetEl.textContent = `Widget error: ${err.message}`;
              widgetEl.classList.add("habi-widget-error");
            }
          }
          // Add drag handle bar for reordering (full-width, always visible)
          if (!widgetEl.querySelector(".habi-drag-handle")) {
            const grip = document.createElement("div");
            grip.className = "habi-drag-handle";
            grip.innerHTML = '<span class="habi-drag-dots">⠿</span>';
            grip.title = "Drag to move";
            // Stop propagation so widget content doesn't steal the event
            grip.addEventListener("mousedown", (e) => { e.stopPropagation(); });
            grip.addEventListener("touchstart", (e) => { e.stopPropagation(); }, { passive: false });
            addDragListeners(grip, (e) => startWidgetDrag(e, cell.id));
            widgetEl.prepend(grip);
          }
          cellEl.appendChild(widgetEl);
        } else {
          // Empty cell — show add button
          const widgetEl = document.createElement("div");
          widgetEl.className = "habi-widget-container";
          renderEmptyCell(widgetEl, cell);
          cellEl.appendChild(widgetEl);
        }

        rowEl.appendChild(cellEl);
      }

      el.appendChild(rowEl);

      // Row resize handle
      const rowHandle = document.createElement("div");
      rowHandle.className = "habi-row-handle";
      addDragListeners(rowHandle, (e) => startRowResize(e, row));
      el.appendChild(rowHandle);
    }

    // Clean up widgets for cells no longer in the layout
    for (const [cellId, widget] of widgets) {
      if (!activeCellIds.has(cellId)) {
        try { widget.unmount(); } catch { /* ok */ }
        widgets.delete(cellId);
        widgetEls.delete(cellId);
      }
    }

    // Add-row button
    const addRowBtn = document.createElement("button");
    addRowBtn.className = "habi-add-row";
    addRowBtn.textContent = "+";
    addRowBtn.title = "Add row";
    addRowBtn.addEventListener("click", () => addRow());
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
    if (row.cells.length >= 4) return null;

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
        row.cells.splice(idx, 1);
        if (row.cells.length === 0) {
          layout.rows = layout.rows.filter((r) => r.id !== row.id);
        }
        notifyChange();
        render(); // Widget cleanup happens in render()'s activeCellIds check
        return true;
      }
    }
    return false;
  }

  function setCellWidget(cellId, widgetType, context) {
    for (const row of layout.rows) {
      const cell = row.cells.find((c) => c.id === cellId);
      if (cell) {
        // Unmount and discard old widget — this cell gets a new one
        const existing = widgets.get(cellId);
        if (existing) {
          try { existing.unmount(); } catch { /* ok */ }
          widgets.delete(cellId);
        }
        widgetEls.delete(cellId);
        cell.widgetType = widgetType;
        cell.context = context || {};
        notifyChange();
        render();
        return true;
      }
    }
    return false;
  }

  // --- Resize handling (mouse + touch) ---

  function addDragListeners(el, onStart) {
    el.addEventListener("mousedown", onStart);
    el.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        onStart(normalizeTouchEvent(e));
      }
    }, { passive: false });
  }

  function normalizeTouchEvent(e) {
    e.preventDefault();
    return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, preventDefault() {} };
  }

  function startColResize(e, row, leftIdx, rightIdx) {
    e.preventDefault();
    const rowEl = el.querySelector(`[data-row-id="${row.id}"]`);
    if (!rowEl) return;

    const leftCellEl = rowEl.querySelector(`[data-cell-id="${row.cells[leftIdx].id}"]`);
    const rightCellEl = rowEl.querySelector(`[data-cell-id="${row.cells[rightIdx].id}"]`);
    if (!leftCellEl || !rightCellEl) return;

    // Find the handle element and add active class
    const handles = rowEl.querySelectorAll(".habi-col-handle");
    const handleEl = handles[leftIdx]; // handle at index leftIdx is between left and right
    if (handleEl) handleEl.classList.add("active");
    el.classList.add("resizing-col");

    const startX = e.clientX;
    const leftWidth = leftCellEl.offsetWidth;
    const rightWidth = rightCellEl.offsetWidth;
    const totalWidth = leftWidth + rightWidth;

    function onMove(e) {
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? startX;
      const dx = x - startX;
      const newLeft = Math.max(100, Math.min(totalWidth - 100, leftWidth + dx));
      const newRight = totalWidth - newLeft;
      const leftPct = ((newLeft / totalWidth) * 100).toFixed(1) + "%";
      const rightPct = ((newRight / totalWidth) * 100).toFixed(1) + "%";

      leftCellEl.style.flex = `0 0 ${leftPct}`;
      rightCellEl.style.flex = `0 0 ${rightPct}`;
      row.cells[leftIdx].width = leftPct;
      row.cells[rightIdx].width = rightPct;
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      if (handleEl) handleEl.classList.remove("active");
      el.classList.remove("resizing-col");
      notifyChange();
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  }

  function startRowResize(e, row) {
    e.preventDefault();
    const rowEl = el.querySelector(`[data-row-id="${row.id}"]`);
    if (!rowEl) return;

    // Find the row handle and add active class
    const handleEl = rowEl.nextElementSibling;
    if (handleEl?.classList.contains("habi-row-handle")) handleEl.classList.add("active");
    el.classList.add("resizing-row");

    const startY = e.clientY;
    const startHeight = rowEl.offsetHeight;

    function onMove(e) {
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? startY;
      const dy = y - startY;
      const newHeight = Math.max(100, startHeight + dy);
      rowEl.style.height = newHeight + "px";
      row.height = newHeight + "px";
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      if (handleEl?.classList.contains("habi-row-handle")) handleEl.classList.remove("active");
      el.classList.remove("resizing-row");
      notifyChange();
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  }

  // --- Widget drag-to-reorder ---

  function startWidgetDrag(e, cellId) {
    e.preventDefault();
    const widgetEl = widgetEls.get(cellId);
    if (!widgetEl) return;

    widgetEl.classList.add("dragging");
    let currentDropTarget = null;

    function onMove(e) {
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x === undefined || y === undefined) return;

      // Find cell under cursor (excluding the dragged widget's cell)
      const target = findDropTarget(x, y, cellId);

      if (target !== currentDropTarget) {
        if (currentDropTarget) {
          const prevCell = el.querySelector(`[data-cell-id="${currentDropTarget}"]`);
          if (prevCell) prevCell.classList.remove("drop-target");
        }
        currentDropTarget = target;
        if (currentDropTarget) {
          const nextCell = el.querySelector(`[data-cell-id="${currentDropTarget}"]`);
          if (nextCell) nextCell.classList.add("drop-target");
        }
      }
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);

      widgetEl.classList.remove("dragging");
      if (currentDropTarget) {
        const prevCell = el.querySelector(`[data-cell-id="${currentDropTarget}"]`);
        if (prevCell) prevCell.classList.remove("drop-target");
        swapCells(cellId, currentDropTarget);
      }
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  }

  function findDropTarget(x, y, excludeCellId) {
    const cells = el.querySelectorAll(".habi-cell");
    for (const cell of cells) {
      if (cell.dataset.cellId === excludeCellId) continue;
      const rect = cell.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return cell.dataset.cellId;
      }
    }
    return null;
  }

  function swapCells(cellIdA, cellIdB) {
    let cellA = null, cellB = null;
    let rowA = null, rowB = null;
    let idxA = -1, idxB = -1;

    for (const row of layout.rows) {
      for (let i = 0; i < row.cells.length; i++) {
        if (row.cells[i].id === cellIdA) { cellA = row.cells[i]; rowA = row; idxA = i; }
        if (row.cells[i].id === cellIdB) { cellB = row.cells[i]; rowB = row; idxB = i; }
      }
    }

    if (!cellA || !cellB) return;

    // Swap in layout
    rowA.cells[idxA] = cellB;
    rowB.cells[idxB] = cellA;

    notifyChange();
    render();
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
    widgetEls.clear();
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
