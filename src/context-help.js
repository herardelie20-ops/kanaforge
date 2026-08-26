import './context-help.css';

const help = {
  'flash-camera': 'Ouvre la caméra de la tablette pour photographier ou scanner un dessin.',
  'flash-file': 'Importe une image depuis l’appareil pour la préparer et la vectoriser.',
  'flash-auto': 'Analyse l’image et règle automatiquement les niveaux noir, gris et blanc.',
  'flash-export': 'Exporte le stencil vectoriel une fois le dessin préparé.',
  'flash-zone-select': 'Permet de sélectionner l’intérieur d’un contour fermé pour le remplir ou l’ombrer.',
  'letter-camera': 'Ouvre la caméra pour photographier une lettre et l’associer à l’alphabet.',
  'letter-image-import': 'Importe une image de lettre depuis l’appareil.',
  'letter-vectorize': 'Nettoie le dessin importé avec le seuil noir avant de l’éditer.',
  'glyph-save': 'Enregistre le dessin actuel dans la lettre sélectionnée.',
  'glyph-clear': 'Efface le tracé de la lettre en cours.',
  'glyph-undo': 'Annule le dernier trait dessiné.',
  'composition-download': 'Télécharge la composition comme stencil PNG.',
  'avatar-tattoo-file': 'Importe un motif à apposer sur le mannequin 3D.',
  'avatar-orbit-toggle': 'Bascule entre l’orientation libre du mannequin et le placement du motif.',
  'avatar-skin-texture': 'Importe une texture personnelle pour habiller visuellement la peau du mannequin.',
  'save-placement-preview': 'Ajoute l’aperçu de placement à la bibliothèque personnelle.',
  'record-placement-video': 'Enregistre jusqu’à 30 secondes de l’aperçu 3D, y compris vos mouvements de caméra.',
  'stop-placement-video': 'Arrête l’enregistrement et ouvre l’export de la vidéo.',
  'open-motif-library': 'Ouvre les motifs précédemment importés dans KanaForge.',
  'kanaforge-files-button': 'Ouvre les fichiers créés dans les autres laboratoires KanaForge.'
};

function installContextHelp() {
  const header = document.querySelector('main>header');
  if (!header || document.querySelector('#kanaforge-help-toggle')) return;
  header.insertAdjacentHTML('beforeend', '<button id="kanaforge-help-toggle" type="button" aria-pressed="false">? Aide</button><div id="kanaforge-help-bubble" role="status" hidden></div>');
  const toggle = document.querySelector('#kanaforge-help-toggle'), bubble = document.querySelector('#kanaforge-help-bubble');
  let enabled = false;
  const description = target => target.dataset.help || help[target.id] || target.title || (target.matches('input[type="range"]') ? `Ajuste ${target.closest('label')?.textContent?.replace(/\s+/g, ' ').trim() || 'ce réglage'}.` : target.matches('label') ? `Utilisez « ${target.textContent.trim().replace(/\s+/g, ' ')} » pour choisir un fichier ou modifier ce réglage.` : target.matches('button') ? `Action : ${target.textContent.trim().replace(/\s+/g, ' ')}.` : 'Utilisez ce contrôle pour ajuster votre création.');
  const show = target => { if (!enabled || !target || target.id === 'kanaforge-help-toggle') return; const rect = target.getBoundingClientRect(); bubble.textContent = description(target); bubble.hidden = false; bubble.style.left = `${Math.min(window.innerWidth - 290, Math.max(12, rect.left + rect.width / 2 - 130))}px`; bubble.style.top = `${Math.min(window.innerHeight - 86, Math.max(12, rect.bottom + 10))}px`; };
  const hide = () => { bubble.hidden = true; };
  toggle.onclick = () => { enabled = !enabled; toggle.classList.toggle('active', enabled); toggle.setAttribute('aria-pressed', String(enabled)); toggle.textContent = enabled ? '✓ Aide active' : '? Aide'; hide(); };
  document.addEventListener('pointerover', event => show(event.target.closest('button,label,input,select,textarea')));
  document.addEventListener('focusin', event => show(event.target.closest('button,label,input,select,textarea')));
  document.addEventListener('pointerout', hide);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && enabled) { enabled = false; toggle.classList.remove('active'); toggle.setAttribute('aria-pressed', 'false'); toggle.textContent = '? Aide'; hide(); } });
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', installContextHelp, { once: true });
else queueMicrotask(installContextHelp);
