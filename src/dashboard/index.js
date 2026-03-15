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
          // Wire drag on the widget's toolbar (the widget owns the toolbar,
          // the dashboard just makes it draggable — like dragging a window
          // by its title bar). Looks for [data-habi-toolbar] or .habi-toolbar.
          // Falls back to a minimal drag strip if the widget has no toolbar.
          wireToolbarDrag(widgetEl, cell.id);
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

  // --- Toolbar drag wiring ---

  function wireToolbarDrag(widgetEl, cellId) {
    // Skip if already wired
    if (widgetEl._habiDragWired) return;
    widgetEl._habiDragWired = true;

    // Find the widget's toolbar
    let toolbar = widgetEl.querySelector("[data-habi-toolbar], .habi-toolbar");

    if (!toolbar) {
      // No toolbar — add a minimal drag strip as fallback
      toolbar = document.createElement("div");
      toolbar.className = "habi-drag-strip";
      widgetEl.prepend(toolbar);
    }

    toolbar.classList.add("habi-draggable");
    toolbar.style.cursor = "grab";

    toolbar.addEventListener("mousedown", (e) => {
      // Don't drag if clicking a button/input inside the toolbar
      if (e.target.closest("button, input, select, textarea, a")) return;
      e.stopPropagation();
      startWidgetDrag(e, cellId);
    });
    toolbar.addEventListener("touchstart", (e) => {
      if (e.target.closest("button, input, select, textarea, a")) return;
      e.stopPropagation();
      startWidgetDrag(normalizeTouchEvent(e), cellId);
    }, { passive: false });
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
    const rowWidth = rowEl.offsetWidth;
    const leftWidth = leftCellEl.offsetWidth;
    const rightWidth = rightCellEl.offsetWidth;
    const totalWidth = leftWidth + rightWidth;
    // Minimum 10% of row width per cell
    const minPx = Math.max(80, rowWidth * 0.1);

    function onMove(e) {
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? startX;
      const dx = x - startX;
      const newLeft = Math.max(minPx, Math.min(totalWidth - minPx, leftWidth + dx));
      const newRight = totalWidth - newLeft;
      // Express as percentage of full row, not just the two cells
      const leftPct = ((newLeft / rowWidth) * 100).toFixed(1) + "%";
      const rightPct = ((newRight / rowWidth) * 100).toFixed(1) + "%";

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
  //
  // Drop zones:
  //   - Left edge (first 20%) of a cell   → insert before that cell
  //   - Right edge (last 20%) of a cell   → insert after that cell
  //   - Center (middle 60%) of a cell     → swap with that cell
  //   - Bottom 40px of dashboard          → create new row with the widget

  function startWidgetDrag(e, cellId) {
    e.preventDefault();
    const widgetEl = widgetEls.get(cellId);
    if (!widgetEl) return;

    widgetEl.classList.add("dragging");
    let indicator = null; // insertion line element
    let lastDrop = null;  // { type: "swap"|"insert-before"|"insert-after"|"new-row", targetCellId, targetRowId }

    function onMove(e) {
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x === undefined || y === undefined) return;

      clearDropFeedback();
      lastDrop = findDropZone(x, y, cellId);

      if (!lastDrop) return;

      if (lastDrop.type === "swap") {
        const cellEl = el.querySelector(`[data-cell-id="${lastDrop.targetCellId}"]`);
        if (cellEl) cellEl.classList.add("drop-target");
      } else if (lastDrop.type === "insert-before" || lastDrop.type === "insert-after") {
        const cellEl = el.querySelector(`[data-cell-id="${lastDrop.targetCellId}"]`);
        if (cellEl) showInsertIndicator(cellEl, lastDrop.type === "insert-before" ? "left" : "right");
      } else if (lastDrop.type === "new-row") {
        showNewRowIndicator();
      }
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);

      widgetEl.classList.remove("dragging");
      clearDropFeedback();

      if (lastDrop) {
        // FLIP animation: capture old positions, mutate, animate to new positions
        const snapshot = capturePositions();
        executeDrop(cellId, lastDrop);
        animateFromSnapshot(snapshot);
      }
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);

    function clearDropFeedback() {
      el.querySelectorAll(".drop-target").forEach((e) => e.classList.remove("drop-target"));
      if (indicator) { indicator.remove(); indicator = null; }
    }

    function showInsertIndicator(cellEl, side) {
      indicator = document.createElement("div");
      indicator.className = "habi-insert-indicator";
      const rect = cellEl.getBoundingClientRect();
      const dashRect = el.getBoundingClientRect();
      indicator.style.position = "absolute";
      indicator.style.top = (rect.top - dashRect.top) + "px";
      indicator.style.height = rect.height + "px";
      indicator.style.left = (side === "left"
        ? rect.left - dashRect.left - 2
        : rect.right - dashRect.left - 2) + "px";
      indicator.style.width = "4px";
      el.appendChild(indicator);
    }

    function showNewRowIndicator() {
      indicator = document.createElement("div");
      indicator.className = "habi-insert-indicator habi-insert-row";
      const addBtn = el.querySelector(".habi-add-row");
      if (addBtn) {
        const btnRect = addBtn.getBoundingClientRect();
        const dashRect = el.getBoundingClientRect();
        indicator.style.position = "absolute";
        indicator.style.top = (btnRect.top - dashRect.top - 2) + "px";
        indicator.style.left = "4px";
        indicator.style.right = "4px";
        indicator.style.height = "4px";
        indicator.style.width = "auto";
      }
      el.appendChild(indicator);
    }
  }

  function findDropZone(x, y, excludeCellId) {
    const cells = el.querySelectorAll(".habi-cell");

    for (const cellEl of cells) {
      if (cellEl.dataset.cellId === excludeCellId) continue;
      const rect = cellEl.getBoundingClientRect();
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;

      const rowId = cellEl.parentElement?.dataset.rowId;
      const row = layout.rows.find((r) => r.id === rowId);

      // Check if the target row is already at max capacity for inserts
      const relX = (x - rect.left) / rect.width;

      if (relX < 0.2 && row && row.cells.length < 4) {
        return { type: "insert-before", targetCellId: cellEl.dataset.cellId, targetRowId: rowId };
      } else if (relX > 0.8 && row && row.cells.length < 4) {
        return { type: "insert-after", targetCellId: cellEl.dataset.cellId, targetRowId: rowId };
      } else {
        return { type: "swap", targetCellId: cellEl.dataset.cellId };
      }
    }

    // Check if cursor is in the "add row" area at the bottom
    const addBtn = el.querySelector(".habi-add-row");
    if (addBtn) {
      const rect = addBtn.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top - 20 && y <= rect.bottom) {
        return { type: "new-row" };
      }
    }

    return null;
  }

  function executeDrop(sourceCellId, drop) {
    // Find source cell and remove it from its row
    let sourceCell = null;
    let sourceRow = null;
    let sourceIdx = -1;

    for (const row of layout.rows) {
      const idx = row.cells.findIndex((c) => c.id === sourceCellId);
      if (idx !== -1) {
        sourceCell = row.cells[idx];
        sourceRow = row;
        sourceIdx = idx;
        break;
      }
    }
    if (!sourceCell) return;

    if (drop.type === "swap") {
      // Swap source and target
      let targetRow = null, targetIdx = -1;
      for (const row of layout.rows) {
        const idx = row.cells.findIndex((c) => c.id === drop.targetCellId);
        if (idx !== -1) { targetRow = row; targetIdx = idx; break; }
      }
      if (!targetRow) return;

      const targetCell = targetRow.cells[targetIdx];
      sourceRow.cells[sourceIdx] = targetCell;
      targetRow.cells[targetIdx] = sourceCell;
    } else if (drop.type === "insert-before" || drop.type === "insert-after") {
      // Remove from source
      sourceRow.cells.splice(sourceIdx, 1);

      // Find target position
      const targetRow = layout.rows.find((r) => r.id === drop.targetRowId);
      if (!targetRow) return;
      const targetIdx = targetRow.cells.findIndex((c) => c.id === drop.targetCellId);
      if (targetIdx === -1) return;

      // Insert at position
      const insertIdx = drop.type === "insert-before" ? targetIdx : targetIdx + 1;
      targetRow.cells.splice(insertIdx, 0, sourceCell);

      // Redistribute widths evenly in the target row
      redistributeWidths(targetRow);
      // Also redistribute source row if it still has cells
      if (sourceRow.cells.length > 0 && sourceRow !== targetRow) {
        redistributeWidths(sourceRow);
      }

      // Clean up empty source row
      if (sourceRow.cells.length === 0) {
        layout.rows = layout.rows.filter((r) => r.id !== sourceRow.id);
      }
    } else if (drop.type === "new-row") {
      // Remove from source
      sourceRow.cells.splice(sourceIdx, 1);
      if (sourceRow.cells.length === 0) {
        layout.rows = layout.rows.filter((r) => r.id !== sourceRow.id);
      }
      // Create new row with the widget
      layout.rows.push({
        id: generateId(),
        height: null,
        cells: [sourceCell],
      });
    }

    notifyChange();
    render();
  }

  // --- Helpers ---

  // --- FLIP animation ---

  /**
   * Capture bounding rects of all widget containers keyed by cell ID.
   */
  function capturePositions() {
    const positions = new Map();
    for (const [cellId, widgetEl] of widgetEls) {
      if (widgetEl.offsetParent !== null) {
        positions.set(cellId, widgetEl.getBoundingClientRect());
      }
    }
    return positions;
  }

  /**
   * After a layout change, animate widgets from their old positions
   * to their new positions using FLIP.
   */
  function animateFromSnapshot(oldPositions) {
    for (const [cellId, widgetEl] of widgetEls) {
      const oldRect = oldPositions.get(cellId);
      if (!oldRect || widgetEl.offsetParent === null) continue;

      const newRect = widgetEl.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      const sx = oldRect.width / (newRect.width || 1);
      const sy = oldRect.height / (newRect.height || 1);

      // Skip if barely moved
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) continue;

      // Invert: place at old position
      widgetEl.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      widgetEl.style.transformOrigin = "top left";
      widgetEl.style.transition = "none";

      // Play: animate to new position
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          widgetEl.style.transition = "transform 0.25s cubic-bezier(0.2, 0, 0, 1)";
          widgetEl.style.transform = "";
          widgetEl.addEventListener("transitionend", function cleanup() {
            widgetEl.removeEventListener("transitionend", cleanup);
            widgetEl.style.transition = "";
            widgetEl.style.transformOrigin = "";
          }, { once: true });
        });
      });
    }
  }

  /**
   * Reset all cell widths in a row so they distribute evenly.
   */
  function redistributeWidths(row) {
    for (const cell of row.cells) {
      cell.width = null;
    }
  }

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
