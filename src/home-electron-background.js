import menuGrainUrl from '../kanaforge-desktop/assets/menu-grain.png';

export function installElectronLiquidBackground(page, className = 'electron-liquid-background') {
  if (!page || page.querySelector(`.${className}`)) return;

  const canvas = document.createElement('canvas');
  canvas.className = className;
  canvas.setAttribute('aria-hidden', 'true');
  page.prepend(canvas);

  const context = canvas.getContext('2d', { alpha: false });
  const field = document.createElement('canvas');
  const isMenuBackground = className === 'electron-menu-background';
  const isViewportBackground = className === 'electron-viewport-background';
  const isLivePreviewBackground = [
    'electron-viewport-background',
    'electron-placement-library-background',
    'electron-placement-background',
    'flash-empty-liquid',
    'electron-paint-intro-background',
    'electron-lettering-drawing-background',
    'electron-lettering-composition-background',
  ].includes(className);
  const hasWormTexture = !isLivePreviewBackground;
  // Le calcul épouse le format réel de la zone, plutôt qu'un carré surdimensionné.
  // On conserve plus de finesse utile tout en évitant de calculer des pixels invisibles.
  const box = page.getBoundingClientRect();
  const aspect = Math.max(0.35, Math.min(3.5, box.width / Math.max(1, box.height)));
  const longEdge = 640;
  const width = isMenuBackground ? 224 : Math.round(aspect >= 1 ? longEdge : longEdge * aspect);
  const height = isMenuBackground ? 784 : Math.round(aspect >= 1 ? longEdge / aspect : longEdge);
  field.width = width;
  field.height = height;
  const fieldContext = field.getContext('2d', { alpha: false });
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  let heights = null;
  let pointer = { x: 0.5, y: 0.5 };
  let lastFrame = 0;
  let frameInterval = 36;
  let isPageVisible = document.visibilityState === 'visible';
  let isInViewport = true;
  let hasPointer = false;
  // La densité est dessinée directement dans le champ : elle donne l'impression
  // d'une infinité de petits volumes, sans traits isolés ni effet « ficelle ».
  const creatures = [];

  const grain = new Image();
  grain.onload = () => {
    sourceContext.drawImage(grain, 0, 0, width, height);
    const pixels = sourceContext.getImageData(0, 0, width, height).data;
    heights = new Float32Array(width * height);
    for (let index = 0; index < heights.length; index += 1) {
      const luminance = (pixels[index * 4] + pixels[index * 4 + 1] + pixels[index * 4 + 2]) / (255 * 3);
      heights[index] = Math.pow(luminance, 1.45) + Math.pow(luminance, 4.8) * 0.45;
    }
  };
  grain.src = menuGrainUrl;

  const sample = (x, y) => {
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
    const x0 = x | 0;
    const y0 = y | 0;
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const tx = x - x0;
    const ty = y - y0;
    return (heights[y0 * width + x0] * (1 - tx) + heights[y0 * width + x1] * tx) * (1 - ty)
      + (heights[y1 * width + x0] * (1 - tx) + heights[y1 * width + x1] * tx) * ty;
  };

  const resize = () => {
    const box = page.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.max(1, Math.round(box.width * ratio));
    canvas.height = Math.max(1, Math.round(box.height * ratio));
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(page);
  resize();

  const intersectionObserver = new IntersectionObserver(entries => {
    isInViewport = entries.some(entry => entry.isIntersecting);
  }, { threshold: 0.01 });
  intersectionObserver.observe(page);
  const syncPageVisibility = () => { isPageVisible = document.visibilityState === 'visible'; };
  document.addEventListener('visibilitychange', syncPageVisibility);

  const updatePointer = event => {
    const box = page.getBoundingClientRect();
    hasPointer = true;
    pointer = {
      x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)),
      y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)),
    };
  };
  window.addEventListener('pointermove', updatePointer, { passive: true });

  const drawGlassCreatures = (time, focusX, focusY) => {
    fieldContext.save();
    fieldContext.globalCompositeOperation = 'screen';
    for (const creature of creatures) {
      // Les groupes partagent une même marée : ils se croisent comme une nuée,
      // plutôt que de donner l'impression de fragments indépendants.
      const wave = time * (.92 + creature.group * .045) + creature.group * 1.71;
      const tideX = Math.sin(wave + creature.y * 10) * width * .038;
      const tideY = Math.cos(wave * 1.32 + creature.x * 12) * height * .028;
      const driftX = tideX + Math.sin(time * creature.speed * 2.3 + creature.phase) * creature.drift;
      const driftY = tideY + Math.cos(time * creature.speed * 1.9 + creature.phase * 1.7) * creature.drift * .7;
      const baseX = creature.x * width + driftX;
      const baseY = creature.y * height + driftY;
      const dx = baseX + creature.offsetX - focusX;
      const dy = baseY + creature.offsetY - focusY;
      const distance = Math.hypot(dx, dy) || 1;
      const flee = hasPointer ? Math.max(0, 1 - distance / (width * .2)) : 0;
      creature.velocityX = creature.velocityX * .79 + (dx / distance) * flee * 8.8;
      creature.velocityY = creature.velocityY * .79 + (dy / distance) * flee * 8.8;
      creature.offsetX = Math.max(-width * .14, Math.min(width * .14, creature.offsetX + creature.velocityX));
      creature.offsetY = Math.max(-height * .14, Math.min(height * .14, creature.offsetY + creature.velocityY));
      const emergence = Math.pow(Math.max(0, Math.sin(time * creature.pulse * 1.35 + creature.phase)), 2.6);
      const revealBand = Math.pow(Math.max(0, Math.sin(wave * .72 + creature.phase * .55)), 2);
      if (emergence * revealBand < .01 && flee < .03) continue;
      const x = baseX + creature.offsetX;
      const y = baseY + creature.offsetY;
      const angle = Math.atan2(driftY + creature.velocityY, driftX + creature.velocityX || .001);
      const length = creature.size * (1.15 + emergence * 1.95 + revealBand * .75 + flee * 1.1);
      const bend = Math.sin(time * 4.6 + creature.phase) * creature.size * (.75 + emergence * .4);
      const alpha = Math.min(.5, .035 + emergence * revealBand * .38 + flee * .24);
      fieldContext.strokeStyle = `rgba(220, 255, 252, ${alpha})`;
      fieldContext.lineWidth = .6 + emergence * 1.15 + revealBand * .4;
      fieldContext.shadowColor = 'rgba(196,255,250,.56)';
      fieldContext.shadowBlur = 3 + emergence * 10 + revealBand * 4;
      fieldContext.beginPath();
      fieldContext.moveTo(x - Math.cos(angle) * length * .58, y - Math.sin(angle) * length * .58);
      fieldContext.bezierCurveTo(
        x - Math.cos(angle) * length * .12 + Math.sin(angle) * bend,
        y - Math.sin(angle) * length * .12 - Math.cos(angle) * bend,
        x + Math.cos(angle) * length * .1 - Math.sin(angle) * bend,
        y + Math.sin(angle) * length * .1 + Math.cos(angle) * bend,
        x + Math.cos(angle) * length * .58,
        y + Math.sin(angle) * length * .58,
      );
      fieldContext.stroke();
    }
    fieldContext.restore();
  };

  const paint = now => {
    if (!canvas.isConnected) {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', syncPageVisibility);
      window.removeEventListener('pointermove', updatePointer);
      return;
    }
    requestAnimationFrame(paint);
    if (!isPageVisible || !isInViewport || !heights || now - lastFrame < frameInterval) return;
    lastFrame = now;
    const renderStartedAt = performance.now();

    const time = now * 0.00042;
    const pixels = fieldContext.createImageData(width, height);
    const data = pixels.data;
    const focusX = pointer.x * (width - 1);
    const focusY = pointer.y * (height - 1);
    const glintCycle = time * (isViewportBackground ? 1.35 : 1.8);
    const glintStep = Math.floor(glintCycle);
    const glintPulse = Math.sin((glintCycle - glintStep) * Math.PI);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const cursorDistance = Math.hypot(x - focusX, y - focusY);
        const cursorHalo = Math.exp(-((cursorDistance / (width * 0.16)) ** 2));
        const sx = x + Math.sin(y * (isViewportBackground ? 0.12 : 0.085) + time * (isViewportBackground ? 5.7 : 4.2)) * 3 + Math.sin(y * 0.17 - time * 1.6) * 1.4;
        const sy = y + Math.cos(x * (isViewportBackground ? 0.11 : 0.075) - time * (isViewportBackground ? 4.9 : 3.4)) * 3;
        const h = sample(sx, sy);
        const nx = -(sample(sx + 1, sy) - h) * 4;
        const ny = -(sample(sx, sy + 1) - h) * 4;
        const normalLength = Math.hypot(nx, ny, 1);
        const cellX = (x / 76) | 0;
        const cellY = (y / 76) | 0;
        const seedRaw = Math.sin(cellX * 127.1 + cellY * 311.7 + glintStep * 74.7) * 43758.5453;
        const seed = seedRaw - Math.floor(seedRaw);
        let sparkle = 0;
        if (seed > (isLivePreviewBackground ? 0.965 : 0.87)) {
          const sparkleX = cellX * 76 + ((seed * 19.7) % 1) * 76;
          const sparkleY = cellY * 76 + ((seed * 43.1) % 1) * 76;
          const sparkleDX = x - sparkleX;
          const sparkleDY = y - sparkleY;
          const glow = Math.exp(-(sparkleDX * sparkleDX + sparkleDY * sparkleDY) * 0.006);
          const ray = Math.exp(-(sparkleDX * sparkleDX * 0.024 + sparkleDY * sparkleDY * 0.00075));
          const sparkleStrength = isLivePreviewBackground ? .42 : 1;
          sparkle = glintPulse * sparkleStrength * (glow * (20 + h * 110) + ray * (10 + h * 48));
        }
        const cursorSweep = cursorHalo * (isLivePreviewBackground ? 3 + h * 12 : 8 + h * 30);
        const relief = Math.max(0, 1 / normalLength) * h * 5;
        const microRelief = Math.min(1, Math.hypot(nx, ny) * 1.8) * (2 + h * 6);
        let inkBody = 0;
        let wormRim = 0;
        if (hasWormTexture) {
          // Une petite forme arrondie par cellule, déformée par une marée :
          // l'ensemble crée une masse d'encre mouvante de milliers de vers courts.
          const fleeAmount = hasPointer ? cursorHalo * 11 : 0;
          const weaveX = sx + Math.sin(sy * .145 + time * 3.4) * 5 + ((x - focusX) / (cursorDistance + 1)) * fleeAmount;
          const weaveY = sy + Math.cos(sx * .13 - time * 2.8) * 5 + ((y - focusY) / (cursorDistance + 1)) * fleeAmount;
          const cellSize = isMenuBackground ? 5.8 : 7.4;
          const cellX = Math.floor(weaveX / cellSize);
          const cellY = Math.floor(weaveY / cellSize);
          const localX = weaveX - (cellX + .5) * cellSize;
          const localY = weaveY - (cellY + .5) * cellSize;
          const wormSeedRaw = Math.sin(cellX * 127.1 + cellY * 311.7) * 43758.5453;
          const wormSeed = wormSeedRaw - Math.floor(wormSeedRaw);
          const angle = (wormSeed - .5) * 2.4 + Math.sin(time * 1.9 + cellX * .31 + cellY * .17) * .38;
          const along = localX * Math.cos(angle) + localY * Math.sin(angle);
          const across = -localX * Math.sin(angle) + localY * Math.cos(angle);
          const halfLength = cellSize * (.26 + wormSeed * .2);
          const radius = cellSize * (.105 + ((wormSeed * 13.1) % 1) * .045);
          const segmentDistance = Math.hypot(Math.max(0, Math.abs(along) - halfLength), across);
          inkBody = Math.max(0, 1 - segmentDistance / radius);
          const rimDistance = segmentDistance - radius * .78;
          const rim = Math.exp(-(rimDistance * rimDistance) / Math.max(.4, radius * radius * .14));
          wormRim = rim * (2 + h * 19 + cursorHalo * 8);
        }
        const rawLight = (cursorSweep + relief + sparkle + microRelief + wormRim) * (1 - inkBody * .88);
        const light = Math.min(255, Math.max(0, (rawLight - 3) * 1.22));
        const index = (y * width + x) * 4;
        data[index] = light;
        data[index + 1] = light;
        data[index + 2] = light;
        data[index + 3] = 255;
      }
    }

    fieldContext.putImageData(pixels, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(field, 0, 0, canvas.width, canvas.height);
    const renderDuration = performance.now() - renderStartedAt;
    frameInterval = renderDuration > 28 ? 72 : renderDuration > 20 ? 54 : 36;
  };

  requestAnimationFrame(paint);
}

export function installHomeElectronBackground() {
  installElectronLiquidBackground(document.querySelector('#tattoo-studio .page-home'));
}

export function installMenuElectronBackground() {
  installElectronLiquidBackground(document.querySelector('#tattoo-studio .side'), 'electron-menu-background');
}
