(() => {
  "use strict";

  const MAX_EXTRA_WIDTH = 800;
  const WARNING_PARTS = [
    "Something is changing our source code",
    "Many features will not work correctly",
  ];
  const initialWidth = window.innerWidth;
  let extraWidth = 0;

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
        parent.matches?.(".app, .panelblock.mainblock") ||
        parent.querySelector?.(".panelblock.mainblock") ||
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

    const candidates = [...(searchRoot.querySelectorAll?.("div, span, p") || [])].reverse();
    if (searchRoot.matches?.("div, span, p")) candidates.push(searchRoot);

    for (const candidate of candidates) {
      if (candidate.isConnected && containsKnownWarning(candidate)) {
        const container = warningContainer(candidate);
        if (
          !container.matches?.(".app, .panelblock.mainblock") &&
          !container.querySelector?.(".panelblock.mainblock")
        ) {
          container.remove();
        }
      }
    }
  }

  function realViewportWidth() {
    return Math.round(
      window.visualViewport?.width || document.documentElement?.clientWidth || initialWidth,
    );
  }

  function spoofedWidth() {
    return realViewportWidth() + extraWidth;
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

  let adjustmentFrame = 0;

  function adjustWidth() {
    installWidthSpoof();
    const workspace = document.querySelector(".panelblock.mainblock");
    if (!workspace) return;

    const error = Math.round(realViewportWidth() - workspace.getBoundingClientRect().right);
    if (Math.abs(error) <= 6) return;

    const nextExtraWidth = Math.max(0, Math.min(MAX_EXTRA_WIDTH, extraWidth + error));
    if (Math.abs(nextExtraWidth - extraWidth) <= 2) return;

    extraWidth = nextExtraWidth;
    window.dispatchEvent(new Event("resize"));
    scheduleAdjustment();
  }

  function scheduleAdjustment() {
    if (adjustmentFrame) return;

    adjustmentFrame = requestAnimationFrame(() => {
      adjustmentFrame = 0;
      adjustWidth();
    });
  }

  installWidthSpoof();
  removeKnownWarnings();

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        removeKnownWarnings(mutation.target);
        continue;
      }

      if (containsKnownWarning(mutation.target)) {
        removeKnownWarnings(mutation.target);
      }

      for (const node of mutation.addedNodes) {
        removeKnownWarnings(node);

        if (
          node.matches?.(".panelblock.mainblock") ||
          node.querySelector?.(".panelblock.mainblock")
        ) {
          scheduleAdjustment();
        }
      }
    }
  }).observe(document, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  for (const delay of [0, 50, 250, 1000, 2500, 5000]) {
    setTimeout(scheduleAdjustment, delay);
  }

  window.addEventListener("load", scheduleAdjustment, { once: true });
  window.addEventListener("resize", scheduleAdjustment);
  window.visualViewport?.addEventListener("resize", scheduleAdjustment, {
    passive: true,
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) scheduleAdjustment();
  });
})();
