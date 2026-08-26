import './photo-scanner.css';

const imageFile = (canvas, name) => new Promise(resolve => canvas.toBlob(blob => resolve(new File([blob], name, { type: 'image/jpeg' })), 'image/jpeg', .92));

export async function openPhotoScanner({ onCapture, title = 'Scanner un dessin' }) {
  const fallback = () => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment'; input.onchange = () => input.files[0] && onCapture(input.files[0]); input.click(); };
  if (!navigator.mediaDevices?.getUserMedia) { fallback(); return; }
  const dialog = document.createElement('dialog');
  dialog.className = 'kanaforge-photo-scanner';
  dialog.innerHTML = `<header><div><small>PHOTO & SCAN</small><h2>${title}</h2></div><button aria-label="Fermer">×</button></header><div class="scanner-stage"><video autoplay playsinline muted></video><canvas hidden></canvas></div><div class="scanner-settings"><label>Luminosité <input data-filter="brightness" type="range" min="55" max="155" value="100"/></label><label>Contraste <input data-filter="contrast" type="range" min="55" max="190" value="100"/></label><label><input data-filter="grayscale" type="checkbox" checked/> Niveaux de gris</label><button class="primary" data-capture>Prendre la photo</button></div>`;
  document.body.append(dialog); dialog.showModal();
  const video = dialog.querySelector('video'), canvas = dialog.querySelector('canvas');
  let stream;
  const close = () => { stream?.getTracks().forEach(track => track.stop()); dialog.close(); dialog.remove(); };
  dialog.querySelector('header button').onclick = close;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); video.srcObject = stream; }
  catch { close(); fallback(); return; }
  const filter = () => `brightness(${dialog.querySelector('[data-filter="brightness"]').value}%) contrast(${dialog.querySelector('[data-filter="contrast"]').value}%) grayscale(${dialog.querySelector('[data-filter="grayscale"]').checked ? 1 : 0})`;
  dialog.querySelectorAll('[data-filter]').forEach(input => input.oninput = () => { video.style.filter = filter(); }); video.style.filter = filter();
  dialog.querySelector('[data-capture]').onclick = async () => { if (!video.videoWidth) return; canvas.width = video.videoWidth; canvas.height = video.videoHeight; const context = canvas.getContext('2d'); context.filter = filter(); context.drawImage(video, 0, 0); const file = await imageFile(canvas, `scan-kanaforge-${Date.now()}.jpg`); close(); onCapture(file); };
}
