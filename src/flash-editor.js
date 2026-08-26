import ImageTracer from 'imagetracerjs';
import './flash-editor.css';

function initFlashEditor() {
  if (new URLSearchParams(location.search).get('studio') !== 'flash') return;
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  workspace.innerHTML = `<section class="flash-editor"><header><div><small>PRÉPARATION DU TRAIT</small><h2>Vectoriser puis calibrer le dessin</h2></div><label class="flash-import">Importer un dessin<input id="flash-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"/></label></header><div class="flash-stage"><div id="flash-preview" aria-label="Aperçu vectorisé du motif"><span>Importez un motif pour afficher ses contours.</span></div><p id="flash-status">Le dessin reste sur cet appareil.</p></div></section><aside class="flash-controls"><p>01 / VECTORISATION</p><label>Seuil de tolérance <output id="flash-threshold-out">145</output></label><input id="flash-threshold" type="range" min="25" max="235" value="145"/><small>Les pixels plus sombres deviennent des contours. Ajustez pour conserver les détails utiles.</small><hr/><p>02 / AIGUILLES</p><div id="needle-presets"><button class="active" data-width="0.25">1RL · 0,25 mm</button><button data-width="0.30">3RL · 0,30 mm</button><button data-width="0.35">5RL · 0,35 mm</button><button data-width="0.40">7RL · 0,40 mm</button><button data-width="0.45">9RL · 0,45 mm</button></div><small>Diamètres indicatifs : vérifiez toujours la fiche du fabricant et votre configuration.</small><hr/><p>03 / TRAIT SÉLECTIONNÉ</p><label>Épaisseur <output id="flash-stroke-out">0,25 mm</output></label><input id="flash-stroke" type="range" min="0.15" max="1.20" step="0.05" value="0.25"/><small id="flash-line-status">Cliquez un contour dans l’aperçu pour régler ce trait individuellement.</small><button class="primary flash-export" id="flash-export" disabled>Exporter le stencil SVG</button></aside>`;
  const $ = selector => document.querySelector(selector), preview = $('#flash-preview');
  let source, selectedPath, svgText = '';
  const updateOutput = () => { $('#flash-threshold-out').textContent = $('#flash-threshold').value; $('#flash-stroke-out').textContent = `${Number($('#flash-stroke').value).toFixed(2).replace('.', ',')} mm`; };
  const selectPath = path => { selectedPath?.classList.remove('selected'); selectedPath = path; selectedPath?.classList.add('selected'); if (path) { const width = Number(path.dataset.width || $('#flash-stroke').value); $('#flash-stroke').value = width; updateOutput(); $('#flash-line-status').textContent = 'Contour sélectionné : son épaisseur est indépendante des autres.'; } };
  const vectorize = () => {
    if (!source) return;
    const max = 900, ratio = Math.min(1, max / Math.max(source.naturalWidth || source.width, source.naturalHeight || source.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round((source.naturalWidth || source.width) * ratio)); canvas.height = Math.max(1, Math.round((source.naturalHeight || source.height) * ratio));
    const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height), threshold = Number($('#flash-threshold').value), pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) { const light = .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2]; const value = light < threshold ? 0 : 255; pixels[i] = pixels[i + 1] = pixels[i + 2] = value; }
    svgText = ImageTracer.imagedataToSVG(imageData, { numberofcolors: 2, colorquantcycles: 1, pathomit: 8, ltres: .55, qtres: .55, rightangleenhance: true, blurradius: 0 });
    preview.innerHTML = svgText; const svg = preview.querySelector('svg'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); svg.querySelectorAll('path').forEach(path => { path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#101114'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round'); path.dataset.width = $('#flash-stroke').value; path.setAttribute('stroke-width', path.dataset.width); path.onclick = () => selectPath(path); });
    $('#flash-status').textContent = `${svg.querySelectorAll('path').length} contours vectorisés · cliquez un trait pour le calibrer.`; $('#flash-export').disabled = false;
  };
  const loadImage = file => { if (!file?.type.startsWith('image/')) return; const reader = new FileReader(); reader.onload = () => { const image = new Image(); image.onload = () => { source = image; vectorize(); }; image.src = reader.result; }; reader.readAsDataURL(file); };
  $('#flash-file').onchange = event => loadImage(event.target.files[0]);
  $('#flash-threshold').oninput = () => { updateOutput(); vectorize(); };
  $('#flash-stroke').oninput = () => { updateOutput(); if (selectedPath) { selectedPath.dataset.width = $('#flash-stroke').value; selectedPath.setAttribute('stroke-width', selectedPath.dataset.width); } };
  $('#needle-presets').onclick = event => { const button = event.target.closest('button'); if (!button) return; document.querySelectorAll('#needle-presets button').forEach(item => item.classList.toggle('active', item === button)); $('#flash-stroke').value = button.dataset.width; updateOutput(); if (selectedPath) { selectedPath.dataset.width = button.dataset.width; selectedPath.setAttribute('stroke-width', button.dataset.width); } };
  $('#flash-export').onclick = () => { const svg = preview.querySelector('svg'); if (!svg) return; const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }), link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'kanaforge-stencil.svg'; link.click(); URL.revokeObjectURL(link.href); };
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', initFlashEditor, { once: true }); else queueMicrotask(initFlashEditor);
