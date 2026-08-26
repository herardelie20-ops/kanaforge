import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import './avatar-placement.css';

function begin() {
  if (new URLSearchParams(location.search).get('studio') !== 'placement') return;
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  workspace.innerHTML = `<section class="avatar-workspace"><div class="avatar-toolbar"><b>AVATAR 3D · VITRUVIAN</b><span>Orientez le corps · glissez le motif sur sa surface</span><div><button data-view="front">Face</button><button data-view="side">Profil</button><button data-view="back">Dos</button></div></div><div id="avatar-canvas"></div><div class="avatar-loading" id="avatar-loading">Chargement du modèle humain 3D…</div><div class="avatar-drop-hint" id="avatar-drop-hint">Déposez un motif ici, puis touchez le corps pour l’apposer</div></section><aside class="avatar-panel"><p>RÉGLAGES DE PLACEMENT</p><h2>Corps & pose</h2><label>Taille <output id="avatar-height-out">175 cm</output></label><input id="avatar-height" type="range" min="145" max="205" value="175"/><label>Corpulence <output id="avatar-build-out">100 %</output></label><input id="avatar-build" type="range" min="75" max="135" value="100"/><label>Élévation des bras <output id="pose-arm-out">0°</output></label><input id="pose-arm" type="range" min="-90" max="90" value="0"/><label>Pli des coudes <output id="pose-elbow-out">0°</output></label><input id="pose-elbow" type="range" min="0" max="130" value="0"/><label>Rotation du buste <output id="pose-torso-out">0°</output></label><input id="pose-torso" type="range" min="-45" max="45" value="0"/><hr/><label class="tattoo-file">Importer un tatouage<input id="avatar-tattoo-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"/></label><p class="placement-help">Après l’import, touchez ou faites glisser le motif directement sur le relief du mannequin.</p><label>Fond de l’image <select id="avatar-bg-mode"><option value="none">Conserver tel quel</option><option value="light" selected>Rendre le fond blanc transparent</option><option value="dark">Rendre le fond noir transparent</option></select></label><label>Seuil de transparence <output id="avatar-bg-threshold-out">235</output></label><input id="avatar-bg-threshold" type="range" min="120" max="255" value="235"/><label>Échelle du motif <output id="avatar-tattoo-scale-out">100 %</output></label><input id="avatar-tattoo-scale" type="range" min="25" max="190" value="100"/><button class="avatar-reset" id="avatar-reset">Réinitialiser la pose</button><small id="avatar-status">Surface blanche mate · importez un motif pour commencer</small></aside>`;
  initAvatar();
}

function initAvatar() {
  const $ = s => document.querySelector(s), host = $('#avatar-canvas'), loading = $('#avatar-loading'), hint = $('#avatar-drop-hint');
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(33, 1, .1, 100), renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; host.append(renderer.domElement);
  camera.position.set(0, 1.8, 9); const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.target.set(0, 1.3, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x17242b, 2.6)); const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(4, 7, 6); scene.add(key);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.8, 64), new THREE.MeshStandardMaterial({ color: 0x172027, roughness: .93 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.65; scene.add(floor);
  let avatar, bones = [], sourceImage, tattooDecal, lastHit, dragging = false;
  const tattooMeshes = [], raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f5f2, roughness: .78 });
  const decalMaterial = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  const resize = () => { const r = host.getBoundingClientRect(); renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  const bone = pattern => bones.filter(item => pattern.test(item.name));
  const output = (id, unit) => { $(`#${id}-out`).textContent = `${$(`#${id}`).value}${unit}`; };
  const pose = () => {
    const arm = +$('#pose-arm').value * Math.PI / 180, elbow = +$('#pose-elbow').value * Math.PI / 180, torso = +$('#pose-torso').value * Math.PI / 180;
    if (avatar) { const height = +$('#avatar-height').value / 175, build = +$('#avatar-build').value / 100; avatar.scale.set(build, height, build); bone(/upper.?arm|arm.?upper/i).forEach((item, i) => item.rotation.z = (i % 2 ? -1 : 1) * arm); bone(/forearm|lower.?arm|arm.?lower/i).forEach((item, i) => item.rotation.z = (i % 2 ? -1 : 1) * elbow); bone(/spine|chest/i).forEach(item => item.rotation.y = torso); avatar.updateMatrixWorld(true); }
    [['avatar-height', ' cm'], ['avatar-build', ' %'], ['pose-arm', '°'], ['pose-elbow', '°'], ['pose-torso', '°'], ['avatar-tattoo-scale', ' %'], ['avatar-bg-threshold', '']].forEach(([id, unit]) => output(id, unit)); if (lastHit) placeDecal(lastHit);
  };
  const textureWithTransparentBackground = image => {
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth || image.width; canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0);
    const mode = $('#avatar-bg-mode').value;
    if (mode !== 'none') { const threshold = +$('#avatar-bg-threshold').value, pixels = context.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < pixels.data.length; i += 4) { const l = .2126 * pixels.data[i] + .7152 * pixels.data[i + 1] + .0722 * pixels.data[i + 2]; const alpha = mode === 'light' ? (threshold - l) / 32 : (l - threshold) / 32; pixels.data[i + 3] = Math.round(pixels.data[i + 3] * Math.max(0, Math.min(1, alpha))); } context.putImageData(pixels, 0, 0); }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  };
  const hitAt = event => { if (!tattooMeshes.length) return null; const r = renderer.domElement.getBoundingClientRect(); pointer.set(((event.clientX - r.left) / r.width) * 2 - 1, -((event.clientY - r.top) / r.height) * 2 + 1); raycaster.setFromCamera(pointer, camera); return raycaster.intersectObjects(tattooMeshes, false)[0] || null; };
  const placeDecal = hit => {
    if (!sourceImage || !hit?.face) return;
    lastHit = { object: hit.object, point: hit.point.clone(), normal: hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize() };
    const orientation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), lastHit.normal));
    const scale = +$('#avatar-tattoo-scale').value / 100, aspect = (sourceImage.naturalWidth || sourceImage.width) / (sourceImage.naturalHeight || sourceImage.height), width = .82 * scale;
    tattooDecal?.geometry.dispose(); tattooDecal?.removeFromParent();
    tattooDecal = new THREE.Mesh(new DecalGeometry(lastHit.object, lastHit.point.clone().addScaledVector(lastHit.normal, .008), orientation, new THREE.Vector3(width, width / Math.max(.2, aspect), .18)), decalMaterial); scene.add(tattooDecal);
    $('#avatar-status').textContent = 'Motif appliqué au relief · faites-le glisser pour modifier sa position'; hint.classList.add('hidden');
  };
  const refreshTexture = () => { if (!sourceImage) return; decalMaterial.map?.dispose(); decalMaterial.map = textureWithTransparentBackground(sourceImage); decalMaterial.needsUpdate = true; if (lastHit) placeDecal(lastHit); };
  const loadTattoo = file => { if (!file?.type.startsWith('image/')) return; const reader = new FileReader(); reader.onload = () => { const image = new Image(); image.onload = () => { sourceImage = image; refreshTexture(); $('#avatar-status').textContent = 'Motif importé · touchez une zone du mannequin pour l’apposer'; hint.classList.remove('hidden'); }; image.src = reader.result; }; reader.readAsDataURL(file); };
  $('#avatar-tattoo-file').onchange = event => loadTattoo(event.target.files[0]);
  host.addEventListener('dragover', event => { event.preventDefault(); host.classList.add('is-dragging'); }); host.addEventListener('dragleave', () => host.classList.remove('is-dragging')); host.addEventListener('drop', event => { event.preventDefault(); host.classList.remove('is-dragging'); loadTattoo(event.dataTransfer.files[0]); });
  renderer.domElement.addEventListener('pointerdown', event => { if (!sourceImage) return; const hit = hitAt(event); if (!hit) return; dragging = true; controls.enableRotate = false; renderer.domElement.setPointerCapture?.(event.pointerId); placeDecal(hit); });
  renderer.domElement.addEventListener('pointermove', event => { if (dragging) { const hit = hitAt(event); if (hit) placeDecal(hit); } }); renderer.domElement.addEventListener('pointerup', event => { dragging = false; controls.enableRotate = true; renderer.domElement.releasePointerCapture?.(event.pointerId); });
  $('#avatar-bg-mode').onchange = refreshTexture; $('#avatar-bg-threshold').oninput = refreshTexture; ['avatar-height', 'avatar-build', 'pose-arm', 'pose-elbow', 'pose-torso', 'avatar-tattoo-scale'].forEach(id => $(`#${id}`).oninput = pose);
  $('#avatar-reset').onclick = () => { ['pose-arm', 'pose-elbow', 'pose-torso'].forEach(id => { $(`#${id}`).value = 0; }); pose(); camera.position.set(0, 1.8, 9); controls.target.set(0, 1.3, 0); };
  document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => { camera.position.fromArray({ front: [0, 1.8, 9], side: [9, 1.8, 0], back: [0, 1.8, -9] }[button.dataset.view]); controls.target.set(0, 1.3, 0); });
  new GLTFLoader().load(`${import.meta.env.BASE_URL}models/vitruvian_body.glb`, gltf => { avatar = gltf.scene; avatar.traverse(node => { if (node.isMesh) { node.material = whiteMaterial; node.castShadow = true; node.frustumCulled = false; tattooMeshes.push(node); } if (node.isBone) bones.push(node); }); const box = new THREE.Box3().setFromObject(avatar), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3()); avatar.position.sub(center); avatar.scale.setScalar(4.7 / size.y); scene.add(avatar); avatar.updateMatrixWorld(true); const grounded = new THREE.Box3().setFromObject(avatar); avatar.position.y += floor.position.y - grounded.min.y + .02; loading.remove(); pose(); $('#avatar-status').textContent = bones.length ? 'Avatar riggé · importez un motif puis glissez-le sur le corps' : 'Avatar chargé · importez un motif pour le placer'; }, undefined, () => { loading.textContent = 'Le modèle 3D ne peut pas être chargé. Réessayez après actualisation.'; });
  resize(); addEventListener('resize', resize); const render = () => { controls.update(); renderer.render(scene, camera); requestAnimationFrame(render); }; render();
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', begin, { once: true }); else queueMicrotask(begin);
