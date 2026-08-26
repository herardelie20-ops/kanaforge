import './client-quotes.css';

function initClientQuotes() {
  if (new URLSearchParams(location.search).get('studio') !== 'clients') return;
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  workspace.innerHTML = `<section class="client-project"><header><div><small>FICHE CLIENT</small><h2>Projet & devis</h2></div><label>Nom du client<input id="client-name" placeholder="Nom et prénom"/></label></header><div class="client-grid"><label>Zone à tatouer<input id="client-zone" placeholder="Avant-bras, dos…"/></label><label>Date souhaitée<input id="client-date" type="date"/></label></div><label>Montant indiqué<input id="client-quote" placeholder="Choisissez un gabarit" readonly/></label><button class="primary" id="client-save">Enregistrer la fiche</button><small id="client-status">Les informations restent sur cet appareil.</small></section><aside class="quote-editor"><p>GABARITS DE DEVIS</p><div id="quote-presets"></div><hr/><label>Nom du gabarit<input id="quote-title"/></label><label>Tarif <input id="quote-price" inputmode="decimal"/></label><label>Acompte <input id="quote-deposit" inputmode="decimal"/></label><label>Durée <input id="quote-duration"/></label><label>Inclus<textarea id="quote-includes"></textarea></label><button class="secondary" id="save-quote-template">Enregistrer ce gabarit</button><button class="primary" id="apply-quote-template">Appliquer au devis client</button><small id="quote-status">Choisissez un gabarit pour le modifier.</small></aside>`;
  const $ = selector => document.querySelector(selector);
  const defaults = [
    { id: 'consultation', title: 'Consultation & placement', price: '50 €', deposit: '0 €', duration: '30 min', includes: 'Étude de zone, échanges sur le motif et simulation de placement.' },
    { id: 'fineline', title: 'Pièce fine — format S', price: '180 €', deposit: '60 €', duration: '1 h 30', includes: 'Préparation du stencil, séance, conseils de soin et une retouche courte.' },
    { id: 'custom', title: 'Projet sur mesure', price: 'À définir', deposit: '30 %', duration: 'Selon projet', includes: 'Recherche, création personnalisée, préparation, séance et suivi après rendez-vous.' }
  ];
  const key = 'kanaforge-quote-templates';
  let templates = [...defaults, ...JSON.parse(localStorage.getItem(key) || '[]')], active = templates[0];
  const fields = ['title', 'price', 'deposit', 'duration', 'includes'];
  const fillEditor = template => { active = template; fields.forEach(field => $(`#quote-${field}`).value = template[field] || ''); document.querySelectorAll('[data-template]').forEach(button => button.classList.toggle('active', button.dataset.template === template.id)); $('#quote-status').textContent = 'Gabarit chargé : adaptez chaque ligne puis appliquez-le au client.'; };
  const renderTemplates = () => { $('#quote-presets').innerHTML = templates.map(template => `<button data-template="${template.id}"><b>${template.title}</b><span>${template.price} · ${template.duration}</span></button>`).join(''); document.querySelectorAll('[data-template]').forEach(button => button.onclick = () => fillEditor(templates.find(template => template.id === button.dataset.template))); };
  const editorTemplate = () => Object.fromEntries(fields.map(field => [field, $(`#quote-${field}`).value.trim()]));
  renderTemplates(); fillEditor(active);
  $('#apply-quote-template').onclick = () => { const template = editorTemplate(); $('#client-quote').value = `${template.title} — ${template.price}`; $('#quote-status').textContent = `Gabarit appliqué : acompte ${template.deposit} · durée ${template.duration}.`; };
  $('#save-quote-template').onclick = () => { const template = { ...editorTemplate(), id: `custom-${Date.now()}` }; if (!template.title) { $('#quote-status').textContent = 'Donnez un nom au gabarit avant de l’enregistrer.'; return; } const customs = JSON.parse(localStorage.getItem(key) || '[]'); customs.unshift(template); localStorage.setItem(key, JSON.stringify(customs.slice(0, 12))); templates = [...defaults, ...customs]; renderTemplates(); fillEditor(template); $('#quote-status').textContent = 'Gabarit personnel enregistré localement.'; };
  $('#client-save').onclick = () => { const name = $('#client-name').value.trim(); if (!name || !$('#client-quote').value) { $('#client-status').textContent = 'Indiquez le client et appliquez un gabarit de devis.'; return; } $('#client-status').textContent = `Fiche de ${name} enregistrée localement.`; };
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', initClientQuotes, { once: true }); else queueMicrotask(initClientQuotes);
