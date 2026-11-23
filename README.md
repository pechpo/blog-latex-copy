# Blog LaTeX Copy

**English** · [简体中文](README.zh-CN.md)

Select a passage with equations on a webpage and press `Ctrl+C` (`Command+C` on macOS) to copy the text and original LaTeX together. This works for selections that span multiple equations.

## Installation

1. On the GitHub repository page, select **Code → Download ZIP** and extract the archive.
2. Open `edge://extensions` in Edge or `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Click **Load unpacked** and select the folder that directly contains `manifest.json`.
4. Refresh any pages you already have open where you want to use the extension.

## Usage

Wait for the equations to render, select the text and equations you want, then use your usual copy shortcut. The clipboard gets plain text with paragraph breaks. Inline equations use `$...$`, and display equations use `$$...$$`.

```text
The area of a circle is $A = \pi r^2$, where $r$ is the radius.

The area of the unit circle is

$$
A = \pi \cdot 1^2 = \pi
$$
```

## Supported pages

- The extension reads TeX source from the MathJax runtime. It was tested in Edge on a MathJax 4.0.0 page with a selection spanning eight equations.
- KaTeX pages need to retain the LaTeX source in an annotation on the equation.
- Equations in images, screenshots, and PDFs require a separate recognition tool.
- The extension runs on HTTP and HTTPS webpages and handles copying locally in the browser. If the selection contains no recognizable equations, the browser copies it as usual.
