![Habiscript Logo](habiscript.jpg)

# Habiscript

habi: Tagalog word for woven.

For some time now, many of the existing model frameworks have been built on the fundamental assumption that HTML, CSS, and JS are related yet separate technologies. However, over time, the responsibilities of these technologies have begun to blur into each other. CSS has been extended to the point where it crosses beyond just styles and into the domain previously reserved for JS. At the same time, HTML and JS have continued in ways that make them intrinsically coupled, such as the case for canvas, `webGL,` and other more advanced uses of HTML.

We should reconsider those boundaries and perhaps remove them altogether. Habiscript hopes to unify CSS and HTML with JS and remove the accidental complexities resulting from maintaining those traditional separations.

With Habiscript, allows it's possible to

```javascript
function Button({ id, className, style, text }) {
  const handleButtonClick = () => console.log("Button clicked");
  return [
    `button#${id}.${className}`,
    { style, onclick: handleButtonClick },
    text,
  ];
}

Habiscript.habiToHtml([
  "div",
  Button({
    id: "myButton",
    className: "btn btn-primary",f
    style: { margin: `${2*10}px` },
    text: "Click Me",
  }),
]);
```

## Installation

To install Habiscript, you can use npm or yarn as follows:

```bash
npm install habiscript
```

Or, if you're using yarn:

```bash
yarn add habiscript
```

## Usage

### Basic Usage

Use Habiscript notation to turn Javascript structures to html elements.

```javascript
import { habiToHtml } from "habiscript";

const hello = ["div", ["p", "Hello World"]];
const htmlElement = habiToHtml(hello);
document.body.appendChild(htmlElement);
```

You can also turn html to Habiscript

```javascript
import { htmlToHabi } from "habiscript";

const htmlString = "<div><p>Hello World</p></div>";
const habiArray = htmlToHabi(htmlString);
console.log(habiArray);
```

### Handling CSS with Animations

Demonstrating how to add CSS animations using Habiscript:

```javascript
import { habiToHtml } from "habiscript";

const habiWithAnimation = [
  "div",
  { style: { animation: "example 5s infinite" } },
  "Animated content",
];

const animatedElement = habiToHtml(habiWithAnimation);
document.body.appendChild(animatedElement);
```

### In the Browser

You don't need to install anything if you want to use Habiscript directly in the browser. Simply include the following `<script>` tag in your HTML:

```html
<script src="https://unpkg.com/habiscript/dist/habiscript.bundle.js"></script>
```

or

```html
<script src="https://unpkg.com/habiscript/dist/habiscript.bundle.min.js"></script>
```

This will load the Habiscript library and make it available as a global variable `habiscript`. Here's how to use it:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Habiscript Example</title>
    <script src="https://unpkg.com/habiscript/dist/habiscript.bundle.min.js"></script>
  </head>
  <body>
    <script>
      // Convert an HTML string to the Habiscript array format
      const htmlString = "<div><p>Hello World</p></div>";
      const habiArray = Habiscript.htmlToHabi(htmlString);
      console.log(habiArray);

      // Convert a Habiscript array back to an HTML element
      const htmlElement = Habiscript.habilToHtml(habiArray);
      document.body.appendChild(htmlElement);
    </script>
  </body>
</html>
```

### Advanced Styling

Handling more complex CSS properties:

```javascript
import { habiToHtml } from "habiscript";

const habiWithComplexStyle = [
  "div",
  {
    style: {
      backgroundColor: "linear-gradient(to right, red, orange)",
      boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2)",
    },
  },
  "Stylish content",
];

const stylishElement = habiToHtml(habiWithComplexStyle);
document.body.appendChild(stylishElement);
```

### Instantiable Components

```javascript
function Button({ id, className, style, onClick, text }) {
  return [`button#${id}.${className}`, { style, onclick: onClick }, text];
}

function TextBox({ id, className, style, onChange, placeholder }) {
  return [
    `input#${id}.${className}`,
    { type: "text", style, placeholder, oninput: onChange },
  ];
}

function MyApp() {
  const handleButtonClick = () => console.log("Button clicked");
  const handleTextChange = (e) => console.log("Text changed:", e.target.value);

  return [
    "div#app.container",
    Button({
      id: "myButton",
      className: "btn btn-primary",
      style: { margin: "10px" },
      onClick: handleButtonClick,
      text: "Click Me",
    }),
    TextBox({
      id: "myTextBox",
      className: "form-control",
      style: { margin: "10px" },
      onChange: handleTextChange,
      placeholder: "Enter text here",
    }),
  ];
}

// Render MyApp to the DOM
document.addEventListener("DOMContentLoaded", () => {
  const app = Habiscript.habiToHtml(MyApp());
  document.body.appendChild(app);
});
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your pull request adheres to the following guidelines:

- Search previous suggestions before making a new one, as yours may be a duplicate.
- Make an individual pull request for each suggestion.
- Use the following commit message format: `feat: Add <feature_name>` for new features, `fix: Fix <issue>` for bug fixes.
- New categories, or improvements to the existing categorization are welcome.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Felix Flores - felixflores@gmail.com

Project Link: [https://github.com/felixflores/habiscript](https://github.com/felixflores/habiscript)
