const { JSDOM } = require("jsdom");
const { registerWidget } = require("../widget");
const { createDashboard } = require("./index");

describe("Dashboard Layout", () => {
  let document;

  beforeAll(() => {
    const jsdom = new JSDOM("");
    global.document = jsdom.window.document;
    global.Node = jsdom.window.Node;
    document = jsdom.window.document;

    // Register a simple test widget
    registerWidget("test-widget", {
      create(el, context) {
        el.textContent = context.label || "test";
        return {
          update(ctx) { el.textContent = ctx.label; },
          unmount() { el.textContent = ""; },
        };
      },
    });
  });

  function makeContainer() {
    return document.createElement("div");
  }

  describe("createDashboard", () => {
    test("renders empty dashboard with add button", () => {
      const el = makeContainer();
      const dash = createDashboard(el);

      expect(el.classList.contains("habi-dashboard")).toBe(true);
      expect(el.querySelector(".habi-add-row")).toBeTruthy();
      expect(el.querySelectorAll(".habi-row").length).toBe(0);
    });

    test("renders initial layout with rows and cells", () => {
      const el = makeContainer();
      createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: "test-widget", context: { label: "first" } },
              { id: "c2", width: null, widgetType: "test-widget", context: { label: "second" } },
            ]},
          ],
        },
      });

      expect(el.querySelectorAll(".habi-row").length).toBe(1);
      expect(el.querySelectorAll(".habi-cell").length).toBe(2);
      expect(el.querySelectorAll(".habi-widget-container").length).toBe(2);

      const widgets = el.querySelectorAll("[data-widget]");
      expect(widgets.length).toBe(2);
      expect(widgets[0].textContent).toContain("first");
      expect(widgets[1].textContent).toContain("second");
    });

    test("renders column resize handle between cells", () => {
      const el = makeContainer();
      createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: null, context: {} },
              { id: "c2", width: null, widgetType: null, context: {} },
            ]},
          ],
        },
      });

      expect(el.querySelectorAll(".habi-col-handle").length).toBe(1);
    });

    test("renders no resize handle for single-cell row", () => {
      const el = makeContainer();
      createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: null, context: {} },
            ]},
          ],
        },
      });

      expect(el.querySelectorAll(".habi-col-handle").length).toBe(0);
    });

    test("renders row resize handle after each row", () => {
      const el = makeContainer();
      createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [{ id: "c1", width: null, widgetType: null, context: {} }] },
            { id: "r2", height: null, cells: [{ id: "c2", width: null, widgetType: null, context: {} }] },
          ],
        },
      });

      expect(el.querySelectorAll(".habi-row-handle").length).toBe(2);
    });

    test("renders empty cell with add-widget button", () => {
      const el = makeContainer();
      createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: null, context: {} },
            ]},
          ],
        },
      });

      expect(el.querySelector(".habi-add-widget")).toBeTruthy();
      expect(el.querySelector(".habi-add-widget").textContent).toBe("+ Add widget");
    });

    test("shows error for unknown widget type", () => {
      const el = makeContainer();
      createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: "nonexistent", context: {} },
            ]},
          ],
        },
      });

      const errorEl = el.querySelector(".habi-widget-error");
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain("Unknown widget type");
    });
  });

  describe("addRow", () => {
    test("adds an empty row", () => {
      const el = makeContainer();
      const dash = createDashboard(el);

      expect(el.querySelectorAll(".habi-row").length).toBe(0);

      dash.addRow();
      expect(el.querySelectorAll(".habi-row").length).toBe(1);
      expect(el.querySelector(".habi-add-widget")).toBeTruthy();
    });

    test("adds a row with pre-configured cells", () => {
      const el = makeContainer();
      const dash = createDashboard(el);

      dash.addRow([
        { id: "x1", width: null, widgetType: "test-widget", context: { label: "pre" } },
      ]);

      expect(el.querySelectorAll(".habi-row").length).toBe(1);
      expect(el.querySelector("[data-widget]").textContent).toContain("pre");
    });

    test("updates layout state", () => {
      const el = makeContainer();
      const dash = createDashboard(el);

      dash.addRow();
      const layout = dash.getLayout();
      expect(layout.rows.length).toBe(1);
      expect(layout.rows[0].cells.length).toBe(1);
    });
  });

  describe("addCell", () => {
    test("adds a cell to an existing row", () => {
      const el = makeContainer();
      const dash = createDashboard(el);
      const row = dash.addRow();

      dash.addCell(row.id, "test-widget", { label: "added" });

      expect(el.querySelectorAll(".habi-cell").length).toBe(2);
      const layout = dash.getLayout();
      expect(layout.rows[0].cells.length).toBe(2);
    });

    test("respects 4-cell-per-row limit", () => {
      const el = makeContainer();
      const dash = createDashboard(el);
      const row = dash.addRow([
        { id: "a", width: null, widgetType: null, context: {} },
        { id: "b", width: null, widgetType: null, context: {} },
        { id: "c", width: null, widgetType: null, context: {} },
        { id: "d", width: null, widgetType: null, context: {} },
      ]);

      const result = dash.addCell(row.id, "test-widget", { label: "overflow" });
      expect(result).toBeNull();
      expect(dash.getLayout().rows[0].cells.length).toBe(4);
    });

    test("returns null for nonexistent row", () => {
      const el = makeContainer();
      const dash = createDashboard(el);
      const result = dash.addCell("nonexistent", "test-widget", {});
      expect(result).toBeNull();
    });
  });

  describe("removeCell", () => {
    test("removes a cell from a row", () => {
      const el = makeContainer();
      const dash = createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: "test-widget", context: { label: "keep" } },
              { id: "c2", width: null, widgetType: "test-widget", context: { label: "remove" } },
            ]},
          ],
        },
      });

      const result = dash.removeCell("c2");
      expect(result).toBe(true);
      expect(el.querySelectorAll(".habi-cell").length).toBe(1);
      expect(el.querySelector("[data-widget]").textContent).toContain("keep");
    });

    test("removes entire row when last cell is removed", () => {
      const el = makeContainer();
      const dash = createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: "test-widget", context: {} },
            ]},
          ],
        },
      });

      dash.removeCell("c1");
      expect(el.querySelectorAll(".habi-row").length).toBe(0);
      expect(dash.getLayout().rows.length).toBe(0);
    });

    test("unmounts widget when cell is removed", () => {
      let unmounted = false;
      registerWidget("test-remove-unmount", {
        create(el) {
          return {
            update() {},
            unmount() { unmounted = true; },
          };
        },
      });

      const el = makeContainer();
      const dash = createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: "test-remove-unmount", context: {} },
            ]},
          ],
        },
      });

      dash.removeCell("c1");
      expect(unmounted).toBe(true);
    });

    test("returns false for nonexistent cell", () => {
      const el = makeContainer();
      const dash = createDashboard(el);
      expect(dash.removeCell("nonexistent")).toBe(false);
    });
  });

  describe("setCellWidget", () => {
    test("replaces widget in existing cell", () => {
      const el = makeContainer();
      const dash = createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: "test-widget", context: { label: "old" } },
            ]},
          ],
        },
      });

      expect(el.querySelector("[data-widget]").textContent).toContain("old");

      dash.setCellWidget("c1", "test-widget", { label: "new" });
      expect(el.querySelector("[data-widget]").textContent).toContain("new");
    });

    test("unmounts previous widget before replacing", () => {
      let unmountCount = 0;
      registerWidget("test-replace-unmount", {
        create(el) {
          return {
            update() {},
            unmount() { unmountCount++; },
          };
        },
      });

      const el = makeContainer();
      const dash = createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: "test-replace-unmount", context: {} },
            ]},
          ],
        },
      });

      dash.setCellWidget("c1", "test-widget", { label: "replaced" });
      expect(unmountCount).toBe(1);
    });

    test("returns false for nonexistent cell", () => {
      const el = makeContainer();
      const dash = createDashboard(el);
      expect(dash.setCellWidget("nonexistent", "test-widget", {})).toBe(false);
    });
  });

  describe("onLayoutChange", () => {
    test("calls callback when layout changes", () => {
      let changeCount = 0;
      const el = makeContainer();
      const dash = createDashboard(el, {
        onLayoutChange: () => { changeCount++; },
      });

      dash.addRow();
      expect(changeCount).toBe(1);

      const row = dash.getLayout().rows[0];
      dash.addCell(row.id, "test-widget", {});
      expect(changeCount).toBe(2);
    });
  });

  describe("getWidget", () => {
    test("returns widget instance by cell id", () => {
      const el = makeContainer();
      const dash = createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: "test-widget", context: { label: "findme" } },
            ]},
          ],
        },
      });

      const widget = dash.getWidget("c1");
      expect(widget).toBeTruthy();
      expect(widget.type).toBe("test-widget");
    });

    test("returns undefined for nonexistent cell", () => {
      const el = makeContainer();
      const dash = createDashboard(el);
      expect(dash.getWidget("nonexistent")).toBeUndefined();
    });
  });

  describe("unmount", () => {
    test("unmounts all widgets and clears DOM", () => {
      let unmountCount = 0;
      registerWidget("test-dash-unmount", {
        create(el) {
          return {
            update() {},
            unmount() { unmountCount++; },
          };
        },
      });

      const el = makeContainer();
      const dash = createDashboard(el, {
        layout: {
          rows: [
            { id: "r1", height: null, cells: [
              { id: "c1", width: null, widgetType: "test-dash-unmount", context: {} },
              { id: "c2", width: null, widgetType: "test-dash-unmount", context: {} },
            ]},
          ],
        },
      });

      dash.unmount();
      expect(unmountCount).toBe(2);
      expect(el.innerHTML).toBe("");
    });
  });
});
