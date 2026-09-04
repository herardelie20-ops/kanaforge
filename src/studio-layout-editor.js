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

  root.insertAdjacentHTML('beforeend', `<section class="studio-layout-editor-panel" aria-live="polite" hidden><b>MODE ÉDITEUR</b><span>Glissez pour déplacer · double-cliquez puis tirez l’angle pour étirer.</span><div><button type="button" data-layout-reset>Réinitialiser cette page</button><button type="button" data-layout-close>Terminer</button></div></section><button class="studio-layout-resize-handle" type="button" aria-label="Étirez cet élément depuis son angle" hidden></button>`);
  const panel = root.querySelector('.studio-layout-editor-panel');
  const resizeHandle = root.querySelector('.studio-layout-resize-handle');
  let active = false;
  let selected = null;
  let drag = null;
  let resize = null;

  const apply = element => {
    const placement = loadLayout(space)[getElementKey(element)];
    if (!placement) return;
    element.style.position = 'relative';
    element.style.left = `${placement.x}px`;
    element.style.top = `${placement.y}px`;
    if (placement.width) element.style.width = `${placement.width}px`;
    if (placement.height) element.style.height = `${placement.height}px`;
  };
  const applyAll = () => main.querySelectorAll('*').forEach(apply);
  const select = element => {
    selected?.classList.remove('kf-editor-selected');
    selected = element;
    selected.classList.add('kf-editor-selected');
  };
  const positionResizeHandle = () => {
    if (!selected || !active || resizeHandle.hidden) return;
    const box = selected.getBoundingClientRect();
    resizeHandle.style.left = `${box.right - 10}px`;
    resizeHandle.style.top = `${box.bottom - 10}px`;
  };
  const showResizeHandle = element => {
    select(element);
    resizeHandle.hidden = false;
    positionResizeHandle();
  };
  const close = () => {
    active = false;
    drag = null;
    resize = null;
    root.classList.remove('layout-editor-active');
    selected?.classList.remove('kf-editor-selected');
    selected = null;
    resizeHandle.hidden = true;
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
  const save = (element, x, y, width, height) => {
    const layout = loadLayout(space);
    layout[getElementKey(element)] = { x: Math.round(x), y: Math.round(y), width: Math.round(width || element.getBoundingClientRect().width), height: Math.round(height || element.getBoundingClientRect().height) };
    localStorage.setItem(storageKey(space), JSON.stringify(layout));
  };

  toggle.addEventListener('click', () => active ? close() : open());
  panel.querySelector('[data-layout-close]').addEventListener('click', close);
  panel.querySelector('[data-layout-reset]').addEventListener('click', () => {
    localStorage.removeItem(storageKey(space));
    main.querySelectorAll('*').forEach(element => { element.style.left = ''; element.style.top = ''; element.style.width = ''; element.style.height = ''; });
    selected?.classList.remove('kf-editor-selected');
    selected = null;
    resizeHandle.hidden = true;
  });
  root.addEventListener('pointerdown', event => {
    if (!active || !(event.target instanceof Element) || event.target.closest('.studio-layout-editor-panel, .studio-header-actions, .side')) return;
    const element = event.target;
    event.preventDefault();
    select(element);
    if (event.detail > 1) {
      showResizeHandle(element);
      return;
    }
    const style = getComputedStyle(element);
    drag = { element, x: event.clientX, y: event.clientY, left: Number.parseFloat(style.left) || 0, top: Number.parseFloat(style.top) || 0 };
    element.setPointerCapture?.(event.pointerId);
  });
  root.addEventListener('pointermove', event => {
    if (drag) {
      const x = drag.left + event.clientX - drag.x;
      const y = drag.top + event.clientY - drag.y;
      drag.element.style.position = 'relative';
      drag.element.style.left = `${x}px`;
      drag.element.style.top = `${y}px`;
      positionResizeHandle();
    }
    if (resize) {
      resize.element.style.width = `${Math.max(28, resize.width + event.clientX - resize.x)}px`;
      resize.element.style.height = `${Math.max(24, resize.height + event.clientY - resize.y)}px`;
      positionResizeHandle();
    }
  });
  const finishDrag = () => {
    if (drag) {
      save(drag.element, Number.parseFloat(drag.element.style.left) || 0, Number.parseFloat(drag.element.style.top) || 0);
      drag = null;
    }
    if (resize) {
      save(resize.element, Number.parseFloat(resize.element.style.left) || 0, Number.parseFloat(resize.element.style.top) || 0, Number.parseFloat(resize.element.style.width), Number.parseFloat(resize.element.style.height));
      resize = null;
    }
  };
  root.addEventListener('pointerup', finishDrag);
  root.addEventListener('pointercancel', finishDrag);
  root.addEventListener('dblclick', event => {
    if (!active || !(event.target instanceof Element) || event.target.closest('.studio-layout-editor-panel, .studio-header-actions, .side')) return;
    event.preventDefault();
    showResizeHandle(event.target);
  });
  resizeHandle.addEventListener('pointerdown', event => {
    if (!active || !selected) return;
    event.preventDefault();
    event.stopPropagation();
    const box = selected.getBoundingClientRect();
    resize = { element: selected, x: event.clientX, y: event.clientY, width: box.width, height: box.height };
    resizeHandle.setPointerCapture?.(event.pointerId);
  });
  addEventListener('resize', positionResizeHandle, { passive: true });
  addEventListener('scroll', positionResizeHandle, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && active) close(); });
  new MutationObserver(() => { if (active) applyAll(); }).observe(main, { childList: true, subtree: true });
};
