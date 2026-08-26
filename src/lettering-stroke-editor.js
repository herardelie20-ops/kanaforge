import './lettering-stroke-editor.css';

const distanceToSegment = (point, start, end) => {
  const dx = end.x - start.x, dy = end.y - start.y;
  const divisor = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / divisor));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
};

function installStrokeEditor() {
  if (new URLSearchParams(location.search).get('studio') !== 'lettering') return;
  const canvas = document.querySelector('#glyph-canvas');
  const zone = canvas?.closest('.drawing-zone');
  if (!canvas || !zone || zone.querySelector('.stroke-editor')) return;
  zone.insertAdjacentHTML('beforeend', `<section class="stroke-editor"><div><b>ÉDITION DES TRAITS</b><button id="stroke-select-mode" type="button" aria-pressed="false">Sélectionner un trait</button></div><p id="stroke-editor-status">Dessinez un trait, puis sélectionnez-le pour en changer le calibre.</p><div id="needle-size-presets"><button data-width="2">1RL · 0,25 mm</button><button data-width="4">3RL · 0,30 mm</button><button data-width="6">5RL · 0,35 mm</button><button data-width="8">7RL · 0,35 mm</button><button data-width="10">9RL · 0,40 mm</button></div></section>`);
  const context = canvas.getContext('2d'), select = document.querySelector('#glyph-character'), weight = document.querySelector('#glyph-weight');
  const storageKey = 'kanaforge-alphabet-strokes', basesKey = 'kanaforge-alphabet-stroke-bases';
  let all = JSON.parse(localStorage.getItem(storageKey) || '{}'), bases = JSON.parse(localStorage.getItem(basesKey) || '{}'), mode = 'draw', selected = -1, recording;
  const active = () => select.value;
  const point = event => { const box = canvas.getBoundingClientRect(); return { x: (event.clientX - box.left) * canvas.width / box.width, y: (event.clientY - box.top) * canvas.height / box.height }; };
  const persist = () => { localStorage.setItem(storageKey, JSON.stringify(all)); localStorage.setItem(basesKey, JSON.stringify(bases)); };
  const status = text => { document.querySelector('#stroke-editor-status').textContent = text; };
  const drawStroke = (stroke, highlighted = false) => { if (stroke.points.length < 2) return; context.save(); context.lineCap = 'round'; context.lineJoin = 'round'; context.strokeStyle = highlighted ? '#cb4d6c' : '#14121b'; context.lineWidth = stroke.width; context.beginPath(); context.moveTo(stroke.points[0].x, stroke.points[0].y); stroke.points.slice(1).forEach(item => context.lineTo(item.x, item.y)); context.stroke(); context.restore(); };
  const render = () => { const strokes = all[active()] || []; const image = new Image(); image.onload = () => { context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0); strokes.forEach((stroke, index) => drawStroke(stroke, index === selected)); }; image.src = bases[active()] || canvas.toDataURL('image/png'); };
  const setMode = next => { mode = next; selected = -1; const button = document.querySelector('#stroke-select-mode'); const selecting = mode === 'select'; button.classList.toggle('active', selecting); button.setAttribute('aria-pressed', String(selecting)); button.textContent = selecting ? 'Dessiner des traits' : 'Sélectionner un trait'; canvas.classList.toggle('stroke-selecting', selecting); status(selecting ? 'Touchez un trait créé dans ce labo pour le sélectionner.' : 'Mode dessin : chaque nouveau trait pourra être calibré séparément.'); };
  canvas.addEventListener('pointerdown', event => {
    if (mode === 'select') {
      event.stopImmediatePropagation(); event.preventDefault();
      const p = point(event), strokes = all[active()] || [];
      let closest = Infinity, index = -1;
      strokes.forEach((stroke, strokeIndex) => stroke.points.slice(1).forEach((end, pointIndex) => { const distance = distanceToSegment(p, stroke.points[pointIndex], end); if (distance < closest) { closest = distance; index = strokeIndex; } }));
      selected = closest < 28 ? index : -1;
      if (selected >= 0) { weight.value = strokes[selected].width; status(`Trait sélectionné · ${strokes[selected].width}px. Choisissez un calibre d’aiguille.`); } else status('Aucun trait éditable à cet endroit. Les images importées restent modifiables au seuil puis au stylet.');
      render();
      return;
    }
    if (!bases[active()]) bases[active()] = canvas.toDataURL('image/png');
    recording = { width: Number(weight.value), points: [point(event)] };
  }, true);
  canvas.addEventListener('pointermove', event => { if (mode === 'draw' && recording) recording.points.push(point(event)); }, true);
  const finish = () => { if (mode !== 'draw' || !recording) return; if (recording.points.length > 1) { (all[active()] ||= []).push(recording); persist(); } recording = null; };
  canvas.addEventListener('pointerup', finish, true); canvas.addEventListener('pointercancel', finish, true);
  document.querySelector('#stroke-select-mode').onclick = () => setMode(mode === 'select' ? 'draw' : 'select');
  document.querySelector('#needle-size-presets').onclick = event => { const button = event.target.closest('button[data-width]'); if (!button || selected < 0) return; const stroke = (all[active()] || [])[selected]; if (!stroke) return; stroke.width = Number(button.dataset.width); weight.value = button.dataset.width; persist(); render(); document.querySelectorAll('#needle-size-presets button').forEach(item => item.classList.toggle('active', item === button)); status(`Trait sélectionné · calibre ${button.textContent}.`); };
  select.addEventListener('change', () => { selected = -1; setTimeout(() => status('Lettre changée : dessinez ou sélectionnez un trait à éditer.')); });
  document.querySelector('#glyph-grid').addEventListener('click', () => { selected = -1; });
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(installStrokeEditor), { once: true });
else setTimeout(installStrokeEditor);
