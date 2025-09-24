// ==UserScript==
// @name         Click to Cursor Editor
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Option+Click to jump to source in Cursor editor
// @match        *
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const getReactSourceFile = (element) => {
    if (!element) return null;

    for (const key in element) {
      if (key.startsWith("__reactFiber$")) {
        if (element[key]._debugSource) {
          return element[key]._debugSource;
        }
      }
    }
    return getReactSourceFile(element.parentNode);
  };

  const getVueSourceFile = (element) => {
    if (!element) return null;

    let currentElement = element;
    while (currentElement) {
      const instance = currentElement.__vueParentComponent;
      let currentInstance = instance;

      while (currentInstance) {
        if (currentInstance.type && currentInstance.type.__file) {
          return {
            fileName: window.env.__dirname + "/" + currentInstance.type.__file,
            columnNumber: 1,
            lineNumber: 1,
          };
        }

        currentInstance = currentInstance.parent;
      }

      currentElement = currentElement.parentNode;
    }
    return null;
  };

  const openInCursor = ({ fileName, lineNumber = 1, columnNumber = 1 }) => {
    if (!fileName) return;
    const url = `cursor://file/${fileName}:${lineNumber}:${columnNumber}`;
    console.log("[Jump to Cursor]", url);
    window.open(url);
  };

  const initClickListener = () => {
    document.body.addEventListener("click", (event) => {
      if (!event.altKey) return;

      const target = event.target;
      if (target.__vueParentComponent) {
        const vueSource = getVueSourceFile(target);
        if (vueSource) {
          openInCursor(vueSource);
          event.preventDefault();
        }
        return;
      }

      const reactSource = getReactSourceFile(target);
      if (reactSource) {
        openInCursor(reactSource);
        event.preventDefault();
        return;
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClickListener);
  } else {
    initClickListener();
  }
})();
