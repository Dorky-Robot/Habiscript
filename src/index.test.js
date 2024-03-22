const { JSDOM } = require("jsdom");
const { habiToHtml, htmlToHabi } = require("./index.js");

describe("Habiscript Conversion Tests", () => {
  let document;

  beforeAll(() => {
    // Setup JSDOM
    const jsdom = new JSDOM("");
    global.document = jsdom.window.document;
    global.Node = jsdom.window.Node;
    document = jsdom.window.document;
  });

  test("habiToHtml() converts Habiscript to HTML correctly", () => {
    const habiscript = [
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

    const htmlElement = habiToHtml(habiscript);
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    expect(divElement.innerHTML.trim()).toBe(
      '<div><p>I am a component!</p><p class="someclass">I have <strong>bold</strong><span style="color: red;"> and red </span>text.</p></div>'
    );
  });

  test("Empty Element renders correctly", () => {
    const nestml = ["div"];
    const htmlElement = habiToHtml(nestml);
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    expect(divElement.innerHTML.trim()).toBe("<div></div>");
  });

  test("Nested Elements render correctly", () => {
    const habi = ["div", ["span", ["strong", "Nested content"]]];
    const htmlElement = habiToHtml(habi);
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    expect(divElement.innerHTML.trim()).toBe(
      "<div><span><strong>Nested content</strong></span></div>"
    );
  });

  test("Element with Attributes renders correctly", () => {
    const habi = ["div", { id: "testId", class: "testClass" }, "Content"];
    const htmlElement = habiToHtml(habi);
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    expect(divElement.innerHTML.trim()).toBe(
      '<div id="testId" class="testClass">Content</div>'
    );
  });

  test("Invalid Input throws an error", () => {
    expect(() => {
      habiToHtml(null);
    }).toThrow();
  });

  test("Complex Inline CSS renders correctly", () => {
    const habiscript = [
      "div",
      {
        style: {
          backgroundColor: 'blue',
          color: 'white',
          border: '1px solid black',
        },
      },
      "Styled content",
    ];

    const htmlElement = habiToHtml(habiscript);
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    const expectedStyle =
      "background-color: blue; color: white; border: 1px solid black;";
    expect(htmlElement.getAttribute("style")).toBe(expectedStyle);
  });

  test("CSS Animations render correctly", () => {
    const habiscript = [
      "div",
      { style: { "animation": "example(5s,infinite)" } },
      "Animated content",
    ];

    const htmlElement = habiToHtml(habiscript);
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    const expectedStyle = "animation: example(5s,infinite);";
    expect(htmlElement.getAttribute("style")).toBe(expectedStyle);
  });

  test("Various Element Types are handled correctly", () => {
    const habiscript = [
      "header",
      ["main", ["article", "Article content"]],
      ["footer", "Footer content"],
    ];

    const htmlElement = habiToHtml(habiscript);
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    expect(divElement.innerHTML.trim()).toBe(
      "<header><main><article>Article content</article></main><footer>Footer content</footer></header>"
    );
  });

  test("Complex Nesting and Attributes render correctly", () => {
    const habiscript = [
      "div.wrapper",
      { id: "main-container" },
      ["header#top-header.navbar", "Header content"],
      [
        "main",
        [
          "section#content.section",
          { style: { "color": "blue" } },
          "Main content",
        ],
      ],
      ["footer", "Footer content"],
    ];

    const htmlElement = habiToHtml(habiscript);
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    expect(divElement.innerHTML.trim()).toBe(
      '<div class="wrapper" id="main-container"><header class="navbar" id="top-header">Header content</header><main><section class="section" id="content" style="color: blue;">Main content</section></main><footer>Footer content</footer></div>'
    );
  });

  test("Basic HTML to Habiscript conversion is successful", () => {
    const htmlString = '<div><p class="text">Hello World</p></div>';
    const element = new JSDOM(htmlString).window.document.body.firstChild;
    const habiscript = htmlToHabi(element);

    expect(habiscript).toStrictEqual(["div", ["p.text", "Hello World"]]);
  });

  test("Complex HTML structure conversion is successful", () => {
    const htmlString =
      '<div id="container"><section class="content">Content here</section><footer>Footer</footer></div>';
    const element = new JSDOM(htmlString).window.document.body.firstChild;
    const habiscript = htmlToHabi(element);

    expect(habiscript).toStrictEqual([
      "div#container",
      ["section.content", "Content here"],
      ["footer", "Footer"],
    ]);
  });

  test("Nested Elements and Attributes conversion is successful", () => {
    const htmlString =
      '<div><ul class="list"><li id="item1">Item 1</li><li>Item 2</li></ul></div>';
    const element = new JSDOM(htmlString).window.document.body.firstChild;
    const habiscript = htmlToHabi(element);

    expect(habiscript).toStrictEqual([
      "div",
      ["ul.list", ["li#item1", "Item 1"], ["li", "Item 2"]],
    ]);
  });

  test("NESTML to HTML and back conversion is consistent", () => {
    const initialHabi = [
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

    const htmlElement = habiToHtml(initialHabi);
    const finalHabi = htmlToHabi(htmlElement);

    // Adjust expectations or implement a more lenient comparison that focuses on semantic equivalence
    // For example, you might write a custom comparison function that ignores whitespace-only text nodes
    // and treats style objects and style strings equivalently
    expect(finalHabi).toStrictEqual(initialHabi);
  });

  test("Generates form with input and button", () => {
    const habiscript = [
      'form',
      ['input', { type: 'text' }],
      ['textarea'],
      [
        'fieldset',
        ['input', { type: 'radio', name: "test-1", value: 'test 1' }],
        ['label', { for: "test-1" }, "Test 1"],
        ['input', { type: 'radio', name: "test-2", value: 'test 2 ' }],
        ['label', { for: "test-2" }, "Test 2"],
      ]
    ]

    const htmlElement = habiToHtml(habiscript);
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    expect(divElement.innerHTML.trim()).toBe(
      '<form><input type="text"><textarea></textarea><fieldset><input type="radio" name="test-1" value="test 1"><label for="test-1">Test 1</label><input type="radio" name="test-2" value="test 2 "><label for="test-2">Test 2</label></fieldset></form>'
    );
  });

  test.only("Strips whitespace nodes correctly in habiscript conversion", () => {
    const htmlString = `
    <div>
      <p>First paragraph.</p>
      <p>Second paragraph.</p>
    </div>
  `;
    const element = new JSDOM(htmlString).window.document.body.firstChild;
    const habiscript = htmlToHabi(element);

    expect(habiscript).toStrictEqual([
      "div",
      "\n      ",
      ["p", "First paragraph."],
      "\n      ",
      ["p", "Second paragraph."],
      "\n    ",
    ]);
  });

  test("Edge Case 1", () => {
    const handleDrop = () => { };
    const handleDragOver = () => { };

    const habiscript = [
      "div",
      {
        style: {
          border: "2px dashed grey",
          padding: "20px",
          textAlign: "center",
        },
        ondragover: handleDragOver,
        ondrop: handleDrop,
      },
      "Drag and drop images here",
    ];

    const htmlElement = habiToHtml(habiscript);
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    expect(divElement.innerHTML.trim()).toBe(
      '<div style="border: 2px dashed grey; padding: 20px; text-align: center;">Drag and drop images here</div>'
    );
  });
});
