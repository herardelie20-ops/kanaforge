import './flash-shading-tools.css';

function installShadingTools() {
  if (new URLSearchParams(location.search).get('studio') !== 'flash') return;
  const controls = document.querySelector('.flash-controls');
  if (!controls || controls.querySelector('.flash-shading-tools')) return;
  const anchor = document.querySelector('#flash-export');
  anchor.insertAdjacentHTML('beforebegin', `<section class="flash-shading-tools"><p>04 / REMPLISSAGE & OMBRAGE</p><small id="flash-zone-help">Choisissez « Sélection de zone », puis touchez un espace fermé entre les contours. Les formes ouvertes restent en contour seul.</small><button id="flash-zone-select" type="button">⌖ Sélection de zone</button><div id="flash-fill-tools"><button data-fill="solid">Noir plein</button><button data-fill="dotwork">Dotwork</button><button data-fill="whip">Whip shading</button><button data-fill="soft">Dégradé doux</button><button data-fill="clear">Contour seul</button></div><label>Densité <output id="flash-fill-density-out">70 %</output></label><input id="flash-fill-density" type="range" min="15" max="100" value="70"/></section>`);
  const density = document.querySelector('#flash-fill-density');
  const output = document.querySelector('#flash-fill-density-out');
  const ensureDefinitions = svg => {
    if (svg.querySelector('#kanaforge-dotwork')) return;
    svg.insertAdjacentHTML('afterbegin', `<defs><pattern id="kanaforge-dotwork" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.25" fill="#111"/></pattern><linearGradient id="kanaforge-whip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#111" stop-opacity=".9"/><stop offset=".48" stop-color="#111" stop-opacity=".32"/><stop offset="1" stop-color="#111" stop-opacity="0"/></linearGradient><radialGradient id="kanaforge-soft" cx="50%" cy="42%" r="68%"><stop offset="0" stop-color="#111" stop-opacity=".7"/><stop offset="1" stop-color="#111" stop-opacity=".04"/></radialGradient></defs>`);
  };
  const selectedPaths = () => Array.from(document.querySelectorAll('#flash-preview path.selected'));
  const zoneButton = document.querySelector('#flash-zone-select');
  const isClosed = path => /(?:z|Z)\s*$/.test(path.getAttribute('d') || '');
  const setZoneMode = active => {
    document.querySelector('#flash-preview')?.classList.toggle('zone-selecting', active);
    zoneButton.classList.toggle('active', active);
    zoneButton.textContent = active ? '✓ Touchez une zone fermée' : '⌖ Sélection de zone';
  };
  zoneButton.onclick = () => setZoneMode(!zoneButton.classList.contains('active'));
  document.addEventListener('kanaforge:flash-path-selected', event => {
    if (!zoneButton.classList.contains('active')) return;
    const path = event.detail;
    if (!isClosed(path)) {
      document.querySelector('#flash-line-status').textContent = 'Ce trait est ouvert : choisissez un contour fermé pour exploiter son espace intérieur.';
      return;
    }
    document.querySelector('#flash-line-status').textContent = 'Zone intérieure sélectionnée : choisissez un remplissage ou un ombrage.';
    setZoneMode(false);
  });
  const apply = fill => {
    const svg = document.querySelector('#flash-preview svg');
    const paths = selectedPaths();
    if (!svg || !paths.length) { document.querySelector('#flash-line-status').textContent = 'Activez « Sélection de zone », puis touchez un contour fermé dans l’aperçu.'; return; }
    if (paths.some(path => !isClosed(path))) { document.querySelector('#flash-line-status').textContent = 'Le remplissage utilise seulement les zones délimitées par des contours fermés.'; return; }
    ensureDefinitions(svg);
    const alpha = Number(density.value) / 100;
    const values = { solid: '#101114', dotwork: 'url(#kanaforge-dotwork)', whip: 'url(#kanaforge-whip)', soft: 'url(#kanaforge-soft)', clear: 'none' };
    paths.forEach(path => { path.dataset.fill = fill; path.setAttribute('fill', values[fill]); path.setAttribute('fill-opacity', fill === 'clear' ? '0' : alpha); path.setAttribute('fill-rule', 'evenodd'); });
    document.querySelectorAll('#flash-fill-tools button').forEach(button => button.classList.toggle('active', button.dataset.fill === fill));
    document.querySelector('#flash-line-status').textContent = fill === 'clear' ? 'Contour seul rétabli.' : `${fill === 'solid' ? 'Noir plein' : fill === 'dotwork' ? 'Dotwork' : fill === 'whip' ? 'Whip shading' : 'Dégradé doux'} appliqué · densité réglable.`;
  };
  density.oninput = () => { output.textContent = `${density.value} %`; const alpha = Number(density.value) / 100; selectedPaths().forEach(path => { if (path.dataset.fill && path.dataset.fill !== 'clear') path.setAttribute('fill-opacity', alpha); }); };
  document.querySelector('#flash-fill-tools').onclick = event => { const button = event.target.closest('button[data-fill]'); if (button) apply(button.dataset.fill); };
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(installShadingTools), { once: true });
else setTimeout(installShadingTools);
