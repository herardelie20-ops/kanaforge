import './digital-painting.css';
import { installElectronLiquidBackground } from './home-electron-background.js';

const palette = {
  noir: ['#05070b', '#66727c', '#f5f7ff'],
  encre: ['#071023', '#42114f', '#f6c4b8'],
  lagon: ['#03151a', '#053e56', '#d5f0e7'],
  braise: ['#17090b', '#6b1e11', '#f5d36f']
};

function initDigitalPainting() {
  if (new URLSearchParams(location.search).get('studio') !== 'painting') return;
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  workspace.innerHTML = `<section class="digital-painting paint-intro-active"><header><div><small>LIQUID IMAGE LAB</small><h2>Peinture, matière & liquéfaction</h2></div><div class="paint-header-actions"><button id="paint-fullscreen" type="button">⛶ Plein écran</button><label class="paint-import">Importer une image<input id="paint-file" type="file" accept="image/png,image/jpeg,image/webp"/></label></div></header><div class="paint-toolbar" role="toolbar" aria-label="Outils de peinture"><button class="active" data-paint-tool="stretch">Étirer</button><button data-paint-tool="swirl">Tourbillon</button><button data-paint-tool="contrast">Contraste</button><button data-paint-tool="black">Pinceau noir</button><button data-paint-tool="smooth">Lisser</button><button id="paint-auto" type="button">Auto flow</button></div><div class="paint-canvas-wrap"><canvas id="paint-canvas" width="1000" height="640" aria-label="Toile de peinture numérique"></canvas><span class="paint-cursor" aria-hidden="true"></span><section class="paint-intro" aria-label="Écran d’accueil de l’atelier"><div><small>ÉLECTRON / VEILLE ACTIVE</small><h3>La matière attend votre geste.</h3><p>Entrez dans l’atelier pour révéler la toile de peinture numérique.</p><button id="paint-start" type="button">Commencer</button></div></section></div><p id="paint-status">Animation Electron active · appuyez sur Commencer pour ouvrir l’atelier.</p></section><aside class="paint-controls"><p>RÉGLAGES DU PINCEAU</p><label>Taille <output id="paint-size-out">120 px</output></label><input id="paint-size" type="range" min="24" max="320" value="120"/><label>Pression <output id="paint-pressure-out">52 %</output></label><input id="paint-pressure" type="range" min="10" max="100" value="52"/><label>Grain <output id="paint-grain-out">16 %</output></label><input id="paint-grain" type="range" min="0" max="45" value="16"/><hr/><p>PALETTE SÉRIGRAPHIQUE</p><div class="paint-palettes" id="paint-palettes"><button class="active" data-paint-palette="noir">Noir & blanc</button><button data-paint-palette="encre">Encre</button><button data-paint-palette="lagon">Lagon</button><button data-paint-palette="braise">Braise</button></div><hr/><div class="paint-actions"><button id="paint-undo" type="button">↶ Annuler</button><button id="paint-reset" type="button">Réinitialiser</button><button id="paint-export" class="primary" type="button">Exporter le PNG</button></div><small>Le travail et l’historique restent sur cet appareil pendant la session.</small></aside>`;

  const $ = selector => workspace.querySelector(selector);
  const painting = $('.digital-painting');
  installElectronLiquidBackground($('.paint-intro'), 'electron-paint-intro-background');
  const canvas = $('#paint-canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
  const scratch = document.createElement('canvas'), scratchCtx = scratch.getContext('2d');
  scratch.width = canvas.width; scratch.height = canvas.height;
  const cursor = $('.paint-cursor');
  let tool = 'stretch', selectedPalette = 'noir', drawing = false, previous = null, autoTimer = null;
  const history = [];
  const settings = () => ({ size: Number($('#paint-size').value), pressure: Number($('#paint-pressure').value) / 100, grain: Number($('#paint-grain').value) / 100 });
  const fullscreenButton = $('#paint-fullscreen');
  const syncFullscreen = () => { const open = document.fullscreenElement === workspace.querySelector('.digital-painting'); fullscreenButton.textContent = open ? '↙ Quitter le plein écran' : '⛶ Plein écran'; fullscreenButton.setAttribute('aria-pressed', String(open)); };
  fullscreenButton.onclick = () => document.fullscreenElement ? document.exitFullscreen?.() : workspace.querySelector('.digital-painting').requestFullscreen?.();
  document.addEventListener('fullscreenchange', syncFullscreen);
  syncFullscreen();
  $('#paint-start').onclick = () => { painting.classList.remove('paint-intro-active'); $('.paint-intro')?.remove(); $('#paint-status').textContent = 'Atelier ouvert · faites glisser le pinceau sur la toile.'; };
  const commit = () => { history.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); if (history.length > 18) history.shift(); $('#paint-undo').disabled = history.length < 2; };
  const restore = image => { ctx.putImageData(image, 0, 0); };
  const makeClouds = () => {
    const [dark, middle, light] = palette[selectedPalette];
    const base = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); base.addColorStop(0, dark); base.addColorStop(.5, middle); base.addColorStop(1, dark); ctx.fillStyle = base; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 28; i++) { const gradient = ctx.createRadialGradient(canvas.width * (.05 + (i * .173) % .9), canvas.height * (.1 + (i * .287) % .8), 4, canvas.width * (.05 + (i * .173) % .9), canvas.height * (.1 + (i * .287) % .8), 80 + (i % 7) * 45); gradient.addColorStop(0, `${light}cc`); gradient.addColorStop(.35, `${middle}80`); gradient.addColorStop(1, `${dark}00`); ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    applyGrain(); history.length = 0; commit(); $('#paint-status').textContent = 'Matière générée localement · aucun fichier n’est envoyé.';
  };
  const applyGrain = () => { const amount = settings().grain; if (!amount) return; const image = ctx.getImageData(0, 0, canvas.width, canvas.height), pixels = image.data; for (let i = 0; i < pixels.length; i += 4) { const noise = (Math.random() - .5) * 64 * amount; pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise)); pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise)); pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise)); } ctx.putImageData(image, 0, 0); };
  const point = event => { const box = canvas.getBoundingClientRect(); return { x: (event.clientX - box.left) * canvas.width / box.width, y: (event.clientY - box.top) * canvas.height / box.height }; };
  const showCursor = event => { const box = canvas.getBoundingClientRect(), size = settings().size * box.width / canvas.width; cursor.style.width = cursor.style.height = `${size}px`; cursor.style.transform = `translate(${event.clientX - box.left - size / 2}px,${event.clientY - box.top - size / 2}px)`; cursor.hidden = false; };
  const affectPixels = (x, y, mode) => { const { size, pressure } = settings(), radius = Math.round(size / 2), left = Math.max(0, Math.round(x - radius)), top = Math.max(0, Math.round(y - radius)), width = Math.min(canvas.width - left, radius * 2), height = Math.min(canvas.height - top, radius * 2), image = ctx.getImageData(left, top, width, height), data = image.data; for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) { const distance = Math.hypot(px + left - x, py + top - y) / radius; if (distance > 1) continue; const weight = (1 - distance) * pressure, index = (py * width + px) * 4; if (mode === 'contrast') { for (let channel = 0; channel < 3; channel++) data[index + channel] = Math.max(0, Math.min(255, (data[index + channel] - 128) * (1 + weight * 1.8) + 128)); } else { data[index] *= 1 - weight * .9; data[index + 1] *= 1 - weight * .9; data[index + 2] *= 1 - weight * .9; } } ctx.putImageData(image, left, top); };
  const stroke = (current, last) => { const { size, pressure } = settings(), dx = current.x - last.x, dy = current.y - last.y, radius = size / 2; scratchCtx.clearRect(0, 0, scratch.width, scratch.height); scratchCtx.drawImage(canvas, 0, 0); if (tool === 'contrast' || tool === 'black') { affectPixels(current.x, current.y, tool); return; } ctx.save(); ctx.beginPath(); ctx.arc(current.x, current.y, radius, 0, Math.PI * 2); ctx.clip(); ctx.globalAlpha = Math.min(.72, .18 + pressure * .48); if (tool === 'swirl') { ctx.translate(current.x, current.y); ctx.rotate(Math.max(-.22, Math.min(.22, (dx - dy) * .012))); ctx.translate(-current.x, -current.y); ctx.drawImage(scratch, 0, 0); } else if (tool === 'smooth') { ctx.filter = 'blur(7px)'; ctx.drawImage(scratch, 0, 0); } else ctx.drawImage(scratch, Math.max(-34, Math.min(34, dx * 1.5)), Math.max(-34, Math.min(34, dy * 1.5))); ctx.restore(); };
  const stopAuto = () => { if (!autoTimer) return; clearInterval(autoTimer); autoTimer = null; $('#paint-auto').classList.remove('active'); $('#paint-auto').textContent = 'Auto flow'; commit(); $('#paint-status').textContent = 'Auto flow arrêté · une étape a été ajoutée à l’historique.'; };
  canvas.addEventListener('pointerdown', event => { stopAuto(); drawing = true; canvas.setPointerCapture(event.pointerId); previous = point(event); });
  canvas.addEventListener('pointermove', event => { showCursor(event); if (!drawing || !previous) return; const current = point(event); stroke(current, previous); previous = current; });
  canvas.addEventListener('pointerup', () => { if (!drawing) return; drawing = false; previous = null; applyGrain(); commit(); $('#paint-status').textContent = 'Geste ajouté à l’historique local.'; });
  canvas.addEventListener('pointerleave', () => { cursor.hidden = true; });
  workspace.querySelector('.paint-toolbar').addEventListener('click', event => { const button = event.target.closest('[data-paint-tool]'); if (!button) return; tool = button.dataset.paintTool; workspace.querySelectorAll('[data-paint-tool]').forEach(item => item.classList.toggle('active', item === button)); $('#paint-status').textContent = `${button.textContent} sélectionné · faites glisser sur la toile.`; });
  $('#paint-size').oninput = () => $('#paint-size-out').textContent = `${$('#paint-size').value} px`;
  $('#paint-pressure').oninput = () => $('#paint-pressure-out').textContent = `${$('#paint-pressure').value} %`;
  $('#paint-grain').oninput = () => $('#paint-grain-out').textContent = `${$('#paint-grain').value} %`;
  $('#paint-palettes').onclick = event => { const button = event.target.closest('[data-paint-palette]'); if (!button) return; selectedPalette = button.dataset.paintPalette; workspace.querySelectorAll('[data-paint-palette]').forEach(item => item.classList.toggle('active', item === button)); makeClouds(); };
  $('#paint-undo').onclick = () => { if (history.length < 2) return; history.pop(); restore(history[history.length - 1]); $('#paint-undo').disabled = history.length < 2; $('#paint-status').textContent = 'Dernière étape annulée.'; };
  $('#paint-reset').onclick = makeClouds;
  $('#paint-auto').onclick = () => { if (autoTimer) { stopAuto(); return; } const { size } = settings(); let angle = 0; $('#paint-auto').classList.add('active'); $('#paint-auto').textContent = 'Arrêter le flow'; $('#paint-status').textContent = 'Auto flow en cours · une matière procédurale est peinte localement.'; autoTimer = setInterval(() => { const center = { x: canvas.width / 2 + Math.cos(angle * 1.9) * canvas.width * .22, y: canvas.height / 2 + Math.sin(angle * 1.3) * canvas.height * .2 }; const last = { x: center.x - Math.cos(angle) * size * .18, y: center.y - Math.sin(angle) * size * .18 }; const originalTool = tool; tool = 'swirl'; stroke(center, last); tool = originalTool; angle += .16; }, 70); };
  $('#paint-export').onclick = () => { const link = document.createElement('a'); link.download = 'kanaforge-peinture-numerique.png'; link.href = canvas.toDataURL('image/png'); link.click(); $('#paint-status').textContent = 'PNG préparé pour le téléchargement.'; };
  $('#paint-file').onchange = event => { const file = event.target.files?.[0]; if (!file) return; const image = new Image(); image.onload = () => { const ratio = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight); ctx.fillStyle = '#05070b'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, (canvas.width - image.naturalWidth * ratio) / 2, (canvas.height - image.naturalHeight * ratio) / 2, image.naturalWidth * ratio, image.naturalHeight * ratio); history.length = 0; commit(); $('#paint-status').textContent = `${file.name} importé localement · choisissez un outil et peignez.`; }; image.src = URL.createObjectURL(file); };
  makeClouds();
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', initDigitalPainting, { once: true });
else queueMicrotask(initDigitalPainting);
