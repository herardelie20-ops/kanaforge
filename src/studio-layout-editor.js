import './studio-layout-editor.css';

const storageKey = space => `kanaforge-layout-editor:${space}`;

const getElementKey = element => {
  const route = [];
  let node = element;
  while (node && node.tagName !== 'MAIN') {
    const parent = node.parentElement;
    if (!parent) break;
    route.unshift(`${node.tagName.toLowerCase()}-${Array.prototype.indexOf.call(parent.children, node)}`);
    node = parent;
  }
  return route.join('/');
};

const loadLayout = space => {
  try { return JSON.parse(localStorage.getItem(storageKey(space)) || '{}'); }
  catch { return {}; }
};

export const installStudioLayoutEditor = (root, space) => {
  const toggle = root.querySelector('#studio-layout-editor');
  const main = root.querySelector('main');
  if (!toggle || !main) return;

  root.insertAdjacentHTML('beforeend', `<section class="studio-layout-editor-panel" aria-live="polite" hidden><b>MODE ÉDITEUR</b><span>Cliquez puis faites glisser un élément.</span><div><button type="button" data-layout-reset>Réinitialiser cette page</button><button type="button" data-layout-close>Terminer</button></div></section>`);
  const panel = root.querySelector('.studio-layout-editor-panel');
  let active = false;
  let selected = null;
  let drag = null;

  const apply = element => {
    const placement = loadLayout(space)[getElementKey(element)];
    if (!placement) return;
    element.style.position = 'relative';
    element.style.left = `${placement.x}px`;
    element.style.top = `${placement.y}px`;
  };
  const applyAll = () => main.querySelectorAll('*').forEach(apply);
  const select = element => {
    selected?.classList.remove('kf-editor-selected');
    selected = element;
    selected.classList.add('kf-editor-selected');
  };
  const close = () => {
    active = false;
    drag = null;
    root.classList.remove('layout-editor-active');
    selected?.classList.remove('kf-editor-selected');
    selected = null;
    panel.hidden = true;
    toggle.setAttribute('aria-pressed', 'false');
    toggle.textContent = '✥ Mode éditeur';
  };
  const open = () => {
    active = true;
    root.classList.add('layout-editor-active');
    panel.hidden = false;
    toggle.setAttribute('aria-pressed', 'true');
    toggle.textContent = '✓ Édition active';
    applyAll();
  };
  const save = (element, x, y) => {
    const layout = loadLayout(space);
    layout[getElementKey(element)] = { x: Math.round(x), y: Math.round(y) };
    localStorage.setItem(storageKey(space), JSON.stringify(layout));
  };

  toggle.addEventListener('click', () => active ? close() : open());
  panel.querySelector('[data-layout-close]').addEventListener('click', close);
  panel.querySelector('[data-layout-reset]').addEventListener('click', () => {
    localStorage.removeItem(storageKey(space));
    main.querySelectorAll('*').forEach(element => { element.style.left = ''; element.style.top = ''; });
    selected?.classList.remove('kf-editor-selected');
    selected = null;
  });
  root.addEventListener('pointerdown', event => {
    if (!active || !(event.target instanceof Element) || event.target.closest('.studio-layout-editor-panel, .studio-header-actions, .side')) return;
    const element = event.target;
    event.preventDefault();
    select(element);
    const style = getComputedStyle(element);
    drag = { element, x: event.clientX, y: event.clientY, left: Number.parseFloat(style.left) || 0, top: Number.parseFloat(style.top) || 0 };
    element.setPointerCapture?.(event.pointerId);
  });
  root.addEventListener('pointermove', event => {
    if (!drag) return;
    const x = drag.left + event.clientX - drag.x;
    const y = drag.top + event.clientY - drag.y;
    drag.element.style.position = 'relative';
    drag.element.style.left = `${x}px`;
    drag.element.style.top = `${y}px`;
  });
  const finishDrag = () => {
    if (!drag) return;
    save(drag.element, Number.parseFloat(drag.element.style.left) || 0, Number.parseFloat(drag.element.style.top) || 0);
    drag = null;
  };
  root.addEventListener('pointerup', finishDrag);
  root.addEventListener('pointercancel', finishDrag);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && active) close(); });
  new MutationObserver(() => { if (active) applyAll(); }).observe(main, { childList: true, subtree: true });
};
