# NestML Library

NestML is a JavaScript library for converting HTML to a custom NestML syntax and vice versa. It provides a simple and intuitive way to transform HTML structures into a NestML array format and back, making it easier to manipulate and work with HTML in JavaScript applications.

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

### Convert HTML to NestML

To convert an HTML string to the NestML array format, use the `htmlToNestml` function:

```javascript
import { htmlToNestml } from "nestml";

const htmlString = "<div><p>Hello World</p></div>";
const nestmlArray = htmlToNestml(htmlString);
console.log(nestmlArray);
```

### Convert NestML to HTML

To convert a NestML array back to an HTML element, use the `nestmlToHtml` function:

```javascript
import { nestmlToHtml } from "nestml";

const nestmlArray = ["div", ["p", "Hello World"]];
const htmlElement = nestmlToHtml(nestmlArray);
document.body.appendChild(htmlElement);
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
