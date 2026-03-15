var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var src = {exports: {}};

var tanaw_bundle = {exports: {}};

(function (module, exports$1) {
	(function (global, factory) {
		module.exports = factory() ;
	})(commonjsGlobal, (function () {
		function getDefaultExportFromCjs (x) {
			return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
		}

		function style(stylesObject) {
		  if (isEmpty(stylesObject)) return stylesObject;
		  return compileStyles(processStyles({ stylesObject }));
		}

		const NO_SELECTOR = '__*__';

		function processStyles({ stylesObject, parentSelector = '', cssObject = {}, nestedSelector = '' }) {
		  if (Array.isArray(stylesObject)) {
		    const [property, value] = stylesObject;
		    const cssProperty = `${camelToKebabCase(property)}:${value};`;
		    const targetObject = nestedSelector ? (cssObject[nestedSelector] = cssObject[nestedSelector] || {}) : cssObject;
		    const key = camelToKebabCase(parentSelector || NO_SELECTOR);

		    targetObject[key] = (targetObject[key] || '') + cssProperty;
		  } else {
		    Object.keys(stylesObject).forEach(key => {
		      const value = stylesObject[key];
		      if (key.startsWith('@')) {
		        // Inline handling for media queries and nested selectors
		        processStyles({
		          stylesObject: value,
		          cssObject: cssObject,
		          nestedSelector: key
		        });
		      } else if (typeof value !== 'object') {
		        // Inline handling for direct property-value pairs
		        const cssProperty = `${camelToKebabCase(key)}:${value};`;
		        const targetObject = nestedSelector ? (cssObject[nestedSelector] = cssObject[nestedSelector] || {}) : cssObject;
		        const combinedKey = camelToKebabCase(parentSelector || NO_SELECTOR);
		        targetObject[combinedKey] = (targetObject[combinedKey] || '') + cssProperty;
		      } else {
		        // Inline handling for nested selectors
		        const combinedSelector = combineSelectors(parentSelector, key);
		        processStyles({
		          stylesObject: value,
		          parentSelector: combinedSelector,
		          cssObject: cssObject,
		          nestedSelector
		        });
		      }
		    });
		  }

		  return cssObject;
		}

		function combineSelectors(parent, child) {
		  if (!parent) return child;
		  const parentSelectors = splitAndTrim(parent);
		  const childSelectors = splitAndTrim(child);

		  const combined = parentSelectors.map(p =>
		    childSelectors.map(c => `${p}${c.startsWith(':') ? '' : ' '}${c}`).join(',')
		  ).join(',');

		  return combined;
		}

		function camelToKebabCase(str) {
		  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
		}

		function splitAndTrim(str) {
		  return str.split(',').map(s => s.trim());
		}

		function compileStyles(cssObject) {
		  if (typeof cssObject !== 'object' || Array.isArray(cssObject) || isEmpty(cssObject)) {
		    return cssObject;
		  }

		  return Object.entries(cssObject).map(([key, value]) =>
		    key === NO_SELECTOR ? compileStyles(value) : `${key}{${compileStyles(value)}}`
		  ).join('');
		}

		function isEmpty(obj) {
		  return !obj || Object.keys(obj).length === 0;
		}

		var tanaw = {
		  style
		};

		var tanaw$1 = /*@__PURE__*/getDefaultExportFromCjs(tanaw);

		return tanaw$1;

	})); 
} (tanaw_bundle));

var tanaw_bundleExports = tanaw_bundle.exports;

/**
 * Widget Protocol
 *
 * A widget is a self-contained unit that knows how to render itself
 * inside a DOM element. Widgets have a lifecycle:
 *
 *   mount(el, context)  — render into the element
 *   update(context)     — re-render with new data
 *   unmount()           — clean up
 *
 * Widget types are registered in a registry. When you tell an element
 * to "become" something, the registry resolves the type and mounts it.
 *
 * Built-in types: yolo, terminal, file-browser
 * Custom types: created by Claude through a yolo session
 */

const registry = new Map();

/**
 * Register a widget type.
 *
 * @param {string} type - Widget type name (e.g. "yolo", "terminal")
 * @param {object} factory - { create(el, context) → widget }
 *   widget must implement: { update(context), unmount(), el }
 */
function registerWidget(type, factory) {
  registry.set(type, factory);
}

/**
 * Create and mount a widget.
 *
 * @param {HTMLElement} el - Container element
 * @param {string} type - Widget type
 * @param {object} context - Initial context (cwd, session, config, etc.)
 * @returns {object} Widget instance with { update, unmount, el, type }
 */
function createWidget$1(el, type, context = {}) {
  const factory = registry.get(type);
  if (!factory) {
    throw new Error(`Unknown widget type: "${type}". Registered: ${[...registry.keys()].join(", ")}`);
  }

  const widget = factory.create(el, context);
  widget.type = type;
  widget.el = el;
  el.setAttribute("data-widget", type);
  el.setAttribute("data-widget-id", context.id || generateId$1());

  return widget;
}

/**
 * Tell an element to become a widget.
 *
 * @param {HTMLElement} el - The element
 * @param {string} typeOrDescription - A registered type name, or a freeform
 *   description that will be resolved (via yolo) into a widget
 * @param {object} context - Context for the widget
 * @returns {object} Widget instance
 */
function become$1(el, typeOrDescription, context = {}) {
  if (registry.has(typeOrDescription)) {
    return createWidget$1(el, typeOrDescription, context);
  }

  // Freeform description → create via a yolo session
  // The "meta" widget type handles this: it's a yolo session
  // whose job is to generate and render a custom widget
  return createWidget$1(el, "meta", {
    ...context,
    description: typeOrDescription,
  });
}

/**
 * Get all registered widget types.
 * @returns {string[]}
 */
function listWidgetTypes() {
  return [...registry.keys()];
}

function generateId$1() {
  return Math.random().toString(36).slice(2, 10);
}

var widget = { registerWidget, createWidget: createWidget$1, become: become$1, listWidgetTypes };

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

const { createWidget, become } = widget;

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

      if (lastDrop) executeDrop(cellId, lastDrop);
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

var dashboard = { createDashboard };

(function (module) {
	const { style: tanawStyle } = tanaw_bundleExports;

	const classRegex = /\.[^.#]+/g;
	const idRegex = /#[^.#]+/;

	/**
	 * PRIVATE FUNCTION: Creates an HTML element with specified attributes and children.
	 *
	 * This function is intended for internal use within the module/library it is defined in.
	 * It simplifies the process of creating DOM elements in JavaScript, allowing for 
	 * a more declarative approach to building complex HTML structures without the verbosity
	 * of traditional DOM manipulation methods.
	 *
	 * @param {string} tag - The type of element to create (e.g., 'div', 'span').
	 * @param {Object} attrs - An object representing attributes to set on the element. 
	 *                         Special handling for:
	 *                         - style: Accepts an object with CSS properties and values.
	 *                         - event listeners: Properties starting with 'on' (e.g., 'onClick')
	 *                           are treated as event listeners. The property name should be 
	 *                           the event's name in camelCase.
	 * @param {Array} children - An array of elements or strings to append as children. 
	 *                           Can handle:
	 *                           - Strings: will be converted to text nodes.
	 *                           - Node objects: will be appended directly.
	 *                           - Arrays: assumed to be in a specific format and converted accordingly.
	 *
	 * @returns {Node} The newly created element.
	 *
	 * NOTE: This function is not exposed publicly and should only be used within the context
	 * of its defining module/library.
	 *
	 * Sample Usage (internal):
	 * ```javascript
	 * const card = makeElement('div', { class: 'card', style: { width: '300px', boxShadow: '0 2px 4px rgba(0,0,0,.1)' } }, [
	 *   makeElement('img', { src: 'image.jpg', alt: 'Sample Image', style: { width: '100%', display: 'block' } }),
	 *   makeElement('div', { class: 'card-body' }, [
	 *     makeElement('h5', { class: 'card-title' }, ['Card Title']),
	 *     makeElement('p', { class: 'card-text' }, ['Some quick example text to build on the card title and make up the bulk of the card\'s content.']),
	 *     makeElement('a', { href: '#', class: 'btn btn-primary' }, ['Go somewhere'])
	 *   ])
	 * ]);
	 *
	 * document.body.appendChild(card);
	 * ```
	 *
	 * This example is for illustrative purposes only to demonstrate how `makeElement`
	 * might be used internally.
	 */
	function makeElement(tag, attrs = {}, children) {
	  const element = document.createElement(tag);

	  for (const [attr, value] of Object.entries(attrs)) {
	    if (attr === "style" && typeof value === "object") {
	      Object.assign(element.style, value);
	    } else if (typeof value === "function" && attr.startsWith("on")) {
	      const event = attr.substring(2).toLowerCase();
	      element.addEventListener(event, value);
	    } else if (value !== undefined) {
	      element.setAttribute(attr, value);
	    }
	  }

	  // Append children
	  for (const child of children) {
	    if (typeof child === "string") {
	      element.appendChild(document.createTextNode(child));
	    } else if (child instanceof Node) {
	      element.appendChild(child);
	    } else if (Array.isArray(child)) {
	      element.appendChild(habiToHtml(child));
	    }
	  }

	  return element;
	}

	/**
	 * Converts a CSS string to an object containing key-value pairs of CSS styles.
	 * @param {string} cssString - The CSS string to be converted.
	 * @returns {Object} - An object containing key-value pairs of CSS styles.
	 */
	function cssStringToObject(cssString) {
	  let styleObject = {};

	  cssString.split(';').forEach(style => {
	    let [key, value] = style.split(':');
	    if (key && value) {
	      key = key.trim();
	      // Convert key to camelCase
	      key = key.replace(/-./g, match => match.charAt(1).toUpperCase());

	      styleObject[key] = value.trim();
	    }
	  });

	  return styleObject;
	}

	function habiToHtml(habi) {
	  if (typeof habi === "string") {
	    return document.createTextNode(habi);
	  } else if (habi instanceof Node) {
	    return habi;
	  }

	  const [first, ...rest] = habi;
	  let tag, attrs = {};

	  if (typeof first === "string") {
	    tag = first.split(/[#.]/)[0];
	    const classMatch = first.match(classRegex);
	    const idMatch = first.match(idRegex);

	    if (classMatch) {
	      attrs.class = classMatch.map((c) => c.substring(1)).join(" ");
	    }

	    if (idMatch) {
	      attrs.id = idMatch[0].substring(1);
	    }
	  } else {
	    throw new Error("The first element of the habiscript array must be a string.");
	  }

	  if (rest.length > 0 && typeof rest[0] === "object" && !Array.isArray(rest[0])) {
	    Object.assign(attrs, rest.shift());
	  }

	  const children = rest.flatMap((child) =>
	    Array.isArray(child) ? habiToHtml(child) : child
	  );

	  return makeElement(tag, attrs, children);
	}

	/**
	 * Alias for `habiToHtml`.
	 * @alias habiToHtml
	 */
	function toElement(habi) {
	  return habiToHtml(habi);
	}

	/**
	 * Converts an HTML element or HTML string to a habiscript format.
	 *
	 * This function is designed to facilitate the conversion of HTML structures into a more
	 * concise and easy-to-manage format, habiscript, which represents the HTML as a nested array structure.
	 * It's particularly useful for situations where you need to serialize HTML elements for 
	 * storage, transmission, or processing in a format that's easier to handle than a string of HTML.
	 *
	 * @param {Node|string} element - The HTML element (Node) or HTML string to be converted.
	 *                                If a string is provided, it's first parsed into an HTML element.
	 *
	 * @returns {Array} The Habiscript representation of the provided HTML. This format is an array where:
	 *                  - The first element is a string representing the tag, optionally including
	 *                    its id and classes (e.g., 'div#id.class1.class2').
	 *                  - The second element, if present, is an object representing the element's
	 *                    attributes (excluding class and id, which are handled in the tag string).
	 *                  - Subsequent elements represent child nodes, each converted to habiscript format.
	 *
	 * Sample Usage:
	 * ```javascript
	 * // HTML element example
	 * const div = document.makeElement('div');
	 * div.id = 'example';
	 * div.className = 'container';
	 * div.innerHTML = '<span>Hello world</span>';
	 * const habiscript = htmlToHabi(div);
	 * console.log(habiscript); // Outputs: ['div#example.container', {}, ['span', {}, 'Hello world']]
	 *
	 * // HTML string example
	 * const habiFromString = htmlToHabi('<div id="example" class="container"><span>Hello world</span></div>');
	 * console.log(habiFromString); // Same output as above
	 * ```
	 *
	 * In these examples, `htmlToHabi` is used to convert an HTML element and an HTML string
	 * into the Habiscript format. This format provides a more structured and readable way to represent
	 * HTML content, especially when dealing with complex or deeply nested structures.
	 */
	function htmlToHabi(element) {
	  if (typeof element === "string") {
	    const parser = new DOMParser();
	    const doc = parser.parseFromString(element, "text/html");
	    return htmlToHabi(doc.body.firstChild);
	  }

	  if (element.nodeType === Node.TEXT_NODE) {
	    return element.textContent;
	  }

	  let tag = element.tagName.toLowerCase();
	  if (element.id) {
	    tag += `#${element.id}`;
	  }
	  if (element.className) {
	    tag += `.${element.className.split(" ").join(".")}`;
	  }

	  const habi = [tag];
	  const attributes = {};
	  for (const attr of element.attributes) {
	    if (attr.name !== "class" && attr.name !== "id") {
	      if (attr.name === "style") {
	        attributes.style = cssStringToObject(attr.value);
	      } else {
	        attributes[attr.name] = attr.value;
	      }
	    }
	  }

	  if (Object.keys(attributes).length > 0) {
	    habi.push(attributes);
	  }

	  for (const child of element.childNodes) {
	    habi.push(htmlToHabi(child));
	  }

	  return habi;
	}

	function style(tanawJS) {
	  return this.toElement([
	    'style',
	    tanawStyle(tanawJS)
	  ]);
	}

	/**
	 * Converts a Habiscript array to an HTML element and inserts it at the script's location or a specified target.
	 * @param {string|Array} selectorOrHabi - Either a CSS selector string or a Habiscript array.
	 * @param {Array} [habi] - The Habiscript array (required if the first argument is a selector).
	 * @returns {Element|Promise} The created HTML element or a promise that resolves when the element is inserted.
	 */
	function Habiscript(selectorOrHabi, habi) {
	  let targetSelector = typeof selectorOrHabi === 'string' ? selectorOrHabi : null;
	  let habiArray = Array.isArray(selectorOrHabi) ? selectorOrHabi : habi;

	  if (!habiArray || (targetSelector && !habi)) {
	    throw new Error('Invalid arguments. Expected a selector string and Habiscript array, or just a Habiscript array.');
	  }

	  const element = habiToHtml(habiArray);
	  if (targetSelector) {
	    return insertAtTarget(targetSelector, element);
	  } else {
	    return insertAtScriptLocation(element);
	  }
	}

	function insertAtTarget(targetSelector, element) {
	  if (document.readyState === 'loading') {
	    return new Promise((resolve) => {
	      document.addEventListener('DOMContentLoaded', () => {
	        appendToTarget(targetSelector, element);
	        resolve(element);
	      });
	    });
	  } else {
	    appendToTarget(targetSelector, element);
	    return element;
	  }
	}

	function appendToTarget(targetSelector, element) {
	  const targetElement = document.querySelector(targetSelector);
	  if (targetElement) {
	    targetElement.appendChild(element);
	  } else {
	    console.warn(`Target element with selector "${targetSelector}" not found.`);
	  }
	}

	function insertAtScriptLocation(element) {
	  const currentScript = document.currentScript;
	  if (currentScript && currentScript.parentNode) {
	    currentScript.parentNode.insertBefore(element, currentScript.nextSibling);
	  } else {
	    console.warn('Unable to determine script location. Element created but not inserted.');
	  }
	  return element;
	}


	// Widget and dashboard modules
	const { registerWidget, createWidget, become, listWidgetTypes } = widget;
	const { createDashboard } = dashboard;

	// Attach other functions as properties
	Habiscript.habiToHtml = habiToHtml;
	Habiscript.htmlToHabi = htmlToHabi;
	Habiscript.toElement = toElement;
	Habiscript.style = style;

	// Widget system
	Habiscript.registerWidget = registerWidget;
	Habiscript.createWidget = createWidget;
	Habiscript.become = become;
	Habiscript.listWidgetTypes = listWidgetTypes;

	// Dashboard layout
	Habiscript.createDashboard = createDashboard;

	// Export for both Node.js and browser environments
	if (module.exports) {
	  module.exports = Habiscript;
	} else if (typeof window !== 'undefined') {
	  window.Habiscript = Habiscript;
	} 
} (src));

var srcExports = src.exports;
var index = /*@__PURE__*/getDefaultExportFromCjs(srcExports);

export { index as default };
