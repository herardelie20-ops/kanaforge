import './communication-ai.css';

function initCommunicationAI() {
  if (new URLSearchParams(location.search).get('studio') !== 'communication') return;
  const agent = document.querySelector('.workspace aside');
  if (!agent) return;
  agent.insertAdjacentHTML('beforeend', `<section class="ai-connection"><small>AGENT IA OPENAI</small><h3>Réponses adaptées au studio</h3><p>Configurez un ton et un serveur IA sécurisé. Chaque réponse reste un brouillon à valider.</p><label>Ton<select id="ai-tone"><option>Chaleureux et professionnel</option><option>Concise et direct</option><option>Pédagogique et rassurant</option></select></label><label>Consignes du studio<textarea id="ai-instructions" placeholder="Ex. Demander la zone, la taille, le style et les disponibilités."></textarea></label><label>Adresse du serveur IA sécurisé<input id="ai-endpoint" type="url" placeholder="https://votre-serveur.example/response"/></label><label class="ai-consent"><input id="ai-consent" type="checkbox"/> J’autorise la préparation d’envoi de brouillons au serveur IA choisi.</label><button id="ai-save-config">Enregistrer la configuration</button><small id="ai-status">Aucune connexion IA configurée.</small></section>`);
  const $ = selector => document.querySelector(selector), key = 'kanaforge-ai-config';
  const config = JSON.parse(localStorage.getItem(key) || 'null');
  if (config) { $('#ai-tone').value = config.tone || $('#ai-tone').value; $('#ai-instructions').value = config.instructions || ''; $('#ai-endpoint').value = config.endpoint || ''; $('#ai-consent').checked = Boolean(config.consent); $('#ai-status').textContent = config.endpoint ? 'Configuration locale enregistrée · connexion à tester dans le serveur IA.' : 'Consignes IA enregistrées localement.'; }
  $('#ai-save-config').onclick = () => { const next = { tone: $('#ai-tone').value, instructions: $('#ai-instructions').value.trim(), endpoint: $('#ai-endpoint').value.trim(), consent: $('#ai-consent').checked }; if (next.endpoint && !next.consent) { $('#ai-status').textContent = 'Cochez votre autorisation avant de préparer cette connexion.'; return; } localStorage.setItem(key, JSON.stringify(next)); $('#ai-status').textContent = next.endpoint ? 'Configuration enregistrée. Le serveur doit garder la clé OpenAI côté serveur.' : 'Consignes enregistrées. Ajoutez un serveur sécurisé pour activer l’IA.'; };
  const prepare = agent.querySelector('.primary');
  if (prepare) prepare.onclick = () => { const saved = JSON.parse(localStorage.getItem(key) || 'null'); const textarea = document.querySelector('.inbox textarea'); if (!saved?.endpoint || !saved.consent) { $('#ai-status').textContent = 'Configurez un serveur IA sécurisé et votre autorisation avant la génération.'; return; } $('#ai-status').textContent = 'Prêt à générer : le serveur IA sera appelé uniquement après la validation explicite de la réponse.'; textarea.focus(); };
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', initCommunicationAI, { once: true }); else queueMicrotask(initCommunicationAI);
