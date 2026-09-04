(() => {
  "use strict";

  const EXTRA_WIDTH = 320;
  const WARNING_PARTS = [
    "Something is changing our source code",
    "Many features will not work correctly",
  ];
  const initialWidth = window.innerWidth;

  function containsKnownWarning(element) {
    const text = element.textContent?.replace(/\s+/g, " ").trim();

    return text && text.length < 300 && WARNING_PARTS.every((part) => text.includes(part));
  }

  function warningContainer(element) {
    let target = element;

    for (let depth = 0; depth < 8; depth += 1) {
      const parent = target.parentElement;
      if (
        !parent ||
        parent === document.body ||
        parent === document.documentElement ||
        !containsKnownWarning(parent) ||
        parent.getBoundingClientRect().height > 250
      ) {
        break;
      }

      target = parent;
    }

    return target;
  }

  function removeKnownWarnings(root = document) {
    const searchRoot = root.nodeType === Node.TEXT_NODE ? root.parentElement : root;
    if (!searchRoot) return;

    const candidates = [];
    if (searchRoot.matches?.("div, span, p")) candidates.push(searchRoot);
    candidates.push(...(searchRoot.querySelectorAll?.("div, span, p") || []));

    for (const candidate of candidates) {
      if (candidate.isConnected && containsKnownWarning(candidate)) {
        warningContainer(candidate).remove();
      }
    }
  }

  function realViewportWidth() {
    return Math.round(
      window.visualViewport?.width || document.documentElement?.clientWidth || initialWidth,
    );
  }

  function spoofedWidth() {
    return realViewportWidth() + EXTRA_WIDTH;
  }

  function installWidthSpoof() {
    const current = Object.getOwnPropertyDescriptor(window, "innerWidth");
    if (current?.get === spoofedWidth) return;

    try {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        enumerable: true,
        get: spoofedWidth,
      });
    } catch {
      // Another extension may have made the property immutable.
    }
  }

  let relayoutQueued = false;

  function relayout() {
    installWidthSpoof();
    if (relayoutQueued) return;

    relayoutQueued = true;
    requestAnimationFrame(() => {
      relayoutQueued = false;
      window.dispatchEvent(new Event("resize"));
    });
  }

  installWidthSpoof();
  removeKnownWarnings();

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      removeKnownWarnings(mutation.target);
      for (const node of mutation.addedNodes) removeKnownWarnings(node);
    }
  }).observe(document, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  for (const delay of [0, 50, 250, 1000, 2500, 5000]) {
    setTimeout(relayout, delay);
  }

  window.addEventListener("load", relayout, { once: true });
  window.visualViewport?.addEventListener("resize", relayout, {
    passive: true,
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) relayout();
  });
})();
