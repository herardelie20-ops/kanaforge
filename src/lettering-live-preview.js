import './lettering-live-preview.css';

function installLivePreview() {
  if (new URLSearchParams(location.search).get('studio') !== 'lettering') return;
  const panel = document.querySelector('.composition-lab'), canvas = document.querySelector('#composition-canvas'), note = document.querySelector('#composition-note');
  if (!panel || !canvas || panel.querySelector('.live-preview-import')) return;
  panel.querySelector('p')?.replaceWith(Object.assign(document.createElement('p'), { textContent: 'APERÇU LIVE' }));
  const title = panel.querySelector('h2'); if (title) title.textContent = 'Prévisualiser avant l’export';
  canvas.insertAdjacentHTML('beforebegin', `<div class="live-preview-import"><label>Importer un fichier à prévisualiser<input id="lettering-live-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"/><span>Choisir une image</span></label><button id="lettering-live-reset" type="button" hidden>Revenir à la composition</button></div>`);
  const input = document.querySelector('#lettering-live-file'), reset = document.querySelector('#lettering-live-reset'), context = canvas.getContext('2d', { willReadFrequently: true });
  let previewImage = null, previewName = '';
  const renderImported = () => {
    if (!previewImage) return;
    context.fillStyle = '#fbf6ed'; context.fillRect(0, 0, canvas.width, canvas.height);
    const ratio = Math.min((canvas.width * .9) / previewImage.width, (canvas.height * .78) / previewImage.height), width = previewImage.width * ratio, height = previewImage.height * ratio;
    context.drawImage(previewImage, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    note.textContent = `Aperçu du fichier « ${previewName} » · ce rendu sera utilisé pour l’export PNG.`;
  };
  input.addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; const url = URL.createObjectURL(file), image = new Image(); image.onload = () => { previewImage = image; previewName = file.name; renderImported(); reset.hidden = false; URL.revokeObjectURL(url); }; image.onerror = () => { note.textContent = 'Ce fichier ne peut pas être prévisualisé.'; URL.revokeObjectURL(url); }; image.src = url; });
  reset.onclick = () => { previewImage = null; previewName = ''; input.value = ''; reset.hidden = true; document.querySelector('#composition-text')?.dispatchEvent(new Event('input', { bubbles: true })); };
  ['composition-text', 'composition-spacing', 'glyph-character'].forEach(id => document.querySelector(`#${id}`)?.addEventListener('input', () => setTimeout(renderImported)));
  document.querySelector('#glyph-character')?.addEventListener('change', () => setTimeout(renderImported));
  document.querySelector('#glyph-grid')?.addEventListener('click', () => setTimeout(renderImported));
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(installLivePreview), { once: true }); else setTimeout(installLivePreview);
