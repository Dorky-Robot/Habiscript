![NestML Logo](nestml.jpg)

# NestML Library

NestML is a JavaScript library for converting HTML to a custom NestML syntax and vice versa. It provides a simple and intuitive way to transform HTML structures into a NestML array format and back, making it easier to manipulate and work with HTML in JavaScript applications.

## Why use NestML?
NestML allows you to create truly self-contained web components. Instead of shipping separate CSS, HTML, and Javascript, you can create a single function containing everything. All of this can happen on the browsers.

```javascript
function Button({ id, className, style, text }) {
  const handleButtonClick = () => console.log("Button clicked");
  return [`button#${id}.${className}`, { style, onclick: handleButtonClick }, text];
}

nestml.nestmlToHtml(
  [
    "div",
    Button({
      id: "myButton",
      className: "btn btn-primary",
      style: { margin: "10px" },
      text: "Click Me",
    })
  ]
)
```

## Installation

To install NestML, you can use npm or yarn as follows:

```bash
npm install nestml
```

Or, if you're using yarn:

```bash
yarn add nestml
```

## Usage

### Basic Conversion

Convert an HTML string to the NestML array format:

```javascript
import { htmlToNestml } from "nestml";

const htmlString = "<div><p>Hello World</p></div>";
const nestmlArray = htmlToNestml(htmlString);
console.log(nestmlArray);
```

Convert a NestML array back to an HTML element:

```javascript
import { nestmlToHtml } from "nestml";

const nestmlArray = ["div", ["p", "Hello World"]];
const htmlElement = nestmlToHtml(nestmlArray);
document.body.appendChild(htmlElement);
```

### Handling CSS with Animations

Demonstrating how to add CSS animations using NestML:

```javascript
import { nestmlToHtml } from "nestml";

const nestmlWithAnimation = [
  "div",
  { style: { animation: "example 5s infinite" } },
  "Animated content",
];

const animatedElement = nestmlToHtml(nestmlWithAnimation);
document.body.appendChild(animatedElement);
```

### In the Browser

You don't need to install anything if you want to use NestML directly in the browser. Simply include the following `<script>` tag in your HTML:

```html
<script src="https://unpkg.com/nestml/dist/nestml.bundle.js"></script>
```

or

```html
<script src="https://unpkg.com/nestml/dist/nestml.bundle.min.js"></script>
```

This will load the NestML library and make it available as a global variable `nestml`. Here's how to use it:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>NestML Example</title>
    <script src="https://unpkg.com/nestml/dist/nestml.bundle.min.js"></script>
  </head>
  <body>
    <script>
      // Convert an HTML string to the NestML array format
      const htmlString = "<div><p>Hello World</p></div>";
      const nestmlArray = nestml.htmlToNestml(htmlString);
      console.log(nestmlArray);

      // Convert a NestML array back to an HTML element
      const htmlElement = nestml.nestmlToHtml(nestmlArray);
      document.body.appendChild(htmlElement);
    </script>
  </body>
</html>
```

### Advanced Styling

Handling more complex CSS properties:

```javascript
import { nestmlToHtml } from "nestml";

const nestmlWithComplexStyle = [
  "div",
  {
    style: {
      backgroundColor: "linear-gradient(to right, red, orange)",
      boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2)",
    },
  },
  "Stylish content",
];

const stylishElement = nestmlToHtml(nestmlWithComplexStyle);
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
  const app = nestml.nestmlToHtml(MyApp());
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

Project Link: [https://github.com/felixflores/nestml](https://github.com/felixflores/nestml)
