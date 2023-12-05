export const classRegex = /\.[^.#]+/g;
export const idRegex = /#[^.#]+/;

export function createElement(tag, attrs = {}, children) {
  const element = document.createElement(tag);

  for (const [attr, value] of Object.entries(attrs)) {
    if (attr === "style" && typeof value === "object") {
      Object.assign(element.style, value);
    } else if (value !== undefined) {
      element.setAttribute(attr, value);
    }
  }

  children.flat().forEach((child) => {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      element.appendChild(nestmlToHtml(child));
    }
  });

  return element;
}

export function nestmlToHtml(nestml) {
  if (typeof nestml === "string") {
    return document.createTextNode(nestml);
  }

  const [first, ...rest] = nestml;
  let tag,
    attrs = {};

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
    throw new Error("The first element of the nestml array must be a string.");
  }

  if (
    rest.length > 0 &&
    typeof rest[0] === "object" &&
    !Array.isArray(rest[0])
  ) {
    Object.assign(attrs, rest.shift());
  }

  const children = rest.map((child) => {
    if (Array.isArray(child)) {
      return nestmlToHtml(child);
    } else {
      return typeof child === "string" ? document.createTextNode(child) : child;
    }
  });

  return createElement(tag, attrs, children);
}
