import { JSDOM } from "jsdom";
import assert from "assert";
import { nestmlToHtml, htmlToNestml } from "./index.js";

// Create a JSDOM instance
const { window } = new JSDOM("");

// Assign document and Node to global scope
global.document = window.document;
global.Node = window.Node;

// Your test cases
const testNestmlToHtml = () => {
  const nestml = [
    "div",
    ["p", "I am a component!"],
    [
      "p.someclass",
      "I have ",
      ["strong", "bold"],
      ["span", { style: { color: "red" } }, " and red "],
      "text.",
    ],
  ];

  const htmlElement = nestmlToHtml(nestml);
  const divElement = document.createElement("div");
  divElement.appendChild(htmlElement);

  assert.strictEqual(
    divElement.innerHTML.trim(), // Use .trim() to remove any leading/trailing whitespace
    '<div><p>I am a component!</p><p class="someclass">I have <strong>bold</strong><span style="color: red;"> and red </span>text.</p></div>'
  );

  console.log("Test passed: nestmlToHtml() correctly converts nestml to HTML.");
};

const testEmptyElement = () => {
  const nestml = ["div"];
  const htmlElement = nestmlToHtml(nestml);
  const divElement = document.createElement("div");
  divElement.appendChild(htmlElement);

  assert.strictEqual(
    divElement.innerHTML.trim(),
    "<div></div>",
    "Empty element test failed"
  );
  console.log("Test passed: Empty element rendered correctly.");
};

const testNestedElements = () => {
  const nestml = ["div", ["span", ["strong", "Nested content"]]];
  const htmlElement = nestmlToHtml(nestml);
  const divElement = document.createElement("div");
  divElement.appendChild(htmlElement);

  assert.strictEqual(
    divElement.innerHTML.trim(),
    "<div><span><strong>Nested content</strong></span></div>",
    "Nested elements test failed"
  );
  console.log("Test passed: Nested elements rendered correctly.");
};

const testElementWithAttributes = () => {
  const nestml = ["div", { id: "testId", class: "testClass" }, "Content"];
  const htmlElement = nestmlToHtml(nestml);
  const divElement = document.createElement("div");
  divElement.appendChild(htmlElement);

  assert.strictEqual(
    divElement.innerHTML.trim(),
    '<div id="testId" class="testClass">Content</div>',
    "Element with attributes test failed"
  );
  console.log("Test passed: Element with attributes rendered correctly.");
};

const testInvalidInput = () => {
  try {
    const nestml = null;
    nestmlToHtml(nestml);
    assert.fail("Should have thrown an error for null input");
  } catch (error) {
    console.log("Test passed: Invalid input correctly throws an error.");
  }
};

const testComplexInlineCSS = () => {
  const nestml = [
    "div",
    {
      style: {
        backgroundColor: "blue",
        color: "white",
        border: "1px solid black",
      },
    },
    "Styled content",
  ];

  const htmlElement = nestmlToHtml(nestml);
  const divElement = document.createElement("div");
  divElement.appendChild(htmlElement);

  const expectedStyle =
    "background-color: blue; color: white; border: 1px solid black;";
  assert.strictEqual(
    htmlElement.getAttribute("style"),
    expectedStyle,
    "Complex inline CSS test failed"
  );
  console.log("Test passed: Complex inline CSS rendered correctly.");
};

const testCSSAnimations = () => {
  const nestml = [
    "div",
    {
      style: {
        animation: "example 5s infinite",
      },
    },
    "Animated content",
  ];

  const htmlElement = nestmlToHtml(nestml);
  const divElement = document.createElement("div");
  divElement.appendChild(htmlElement);

  const expectedStyle = "animation: example 5s infinite;";
  assert.strictEqual(
    htmlElement.getAttribute("style"),
    expectedStyle,
    "CSS animations test failed"
  );
  console.log("Test passed: CSS animations rendered correctly.");
};

const testElementTypes = () => {
  const nestml = [
    "header",
    ["main", ["article", "Article content"]],
    ["footer", "Footer content"],
  ];

  const htmlElement = nestmlToHtml(nestml);
  const divElement = document.createElement("div");
  divElement.appendChild(htmlElement);

  assert.strictEqual(
    divElement.innerHTML.trim(),
    "<header><main><article>Article content</article></main><footer>Footer content</footer></header>",
    "Handling of various element types failed"
  );
  console.log("Test passed: Various element types handled correctly.");
};

const testComplexNesting = () => {
  const nestml = [
    "div.wrapper",
    { id: "main-container" },
    ["header#top-header.navbar", "Header content"],
    [
      "main",
      ["section#content.section", { style: { color: "blue" } }, "Main content"],
    ],
    ["footer", "Footer content"],
  ];

  const htmlElement = nestmlToHtml(nestml);
  const divElement = document.createElement("div");
  divElement.appendChild(htmlElement);

  assert.strictEqual(
    divElement.innerHTML.trim(),
    '<div class="wrapper" id="main-container"><header class="navbar" id="top-header">Header content</header><main><section class="section" id="content" style="color: blue;">Main content</section></main><footer>Footer content</footer></div>',
    "Complex nesting and attributes test failed"
  );
  console.log(
    "Test passed: Complex nesting and attributes rendered correctly."
  );
};

const testBasicHtmlToNestml = () => {
  const htmlString = '<div><p class="text">Hello World</p></div>';
  const element = new JSDOM(htmlString).window.document.body.firstChild;

  const nestml = htmlToNestml(element);

  assert.deepStrictEqual(
    nestml,
    ["div", ["p.text", "Hello World"]],
    "Basic HTML to NESTML conversion failed"
  );
  console.log("Test passed: Basic HTML to NESTML conversion successful.");
};

const testComplexHtmlToNestml = () => {
  const htmlString =
    '<div id="container"><section class="content">Content here</section><footer>Footer</footer></div>';
  const element = new JSDOM(htmlString).window.document.body.firstChild;

  const nestml = htmlToNestml(element);

  assert.deepStrictEqual(
    nestml,
    [
      "div#container",
      ["section.content", "Content here"],
      ["footer", "Footer"],
    ],
    "Complex HTML structure conversion failed"
  );
  console.log("Test passed: Complex HTML structure conversion successful.");
};

const testNestedElementsAndAttributes = () => {
  const htmlString =
    '<div><ul class="list"><li id="item1">Item 1</li><li>Item 2</li></ul></div>';
  const element = new JSDOM(htmlString).window.document.body.firstChild;

  const nestml = htmlToNestml(element);

  assert.deepStrictEqual(
    nestml,
    ["div", ["ul.list", ["li#item1", "Item 1"], ["li", "Item 2"]]],
    "Nested elements and attributes conversion failed"
  );
  console.log(
    "Test passed: Nested elements and attributes conversion successful."
  );
};

// Running all tests
testNestmlToHtml();
testEmptyElement();
testNestedElements();
testElementWithAttributes();
testInvalidInput();
testComplexInlineCSS();
testCSSAnimations();
testElementTypes();
testComplexNesting();
testBasicHtmlToNestml();
testComplexHtmlToNestml();
testNestedElementsAndAttributes();

console.log("All tests completed.");
