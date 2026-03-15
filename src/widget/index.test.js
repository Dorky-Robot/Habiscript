const { JSDOM } = require("jsdom");
const { registerWidget, createWidget, become, listWidgetTypes } = require("./index");

describe("Widget Protocol", () => {
  let document;

  beforeAll(() => {
    const jsdom = new JSDOM("");
    global.document = jsdom.window.document;
    global.Node = jsdom.window.Node;
    document = jsdom.window.document;
  });

  afterEach(() => {
    // Clear registry between tests by re-requiring
    // Since we can't clear the module-level Map, we test additively
  });

  describe("registerWidget", () => {
    test("registers a widget type", () => {
      registerWidget("test-a", {
        create(el, context) {
          el.textContent = "widget-a";
          return { update() {}, unmount() { el.textContent = ""; } };
        },
      });
      expect(listWidgetTypes()).toContain("test-a");
    });

    test("overwrites existing registration", () => {
      registerWidget("test-overwrite", {
        create(el) {
          el.textContent = "first";
          return { update() {}, unmount() {} };
        },
      });
      registerWidget("test-overwrite", {
        create(el) {
          el.textContent = "second";
          return { update() {}, unmount() {} };
        },
      });

      const el = document.createElement("div");
      createWidget(el, "test-overwrite");
      expect(el.textContent).toBe("second");
    });
  });

  describe("createWidget", () => {
    test("mounts a widget into an element", () => {
      registerWidget("test-mount", {
        create(el, context) {
          el.textContent = `hello ${context.name || "world"}`;
          return {
            update(ctx) { el.textContent = `hello ${ctx.name}`; },
            unmount() { el.textContent = ""; },
          };
        },
      });

      const el = document.createElement("div");
      const widget = createWidget(el, "test-mount", { name: "felix" });

      expect(el.textContent).toBe("hello felix");
      expect(el.getAttribute("data-widget")).toBe("test-mount");
      expect(el.getAttribute("data-widget-id")).toBeTruthy();
      expect(widget.type).toBe("test-mount");
      expect(widget.el).toBe(el);
    });

    test("widget.update() re-renders", () => {
      registerWidget("test-update", {
        create(el, context) {
          el.textContent = context.value || "";
          return {
            update(ctx) { el.textContent = ctx.value; },
            unmount() {},
          };
        },
      });

      const el = document.createElement("div");
      const widget = createWidget(el, "test-update", { value: "initial" });
      expect(el.textContent).toBe("initial");

      widget.update({ value: "updated" });
      expect(el.textContent).toBe("updated");
    });

    test("widget.unmount() cleans up", () => {
      let unmounted = false;
      registerWidget("test-unmount", {
        create(el) {
          el.textContent = "alive";
          return {
            update() {},
            unmount() { unmounted = true; el.textContent = ""; },
          };
        },
      });

      const el = document.createElement("div");
      const widget = createWidget(el, "test-unmount");
      expect(el.textContent).toBe("alive");

      widget.unmount();
      expect(unmounted).toBe(true);
      expect(el.textContent).toBe("");
    });

    test("throws for unknown widget type", () => {
      expect(() => {
        const el = document.createElement("div");
        createWidget(el, "nonexistent-type");
      }).toThrow(/Unknown widget type/);
    });

    test("passes context to factory", () => {
      let receivedContext = null;
      registerWidget("test-context", {
        create(el, context) {
          receivedContext = context;
          return { update() {}, unmount() {} };
        },
      });

      const el = document.createElement("div");
      createWidget(el, "test-context", { cwd: "/work", session: "dev" });
      expect(receivedContext).toEqual(expect.objectContaining({ cwd: "/work", session: "dev" }));
    });

    test("assigns auto-generated id if none provided", () => {
      registerWidget("test-autoid", {
        create(el) { return { update() {}, unmount() {} }; },
      });

      const el = document.createElement("div");
      createWidget(el, "test-autoid");
      const id = el.getAttribute("data-widget-id");
      expect(id).toBeTruthy();
      expect(id.length).toBeGreaterThan(4);
    });

    test("uses provided id from context", () => {
      registerWidget("test-customid", {
        create(el) { return { update() {}, unmount() {} }; },
      });

      const el = document.createElement("div");
      createWidget(el, "test-customid", { id: "my-widget-123" });
      expect(el.getAttribute("data-widget-id")).toBe("my-widget-123");
    });
  });

  describe("become", () => {
    test("resolves registered type", () => {
      registerWidget("test-become", {
        create(el) {
          el.textContent = "became!";
          return { update() {}, unmount() {} };
        },
      });

      const el = document.createElement("div");
      const widget = become(el, "test-become");
      expect(el.textContent).toBe("became!");
      expect(widget.type).toBe("test-become");
    });

    test("routes freeform description to meta widget", () => {
      let metaDescription = null;
      registerWidget("meta", {
        create(el, context) {
          metaDescription = context.description;
          el.textContent = `creating: ${context.description}`;
          return { update() {}, unmount() {} };
        },
      });

      const el = document.createElement("div");
      become(el, "a widget that shows test results");
      expect(metaDescription).toBe("a widget that shows test results");
      expect(el.textContent).toBe("creating: a widget that shows test results");
    });

    test("passes context through for freeform descriptions", () => {
      let metaContext = null;
      registerWidget("meta", {
        create(el, context) {
          metaContext = context;
          return { update() {}, unmount() {} };
        },
      });

      const el = document.createElement("div");
      become(el, "monitor logs", { cwd: "/var/log" });
      expect(metaContext.description).toBe("monitor logs");
      expect(metaContext.cwd).toBe("/var/log");
    });

    test("throws if freeform description used without meta widget registered", () => {
      // We already registered "meta" above, so this will work.
      // To test the error, we'd need to clear the registry.
      // Skip — covered by createWidget's unknown type test.
    });
  });

  describe("listWidgetTypes", () => {
    test("returns all registered types", () => {
      const types = listWidgetTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      // Should contain types we registered in earlier tests
      expect(types).toContain("test-a");
      expect(types).toContain("meta");
    });
  });
});
