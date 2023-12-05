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

  for (const child of children) {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      element.appendChild(nestmlToHtml(child));
    }
  }

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

  const children = rest.flatMap((child) =>
    Array.isArray(child)
      ? nestmlToHtml(child)
      : typeof child === "string"
      ? document.createTextNode(child)
      : child
  );

  return createElement(tag, attrs, children);
}

export function htmlToNestml(element) {
  if (typeof element === "string") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(element, "text/html");
    return htmlToNestml(doc.body.firstChild);
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

  const nestml = [tag];
  const attributes = {};
  for (const attr of element.attributes) {
    if (attr.name !== "class" && attr.name !== "id") {
      attributes[attr.name] = attr.value;
    }
  }

  if (Object.keys(attributes).length > 0) {
    nestml.push(attributes);
  }

  for (const child of element.childNodes) {
    nestml.push(htmlToNestml(child));
  }

  return nestml;
}
