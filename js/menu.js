// Navigazione tra le schermate del menu, con mouse o tastiera
const screens = document.querySelectorAll(".screen");

function show(id) {
  screens.forEach((s) => s.classList.toggle("is-active", s.id === id));
  focusFirst();
}

function activeItems() {
  return [...document.querySelectorAll(".screen.is-active .menu-item:not(:disabled)")];
}

function focusFirst() {
  activeItems()[0]?.focus();
}

document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-goto]");
  if (target) show(target.dataset.goto);
});

document.addEventListener("keydown", (e) => {
  const items = activeItems();
  const i = items.indexOf(document.activeElement);
  if (e.key === "ArrowDown") {
    e.preventDefault();
    items[(i + 1) % items.length]?.focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    items[(i - 1 + items.length) % items.length]?.focus();
  } else if (e.key === "Escape") {
    show("screen-menu");
  }
});

focusFirst();
