function install() {
  const toolbar = document.querySelector('.preview-heading .format');
  if (!toolbar || toolbar.querySelector('#app-fullscreen')) return;
  const button = document.createElement('button');
  button.id = 'app-fullscreen';
  button.type = 'button';
  button.title = 'Plein écran de l’interface';
  toolbar.append(button);

  const target = document.documentElement;
  const refresh = () => {
    const open = document.fullscreenElement === target;
    button.textContent = open ? '↙ Quitter' : '⛶ Interface';
    button.setAttribute('aria-pressed', String(open));
    button.title = open ? 'Quitter le plein écran' : 'Plein écran de l’interface';
  };
  button.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else target.requestFullscreen?.().catch(() => {});
  });
  document.addEventListener('fullscreenchange', refresh);
  refresh();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
