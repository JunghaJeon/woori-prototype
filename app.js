const defaultStates = {
  bookshelf: "start",
  today: "prompt",
};

const currentStates = { ...defaultStates };

const screenEls = Array.from(document.querySelectorAll(".screen"));
const actionButtons = Array.from(
  document.querySelectorAll("[data-go], [data-set-state], [data-go-state]"),
);
const stateEls = Array.from(document.querySelectorAll("[data-state-group][data-state-value]"));
const helpOpenButtons = Array.from(document.querySelectorAll("[data-help-open]"));
const helpCloseButtons = Array.from(document.querySelectorAll("[data-help-close]"));
const helpLayers = Array.from(document.querySelectorAll(".help-sheet-layer"));
const helpDragHandles = Array.from(document.querySelectorAll("[data-help-drag-handle]"));

let activeHelpLayer = null;
let helpDragState = null;

function renderStateGroup(group) {
  const value = currentStates[group];

  stateEls.forEach((el) => {
    if (el.dataset.stateGroup !== group) {
      return;
    }

    el.hidden = el.dataset.stateValue !== value;
  });
}

function setState(group, value) {
  if (!group || !value) {
    return;
  }

  currentStates[group] = value;
  renderStateGroup(group);
}

function applyStateAction(action) {
  if (!action) {
    return;
  }

  const [group, value] = action.split(":");
  setState(group, value);
}

function resetHelpSheet(layer) {
  const sheet = layer?.querySelector(".help-sheet");
  if (!sheet) {
    return;
  }

  sheet.style.transform = "";
  sheet.style.transition = "";
}

function closeHelpSheet() {
  if (!activeHelpLayer) {
    return;
  }

  resetHelpSheet(activeHelpLayer);
  activeHelpLayer.hidden = true;
  activeHelpLayer.setAttribute("aria-hidden", "true");
  activeHelpLayer = null;
  helpDragState = null;
}

function openHelpSheet(layerId) {
  const nextLayer = document.getElementById(layerId);
  if (!nextLayer) {
    return;
  }

  if (activeHelpLayer && activeHelpLayer !== nextLayer) {
    closeHelpSheet();
  }

  resetHelpSheet(nextLayer);
  nextLayer.hidden = false;
  nextLayer.setAttribute("aria-hidden", "false");
  activeHelpLayer = nextLayer;
}

function showScreen(screenId) {
  closeHelpSheet();

  screenEls.forEach((screen) => {
    screen.classList.toggle("is-visible", screen.id === `screen-${screenId}`);
  });
}

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyStateAction(button.dataset.setState);
    applyStateAction(button.dataset.goState);

    if (button.dataset.go) {
      showScreen(button.dataset.go);
    }
  });
});

helpOpenButtons.forEach((button) => {
  button.addEventListener("click", () => openHelpSheet(button.dataset.helpOpen));
});

helpCloseButtons.forEach((button) => {
  button.addEventListener("click", closeHelpSheet);
});

helpLayers.forEach((layer) => {
  layer.addEventListener("click", (event) => {
    if (event.target === layer) {
      closeHelpSheet();
    }
  });
});

helpDragHandles.forEach((handle) => {
  const layer = handle.closest(".help-sheet-layer");
  const sheet = handle.closest(".help-sheet");
  if (!layer || !sheet) {
    return;
  }

  const finishDrag = (event) => {
    if (!helpDragState || helpDragState.pointerId !== event.pointerId) {
      return;
    }

    const delta = Math.max(0, event.clientY - helpDragState.startY);
    const activeSheet = helpDragState.sheet;
    const dragLayer = helpDragState.layer;

    activeSheet.style.transition = "transform 180ms ease";

    if (delta > 90) {
      activeSheet.style.transform = "translateY(100%)";
      window.setTimeout(() => {
        if (activeHelpLayer === dragLayer) {
          closeHelpSheet();
        }
      }, 150);
    } else {
      activeSheet.style.transform = "";
      window.setTimeout(() => {
        activeSheet.style.transition = "";
      }, 180);
    }

    helpDragState = null;
  };

  handle.addEventListener("pointerdown", (event) => {
    helpDragState = {
      startY: event.clientY,
      pointerId: event.pointerId,
      layer,
      sheet,
    };

    sheet.style.transition = "none";
    if (handle.setPointerCapture) {
      handle.setPointerCapture(event.pointerId);
    }
  });

  handle.addEventListener("pointermove", (event) => {
    if (!helpDragState || helpDragState.pointerId !== event.pointerId) {
      return;
    }

    const delta = Math.max(0, event.clientY - helpDragState.startY);
    sheet.style.transform = `translateY(${delta}px)`;
  });

  handle.addEventListener("pointerup", finishDrag);
  handle.addEventListener("pointercancel", finishDrag);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeHelpSheet();
  }
});

Object.entries(defaultStates).forEach(([group, value]) => {
  setState(group, value);
});

showScreen("welcome");
