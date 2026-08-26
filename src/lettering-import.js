import './lettering-import.css';
import { openPhotoScanner } from './photo-scanner.js';

function installLetterImport() {
  if (new URLSearchParams(location.search).get('studio') !== 'lettering') return;
  const canvas = document.querySelector('#glyph-canvas');
  const zone = canvas?.closest('.drawing-zone');
  if (!canvas || !zone || zone.querySelector('.letter-import')) return;

  zone.insertAdjacentHTML('afterbegin', `<div class="letter-import"><div class="letter-acquire"><label class="letter-import-file">Importer un dessin de lettre<input id="letter-image-import" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"/></label><button id="letter-camera" type="button">◉ Photo / scan</button></div><span>ou glissez-déposez une image dans la zone de dessin</span><label>Seuil noir <output id="letter-vector-threshold-out">185</output><input id="letter-vector-threshold" type="range" min="40" max="250" value="185"/></label><button id="letter-vectorize" type="button">Vectoriser et préparer la lettre</button></div>`);

  const input = document.querySelector('#letter-image-import');
  const threshold = document.querySelector('#letter-vector-threshold');
  const thresholdOut = document.querySelector('#letter-vector-threshold-out');
  const save = document.querySelector('#glyph-save');
  const select = document.querySelector('#glyph-character');
  let source;
  const setSaveCopy = () => { save.textContent = `Associer ce dessin à « ${select.value} »`; };
  const drawPrepared = () => {
    if (!source) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const temporary = document.createElement('canvas');
    temporary.width = canvas.width; temporary.height = canvas.height;
    const tc = temporary.getContext('2d', { willReadFrequently: true });
    tc.fillStyle = '#fbf6ed'; tc.fillRect(0, 0, temporary.width, temporary.height);
    const scale = Math.min(temporary.width / source.width, temporary.height / source.height) * .88;
    const width = source.width * scale, height = source.height * scale;
    tc.drawImage(source, (temporary.width - width) / 2, (temporary.height - height) / 2, width, height);
    const pixels = tc.getImageData(0, 0, temporary.width, temporary.height);
    const level = Number(threshold.value);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const luminance = .2126 * pixels.data[i] + .7152 * pixels.data[i + 1] + .0722 * pixels.data[i + 2];
      const ink = luminance < level;
      pixels.data[i] = ink ? 20 : 251;
      pixels.data[i + 1] = ink ? 18 : 246;
      pixels.data[i + 2] = ink ? 27 : 237;
      pixels.data[i + 3] = 255;
    }
    tc.putImageData(pixels, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(temporary, 0, 0);
    document.querySelector('#composition-note').textContent = `Dessin préparé pour la lettre ${select.value} : ajustez le seuil ou complétez-le au stylet, puis associez-le.`;
  };
  const load = file => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => { const image = new Image(); image.onload = () => { source = image; drawPrepared(); }; image.src = reader.result; };
    reader.readAsDataURL(file);
  };
  input.addEventListener('change', event => load(event.target.files[0]));
  document.querySelector('#letter-camera').addEventListener('click', () => openPhotoScanner({ title: 'Photographier ou scanner une lettre', onCapture: load }));
  threshold.addEventListener('input', () => { thresholdOut.textContent = threshold.value; drawPrepared(); });
  document.querySelector('#letter-vectorize').addEventListener('click', drawPrepared);
  canvas.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('letter-drop-active'); });
  canvas.addEventListener('dragleave', () => zone.classList.remove('letter-drop-active'));
  canvas.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('letter-drop-active'); load(event.dataTransfer.files[0]); });
  select.addEventListener('change', setSaveCopy);
  document.querySelector('#glyph-grid').addEventListener('click', () => setTimeout(setSaveCopy));
  setSaveCopy();
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(installLetterImport), { once: true });
else setTimeout(installLetterImport);
