const { JSDOM } = require("jsdom");
const { habiToHtml } = require("../../src/index.js");

// Define your components outside the test
function Tile({ id, text }) {
  const tileStyle = {
    border: "1px solid #ccc",
    background: "#f7f7f7",
    margin: "0.5%",
    flexBasis: "calc(100% / 24 - 1%)",
    height: "150px",
  };

  const handleDrag = () => {
    /*...*/
  };
  const handleResize = () => {
    /*...*/
  };

  return [
    `div#${id}.tile`,
    { style: tileStyle, onmousedown: handleDrag, onresize: handleResize },
    text,
  ];
}

function FlexGrid({ children }) {
  const gridStyle = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    margin: "0 auto",
    maxWidth: "100%",
  };

  return [
    "div.flex-grid-container",
    { style: gridStyle },
    ...children.map((child) => Tile(child)),
  ];
}

describe("FlexGrid component", () => {
  let document;

  beforeAll(() => {
    // Create a JSDOM instance
    const jsdom = new JSDOM("");
    global.document = jsdom.window.document;
    global.Node = jsdom.window.Node;
    document = jsdom.window.document;
  });

  test("renders correctly with two tiles", () => {
    // Create a FlexGrid instance
    const grid = FlexGrid({
      children: [
        { id: "tile1", text: "Tile 1" },
        { id: "tile2", text: "Tile 2" },
      ],
    });

    // Convert to HTML using the provided function
    const htmlElement = habiToHtml(grid);

    // Append to a div for testing
    const divElement = document.createElement("div");
    divElement.appendChild(htmlElement);

    // Use JSDOM to parse the generated HTML
    const parsedDoc = new JSDOM(divElement.innerHTML).window.document;

    // Assertions using Jest's expect function
    const container = parsedDoc.querySelector(".flex-grid-container");
    expect(container).not.toBeNull();
    expect(container.style.display).toBe("flex");
    expect(container.style.flexWrap).toBe("wrap");

    const tiles = container.querySelectorAll(".tile");
    expect(tiles).toHaveLength(2);
    expect(tiles[0].id).toBe("tile1");
    expect(tiles[1].id).toBe("tile2");
  });
});
