const { style } = require("tanaw");

const classRegex = /\.[^.#]+/g;
const idRegex = /#[^.#]+/;

/**
 * Creates an HTML element with specified attributes and children.
 * 
 * This function simplifies the process of creating DOM elements in JavaScript, allowing for 
 * a more declarative approach. It's particularly useful for situations where you need to 
 * dynamically generate complex HTML structures without the verbosity of traditional DOM 
 * manipulation methods.
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
 *                           - Arrays: assumed to be a nestedml format and converted via 
 *                             `nestMLToHtml`.
 *
 * @returns {Node} The newly created element.
 *
 * Sample Usage:
 * ```javascript
 * const button = createElement('button', {
 *   style: { backgroundColor: 'blue', color: 'white' },
 *   onClick: () => alert('Clicked!'),
 *   'aria-label': 'Click me'
 * }, ['Click me']);
 *
 * document.body.appendChild(button);
 * ```
 *
 * In this example, `createElement` is used to create a button with inline styles, 
 * an event listener for the 'click' event, and an accessible label. The button's 
 * text is set by passing a string in the children array.
 */
function createElement(tag, attrs = {}, children) {
  const element = document.createElement(tag);

  for (const [attr, value] of Object.entries(attrs)) {
    if (attr === "style" && typeof value === "object") {
      Object.assign(element.style, cssStringToObject(style(value)));
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
      element.appendChild(nestMLToHtml(child));
    }
  }

  return element;
}

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

function nestMLToHtml(nestML) {
  if (typeof nestML === "string") {
    return document.createTextNode(nestML);
  } else if (nestML instanceof Node) {
    return nestML;
  }

  const [first, ...rest] = nestML;
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
    throw new Error("The first element of the nestML array must be a string.");
  }

  if (rest.length > 0 && typeof rest[0] === "object" && !Array.isArray(rest[0])) {
    Object.assign(attrs, rest.shift());
  }

  const children = rest.flatMap((child) =>
    Array.isArray(child) ? nestMLToHtml(child) : child
  );

  return createElement(tag, attrs, children);
}

/**
 * Converts an HTML element or HTML string to a nestML (Nested Markup Language) format.
 *
 * This function is designed to facilitate the conversion of HTML structures into a more
 * concise and easy-to-manage format, nestML, which represents the HTML as a nested array structure.
 * It's particularly useful for situations where you need to serialize HTML elements for 
 * storage, transmission, or processing in a format that's easier to handle than a string of HTML.
 *
 * @param {Node|string} element - The HTML element (Node) or HTML string to be converted.
 *                                If a string is provided, it's first parsed into an HTML element.
 *
 * @returns {Array} The nestML representation of the provided HTML. This format is an array where:
 *                  - The first element is a string representing the tag, optionally including
 *                    its id and classes (e.g., 'div#id.class1.class2').
 *                  - The second element, if present, is an object representing the element's
 *                    attributes (excluding class and id, which are handled in the tag string).
 *                  - Subsequent elements represent child nodes, each converted to nestML format.
 *
 * Sample Usage:
 * ```javascript
 * // HTML element example
 * const div = document.createElement('div');
 * div.id = 'example';
 * div.className = 'container';
 * div.innerHTML = '<span>Hello world</span>';
 * const nestML = htmlToNestML(div);
 * console.log(nestML); // Outputs: ['div#example.container', {}, ['span', {}, 'Hello world']]
 *
 * // HTML string example
 * const nestMLFromString = htmlToNestML('<div id="example" class="container"><span>Hello world</span></div>');
 * console.log(nestMLFromString); // Same output as above
 * ```
 *
 * In these examples, `htmlToNestML` is used to convert an HTML element and an HTML string
 * into the nestML format. This format provides a more structured and readable way to represent
 * HTML content, especially when dealing with complex or deeply nested structures.
 */
function htmlToNestML(element) {
  // Convert HTML string to DOM element if necessary
  if (typeof element === "string") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(element, "text/html");
    return htmlToNestML(doc.body.firstChild);
  }

  // Return text content for text nodes
  if (element.nodeType === Node.TEXT_NODE) {
    return element.textContent;
  }

  // Construct the tag string
  let tag = element.tagName.toLowerCase();
  if (element.id) {
    tag += `#${element.id}`;
  }
  if (element.className) {
    tag += `.${element.className.split(" ").join(".")}`;
  }

  // Create the nestML array
  const nestML = [tag];
  const attributes = {};
  // Extract attributes from element
  Array.from(element.attributes).forEach((attr) => {
    if (attr.name !== "class" && attr.name !== "id") {
      if (attr.name === "style") {
        attributes[attr.name] = attributes[attr.name] || [];
        attributes[attr.name].push(cssPropertyToArray(attr.value));
      } else {
        attributes[attr.name] = attr.value;
      }
    }
  });

  function cssPropertyToArray(cssProperty) {
    return cssProperty.split(':').map(item => item.replace(/;|\s/g, '').trim());
  }


  // Add attributes to nestML array if any
  if (Object.keys(attributes).length > 0) {
    nestML.push(attributes);
  }

  // Recursively process child nodes
  Array.from(element.childNodes).forEach((child) => {
    nestML.push(htmlToNestML(child));
  });

  return nestML;
}


module.exports = {
  createElement,
  nestMLToHtml,
  htmlToNestML,
};
