import './communication-ai.css';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

function initCommunicationAI() {
  if (new URLSearchParams(location.search).get('studio') !== 'communication') return;
  const agent = document.querySelector('.workspace aside');
  if (!agent) return;
  agent.insertAdjacentHTML('beforeend', `<section class="ai-connection"><small>AGENT IA OPENAI</small><h3>Réponses adaptées au studio</h3><p>Configurez un ton et un serveur IA sécurisé. Chaque réponse reste un brouillon à valider.</p><a class="ai-help-link" href="https://developers.openai.com/api/docs/quickstart" target="_blank" rel="noopener noreferrer">? Besoin d’aide avec l’IA ?</a><label>Ton<select id="ai-tone"><option>Chaleureux et professionnel</option><option>Concise et direct</option><option>Pédagogique et rassurant</option></select></label><label>Consignes du studio<textarea id="ai-instructions" placeholder="Ex. Demander la zone, la taille, le style et les disponibilités."></textarea></label><label>Adresse du serveur IA sécurisé<input id="ai-endpoint" type="url" placeholder="https://votre-serveur.example/response"/></label><label class="ai-consent"><input id="ai-consent" type="checkbox"/> J’autorise la préparation d’envoi de brouillons au serveur IA choisi.</label><button id="ai-save-config">Enregistrer la configuration</button><small id="ai-status">Aucune connexion IA configurée.</small></section>`);
  const $ = selector => document.querySelector(selector), key = 'kanaforge-ai-config';
  const config = JSON.parse(localStorage.getItem(key) || 'null');
  if (config) { $('#ai-tone').value = config.tone || $('#ai-tone').value; $('#ai-instructions').value = config.instructions || ''; $('#ai-endpoint').value = config.endpoint || ''; $('#ai-consent').checked = Boolean(config.consent); $('#ai-status').textContent = config.endpoint ? 'Configuration locale enregistrée · connexion à tester dans le serveur IA.' : 'Consignes IA enregistrées localement.'; }
  $('#ai-save-config').onclick = () => { const next = { tone: $('#ai-tone').value, instructions: $('#ai-instructions').value.trim(), endpoint: $('#ai-endpoint').value.trim(), consent: $('#ai-consent').checked }; if (next.endpoint && !next.consent) { $('#ai-status').textContent = 'Cochez votre autorisation avant de préparer cette connexion.'; return; } localStorage.setItem(key, JSON.stringify(next)); $('#ai-status').textContent = next.endpoint ? 'Configuration enregistrée. Le serveur doit garder la clé OpenAI côté serveur.' : 'Consignes enregistrées. Ajoutez un serveur sécurisé pour activer l’IA.'; };
  const websiteKey = 'kanaforge-website-url';
  const tattooWebsiteUrl = new URL('./', window.location.href).href;
  const savedWebsite = localStorage.getItem(websiteKey) || tattooWebsiteUrl;
  agent.insertAdjacentHTML('beforeend', `<section class="website-connection"><small>SITE WEB PUBLIC · SÉPARÉ DU STUDIO</small><h3>Votre vitrine en ligne</h3><p>Le site public de tatouage est proposé ci-dessous. Le Studio KanaForge reste une application distincte, réservée à votre espace de travail.</p><label>Adresse du site<input id="website-url" type="url" inputmode="url" autocomplete="url" placeholder="https://votre-site.fr"/></label><div class="website-actions"><button id="website-open" type="button">Ouvrir le site</button><button id="website-copy" type="button">Copier le lien</button></div><button id="website-save" class="website-save" type="button">Enregistrer ce site</button><small id="website-status">Site public de tatouage KanaForge prêt à être partagé.</small></section>`);
  const websiteInput = $('#website-url'), websiteStatus = $('#website-status');
  websiteInput.value = savedWebsite;
  const getWebsiteUrl = () => { try { const value = websiteInput.value.trim(); if (!value) return null; const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); return /^https?:$/.test(url.protocol) ? url.href : null; } catch { return null; } };
  const saveWebsite = () => { const url = getWebsiteUrl(); if (!url) { websiteStatus.textContent = 'Indiquez une adresse web valide, commençant par https://.'; return null; } websiteInput.value = url; localStorage.setItem(websiteKey, url); websiteStatus.textContent = 'Lien du site enregistré sur cet appareil.'; return url; };
  $('#website-save').onclick = saveWebsite;
  $('#website-open').onclick = async () => { const url = saveWebsite(); if (!url) return; if (Capacitor.isNativePlatform()) { await Browser.open({ url }); return; } window.open(url, '_blank', 'noopener,noreferrer'); };
  $('#website-copy').onclick = async () => { const url = saveWebsite(); if (!url) return; try { await navigator.clipboard.writeText(url); websiteStatus.textContent = 'Lien copié : prêt à être collé dans un message ou une bio.'; } catch { websiteInput.select(); websiteStatus.textContent = 'Lien sélectionné : copiez-le manuellement.'; } };
  const prepare = agent.querySelector('.primary');
  if (prepare) prepare.onclick = () => { const saved = JSON.parse(localStorage.getItem(key) || 'null'); const textarea = document.querySelector('.inbox textarea'); if (!saved?.endpoint || !saved.consent) { $('#ai-status').textContent = 'Configurez un serveur IA sécurisé et votre autorisation avant la génération.'; return; } $('#ai-status').textContent = 'Prêt à générer : le serveur IA sera appelé uniquement après la validation explicite de la réponse.'; textarea.focus(); };
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', initCommunicationAI, { once: true }); else queueMicrotask(initCommunicationAI);
