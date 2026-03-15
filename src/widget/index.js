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
function createWidget(el, type, context = {}) {
  const factory = registry.get(type);
  if (!factory) {
    throw new Error(`Unknown widget type: "${type}". Registered: ${[...registry.keys()].join(", ")}`);
  }

  const widget = factory.create(el, context);
  widget.type = type;
  widget.el = el;
  el.setAttribute("data-widget", type);
  el.setAttribute("data-widget-id", context.id || generateId());

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
function become(el, typeOrDescription, context = {}) {
  if (registry.has(typeOrDescription)) {
    return createWidget(el, typeOrDescription, context);
  }

  // Freeform description → create via a yolo session
  // The "meta" widget type handles this: it's a yolo session
  // whose job is to generate and render a custom widget
  return createWidget(el, "meta", {
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

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

module.exports = { registerWidget, createWidget, become, listWidgetTypes };
