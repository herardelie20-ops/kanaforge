import './object3d-nav.css';
function normalizeObject3DNav(){const link=document.querySelector('.side .object-link'),nav=document.querySelector('.side nav');if(!link||!nav)return;link.textContent='Labo objet 3D';link.classList.remove('object-link');link.classList.add('studio-nav-link');nav.insertAdjacentElement('afterbegin',link)}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',normalizeObject3DNav,{once:true});else queueMicrotask(normalizeObject3DNav);
