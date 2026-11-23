(() => {
  const ignoredTags = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT"]);
  const blockDisplays = new Set([
    "block", "flow-root", "list-item", "table", "table-row", "table-caption",
    "flex", "grid",
  ]);

  function collectFormulas(range) {
    const formulas = new Map();
    const mathItems = window.MathJax?.startup?.document?.math;
    if (typeof mathItems?.[Symbol.iterator] === "function") {
      for (const item of mathItems) {
        const root = item.typesetRoot;
        const source = item.math?.trim();
        if (root?.isConnected && item.inputJax?.name === "TeX" && source &&
            range.intersectsNode(root)) {
          formulas.set(root, { source, display: Boolean(item.display) });
        }
      }
    }

    const ancestor = range.commonAncestorContainer;
    const scope = ancestor.nodeType === Node.ELEMENT_NODE ? ancestor : ancestor.parentElement;
    if (scope) {
      const enclosing = scope.closest(".katex");
      const candidates = enclosing ? [enclosing] : scope.querySelectorAll(".katex");
      for (const katex of candidates) {
        const root = katex.closest(".katex-display") ?? katex;
        if (!range.intersectsNode(root)) continue;
        const source = katex.querySelector('annotation[encoding="application/x-tex"]')
          ?.textContent.trim();
        if (source) formulas.set(root, { source, display: root !== katex });
      }
    }
    return formulas;
  }

  function serializeRange(range, formulas) {
    const parts = [];
    let pendingBreak = 0;

    function lineBreak(size) {
      pendingBreak = Math.max(pendingBreak, size);
    }

    function append(text) {
      if (!text) return;
      if (pendingBreak) {
        if (parts.length) parts.push("\n".repeat(pendingBreak));
        pendingBreak = 0;
      }
      parts.push(text);
    }

    function visit(node, preserveWhitespace = false) {
      if (!range.intersectsNode(node)) return;

      const formula = formulas.get(node);
      if (formula) {
        if (formula.display) {
          lineBreak(2);
          append("$$\n" + formula.source + "\n$$");
          lineBreak(2);
        } else {
          append("$" + formula.source + "$");
        }
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const start = node === range.startContainer ? range.startOffset : 0;
        const end = node === range.endContainer ? range.endOffset : node.length;
        const text = node.data.slice(start, end);
        if (preserveWhitespace) {
          append(text);
        } else if (!pendingBreak || /\S/.test(text)) {
          append(text.replace(/\s+/g, " "));
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE || ignoredTags.has(node.tagName)) return;
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return;
      if (node.tagName === "BR") {
        lineBreak(1);
        return;
      }

      const block = blockDisplays.has(style.display);
      if (block) lineBreak(style.display === "table-row" ? 1 : 2);
      const keepSpaces = preserveWhitespace || /^(pre|break-spaces)/.test(style.whiteSpace);
      for (const child of node.childNodes) visit(child, keepSpaces);
      if (style.display === "table-cell") append("\t");
      if (block) lineBreak(style.display === "table-row" ? 1 : 2);
    }

    let root = range.commonAncestorContainer;
    for (let node = root; node; node = node.parentNode) {
      if (formulas.has(node)) {
        root = node;
        break;
      }
    }
    visit(root);
    return parts.join("").trim();
  }

  window.addEventListener("copy", (event) => {
    if (!event.clipboardData || event.defaultPrevented) return;
    const target = event.target;
    if (target instanceof HTMLElement &&
        (target.isContentEditable || target.matches("input, textarea"))) return;

    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const formulas = collectFormulas(range);
    if (!formulas.size) return;

    const text = serializeRange(range, formulas);
    if (!text) return;
    event.clipboardData.setData("text/plain", text);
    event.preventDefault();
    event.stopImmediatePropagation();
  }, { capture: true });
})();
