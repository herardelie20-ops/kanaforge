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
  const main = root.matches('main') ? root : root.querySelector('main');
  if (!toggle || !main) return;

  root.insertAdjacentHTML('beforeend', `<section class="studio-layout-editor-panel" aria-live="polite" hidden><b>MODE ÉDITEUR</b><span>Glissez pour déplacer · double-cliquez puis tirez un angle pour étirer · Suppr efface · Ctrl+Z restaure.</span><div><button type="button" data-layout-reset>Réinitialiser cette page</button><button type="button" data-layout-close>Terminer</button></div></section><div class="studio-layout-resize-handles" hidden><button type="button" data-resize-corner="nw" aria-label="Étirez depuis l’angle haut gauche"></button><button type="button" data-resize-corner="ne" aria-label="Étirez depuis l’angle haut droit"></button><button type="button" data-resize-corner="sw" aria-label="Étirez depuis l’angle bas gauche"></button><button type="button" data-resize-corner="se" aria-label="Étirez depuis l’angle bas droit"></button></div>`);
  const panel = root.querySelector('.studio-layout-editor-panel');
  const resizeHandles = root.querySelector('.studio-layout-resize-handles');
  let active = false;
  let selected = null;
  let drag = null;
  let resize = null;
  const undoStack = [];
  const isEditorControl = element => element.closest('.studio-layout-editor-panel, #studio-layout-editor, .studio-layout-resize-handles');

  const apply = element => {
    const placement = loadLayout(space)[getElementKey(element)];
    if (!placement) return;
    if (placement.hidden) { element.style.display = 'none'; return; }
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
    if (!selected || !active || resizeHandles.hidden) return;
    const box = selected.getBoundingClientRect();
    const corners = { nw:[box.left,box.top], ne:[box.right,box.top], sw:[box.left,box.bottom], se:[box.right,box.bottom] };
    resizeHandles.querySelectorAll('[data-resize-corner]').forEach(handle => {
      const [left, top] = corners[handle.dataset.resizeCorner];
      handle.style.left = `${left - 10}px`;
      handle.style.top = `${top - 10}px`;
    });
  };
  const showResizeHandle = element => {
    select(element);
    resizeHandles.hidden = false;
    positionResizeHandle();
  };
  const close = () => {
    active = false;
    drag = null;
    resize = null;
    root.classList.remove('layout-editor-active');
    selected?.classList.remove('kf-editor-selected');
    selected = null;
    resizeHandles.hidden = true;
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
  const findElement = key => [...main.querySelectorAll('*')].find(element => getElementKey(element) === key);
  const removeSelected = () => {
    if (!selected) return;
    const key = getElementKey(selected);
    undoStack.push({ key });
    const layout = loadLayout(space);
    layout[key] = { ...(layout[key] || {}), hidden: true };
    localStorage.setItem(storageKey(space), JSON.stringify(layout));
    selected.style.display = 'none';
    selected.classList.remove('kf-editor-selected');
    selected = null;
    resizeHandles.hidden = true;
  };
  const undoDelete = () => {
    const action = undoStack.pop();
    if (!action) return;
    const layout = loadLayout(space);
    delete layout[action.key];
    localStorage.setItem(storageKey(space), JSON.stringify(layout));
    const element = findElement(action.key);
    if (!element) return;
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    element.style.width = '';
    element.style.height = '';
    element.style.display = '';
    select(element);
  };

  toggle.addEventListener('click', () => active ? close() : open());
  panel.querySelector('[data-layout-close]').addEventListener('click', close);
  panel.querySelector('[data-layout-reset]').addEventListener('click', () => {
    localStorage.removeItem(storageKey(space));
    main.querySelectorAll('*').forEach(element => { element.style.position = ''; element.style.left = ''; element.style.top = ''; element.style.width = ''; element.style.height = ''; element.style.display = ''; });
    selected?.classList.remove('kf-editor-selected');
    selected = null;
    resizeHandles.hidden = true;
  });
  root.addEventListener('pointerdown', event => {
    if (!active || !(event.target instanceof Element) || event.target.closest('.studio-layout-editor-panel, .studio-header-actions, #studio-layout-editor, .studio-layout-resize-handles')) return;
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
      const deltaX = event.clientX - resize.x;
      const deltaY = event.clientY - resize.y;
      const fromWest = resize.corner.includes('w');
      const fromNorth = resize.corner.includes('n');
      const width = Math.max(28, resize.width + (fromWest ? -deltaX : deltaX));
      const height = Math.max(24, resize.height + (fromNorth ? -deltaY : deltaY));
      resize.element.style.width = `${width}px`;
      resize.element.style.height = `${height}px`;
      if (fromWest) resize.element.style.left = `${resize.left + resize.width - width}px`;
      if (fromNorth) resize.element.style.top = `${resize.top + resize.height - height}px`;
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
    if (!active || !(event.target instanceof Element) || event.target.closest('.studio-layout-editor-panel, .studio-header-actions, #studio-layout-editor, .studio-layout-resize-handles')) return;
    event.preventDefault();
    showResizeHandle(event.target);
  });
  resizeHandles.querySelectorAll('[data-resize-corner]').forEach(handle => handle.addEventListener('pointerdown', event => {
    if (!active || !selected) return;
    event.preventDefault();
    event.stopPropagation();
    const box = selected.getBoundingClientRect();
    const style = getComputedStyle(selected);
    resize = { element: selected, corner: handle.dataset.resizeCorner, x: event.clientX, y: event.clientY, width: box.width, height: box.height, left: Number.parseFloat(style.left) || 0, top: Number.parseFloat(style.top) || 0 };
    handle.setPointerCapture?.(event.pointerId);
  }));
  addEventListener('resize', positionResizeHandle, { passive: true });
  addEventListener('scroll', positionResizeHandle, { passive: true });
  const blockInterfaceAction = event => {
    if (!active || !(event.target instanceof Element) || isEditorControl(event.target)) return;
    if (!event.target.closest('a,button,input,select,textarea,label,[role="button"]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  root.addEventListener('click', blockInterfaceAction, true);
  root.addEventListener('auxclick', blockInterfaceAction, true);
  root.addEventListener('submit', blockInterfaceAction, true);
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' || !active || !(event.target instanceof Element) || isEditorControl(event.target)) return;
    if (event.target.closest('a,button,input,select,textarea,label,[role="button"]')) blockInterfaceAction(event);
  }, true);
  document.addEventListener('keydown', event => {
    if (!active) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      undoDelete();
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && selected && !(event.target instanceof Element && isEditorControl(event.target))) {
      event.preventDefault();
      removeSelected();
      return;
    }
    if (event.key === 'Escape') close();
  });
  applyAll();
  new MutationObserver(applyAll).observe(main, { childList: true, subtree: true });
};
