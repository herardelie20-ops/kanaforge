import './lettering-destinations.css';

function installDestinations() {
  if (new URLSearchParams(location.search).get('studio') !== 'lettering') return;
  const panel = document.querySelector('.composition-lab');
  if (!panel || panel.querySelector('.composition-destinations')) return;
  panel.insertAdjacentHTML('beforeend', `<section class="composition-destinations"><p>ENVOYER LA COMPOSITION</p><small>Conservez ce rendu dans un autre espace du studio.</small><div><button data-destination="object">Labo objet 3D</button><button data-destination="placement">Placement 3D</button><button data-destination="book">Book & galerie</button><button data-destination="communication">Communication</button></div><span id="composition-destination-status"></span></section>`);
  const save = destination => {
    const canvas = document.querySelector('#composition-canvas');
    const image = canvas.toDataURL('image/png');
    const title = (document.querySelector('#composition-text').value || 'Lettrage KanaForge').trim();
    const entry = { id: Date.now(), name: title, image, createdAt: new Date().toLocaleString('fr-FR') };
    if (destination === 'object') {
      localStorage.setItem('kanaforge-pending-drawing', JSON.stringify(entry));
      location.href = './index.html';
    }
    if (destination === 'placement') {
      const key = 'kanaforge-motif-library', entries = JSON.parse(localStorage.getItem(key) || '[]').filter(item => item.name !== entry.name);
      entries.unshift(entry); localStorage.setItem(key, JSON.stringify(entries.slice(0, 12))); location.href = './studio.html?studio=placement';
    }
    if (destination === 'book') {
      const key = 'kanaforge-book-folders', folders = JSON.parse(localStorage.getItem(key) || 'null') || [{ id: 'lettering', name: 'Lettrage personnel', images: [] }];
      let folder = folders.find(item => item.id === 'lettering'); if (!folder) { folder = { id: 'lettering', name: 'Lettrage personnel', images: [] }; folders.push(folder); }
      folder.images.push(entry); localStorage.setItem(key, JSON.stringify(folders)); location.href = './studio.html?studio=portfolio';
    }
    if (destination === 'communication') {
      const key = 'kanaforge-placement-library', entries = JSON.parse(localStorage.getItem(key) || '[]');
      entries.unshift(entry); localStorage.setItem(key, JSON.stringify(entries.slice(0, 8))); location.href = './studio.html?studio=communication';
    }
  };
  panel.querySelector('.composition-destinations').onclick = event => { const button = event.target.closest('button[data-destination]'); if (button) save(button.dataset.destination); };
}
if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(installDestinations), { once: true }); else setTimeout(installDestinations);
