import './studio-canvas-fullscreen.css';

function addFullscreenButton(container, toolbar, label) {
  if (!container || !toolbar || toolbar.querySelector('.studio-fullscreen')) return;
  toolbar.insertAdjacentHTML('beforeend', `<button class="studio-fullscreen" type="button">⇱ ${label}</button>`);
  const button = toolbar.querySelector('.studio-fullscreen');
  const refresh = () => { const open = document.fullscreenElement === container; button.textContent = open ? '↙ Réduire' : `⇱ ${label}`; };
  button.onclick = () => document.fullscreenElement === container ? document.exitFullscreen?.() : container.requestFullscreen?.();
  document.addEventListener('fullscreenchange', refresh);
}

function install() {
  const studio = new URLSearchParams(location.search).get('studio');
  if (studio === 'lettering') addFullscreenButton(document.querySelector('.drawing-zone'), document.querySelector('.drawing-tools'), 'Grand format');
  if (studio === 'flash') addFullscreenButton(document.querySelector('.flash-stage'), document.querySelector('.flash-editor header'), 'Dessiner en grand');
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(install), { once: true });
else setTimeout(install);
