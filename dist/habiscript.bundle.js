(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Habiscript = factory());
})(this, (function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var tanaw_bundle = {exports: {}};

	(function (module, exports) {
		(function (global, factory) {
			module.exports = factory() ;
		})(commonjsGlobal, (function () {
			function getDefaultExportFromCjs (x) {
				return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
			}

			function style(tnss) {
			  if (isBlank(tnss)) return tnss;
			  return compile(process({ tnss }));
			}

			const NO_SELECTOR = '__*__';
			function process({ tnss, parent, css = {}, nested }) {
			  if (Array.isArray(tnss) && typeof tnss[0] === 'string') {
			    const [propName, ...values] = tnss;
			    const prop = `${propName}:${processCssValues(values)};`;
			    const target = nested ? (css[nested] = css[nested] || {}) : css;
			    const key = parent || NO_SELECTOR;

			    target[key] = (target[key] || '') + prop;
			  } else if (Array.isArray(tnss)) {
			    for (let item of tnss) {
			      process({ tnss: item, parent, css, nested });
			    }
			  } else {
			    for (let [key, value] of Object.entries(tnss)) {
			      process({
			        tnss: value,
			        parent: key.startsWith('@') ? parent : sel(parent, key),
			        css,
			        nested: key.startsWith('@') ? key : nested
			      });
			    }
			  }

			  return css;
			}

			function sel(parent, selector) {
			  if (!parent) return selector;
			  return parent + (selector.startsWith(':') ? '' : ' ') + selector;
			}


			function compile(tnss) {
			  if (typeof tnss !== 'object' || Array.isArray(tnss) || isBlank(tnss)) {
			    return tnss;
			  }

			  return Object.entries(tnss).map(([key, value]) =>
			    key === NO_SELECTOR ? compile(value) : `${key}{${compile(value)}}`
			  ).join('');
			}


			function isBlank(o) {
			  return !o || o.length === 0 || Object.keys(o).length === 0;
			}

			function processCssValues(values) {
			  if (typeof values === 'string') {
			    return values;
			  } else if (values.func) {
			    const func = values.func[0];
			    const args = values.func.slice(1);

			    return `${func}(${args.join(',')})`;
			  } else {
			    return values.map(processCssValues).join(' ');
			  }
			}

			var tanaw = {
			  style
			};

			var tanaw$1 = /*@__PURE__*/getDefaultExportFromCjs(tanaw);

			return tanaw$1;

		})); 
	} (tanaw_bundle));

	var tanaw_bundleExports = tanaw_bundle.exports;

	const { style } = tanaw_bundleExports;

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
	 *                           - Arrays: assumed to be a habiscript format and converted via 
	 *                             `habiToHtml`.
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
	      element.appendChild(habiToHtml(child));
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

	  return createElement(tag, attrs, children);
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
	 * const div = document.createElement('div');
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
	  // Convert HTML string to DOM element if necessary
	  if (typeof element === "string") {
	    const parser = new DOMParser();
	    const doc = parser.parseFromString(element, "text/html");
	    return htmlToHabi(doc.body.firstChild);
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

	  // Create the Habiscript array
	  const habi = [tag];
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


	  // Add attributes to Habiscript array if any
	  if (Object.keys(attributes).length > 0) {
	    habi.push(attributes);
	  }

	  // Recursively process child nodes
	  Array.from(element.childNodes).forEach((child) => {
	    habi.push(htmlToHabi(child));
	  });

	  return habi;
	}


	var src = {
	  createElement,
	  habiToHtml,
	  htmlToHabi,
	};

	var index = /*@__PURE__*/getDefaultExportFromCjs(src);

	return index;

}));
