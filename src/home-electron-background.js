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
  const width = isMenuBackground ? 192 : 512;
  const height = isMenuBackground ? 672 : 512;
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

  window.addEventListener('pointermove', event => {
    const box = page.getBoundingClientRect();
    pointer = {
      x: Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)),
      y: Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)),
    };
  }, { passive: true });

  const paint = now => {
    if (!canvas.isConnected) {
      resizeObserver.disconnect();
      return;
    }
    requestAnimationFrame(paint);
    if (!heights || now - lastFrame < 42) return;
    lastFrame = now;

    const time = now * 0.00042;
    const pixels = fieldContext.createImageData(width, height);
    const data = pixels.data;
    const focusX = pointer.x * (width - 1);
    const focusY = pointer.y * (height - 1);
    const ambientX = width * (0.5 + Math.sin(time * (isViewportBackground ? 1.05 : 2.1)) * (isViewportBackground ? 0.38 : 0.3));
    const ambientY = height * (0.46 + Math.cos(time * (isViewportBackground ? 2.65 : 1.6)) * (isViewportBackground ? 0.3 : 0.22));

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const dx = x - focusX;
        const dy = y - focusY;
        const distance = Math.hypot(dx, dy) || 0.001;
        const ambientDistance = Math.hypot(x - ambientX, y - ambientY);
        const sx = x + Math.sin(y * (isViewportBackground ? 0.12 : 0.085) + time * (isViewportBackground ? 5.7 : 4.2)) * 3 + Math.sin(y * 0.17 - time * 1.6) * 1.4;
        const sy = y + Math.cos(x * (isViewportBackground ? 0.11 : 0.075) - time * (isViewportBackground ? 4.9 : 3.4)) * 3;
        const h = sample(sx, sy);
        const nx = -(sample(sx + 1, sy) - h) * 4;
        const ny = -(sample(sx, sy + 1) - h) * 4;
        const normalLength = Math.hypot(nx, ny, 1);
        const ambient = Math.exp(-((ambientDistance / 62) ** 2)) * (16 + h * 35);
        const focus = Math.exp(-((distance / 82) ** 2)) * (11 + h * 38);
        const relief = Math.max(0, 1 / normalLength) * h * 18;
        const sparkle = Math.exp(-((distance / 34) ** 2)) * (14 + Math.pow(h, 4.5) * 255);
        const rawLight = ambient + focus + relief + sparkle;
        const light = Math.min(255, Math.max(0, (rawLight - 12) * 1.42 + 2));
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
  };

  requestAnimationFrame(paint);
}

export function installHomeElectronBackground() {
  installElectronLiquidBackground(document.querySelector('#tattoo-studio .page-home'));
}

export function installMenuElectronBackground() {
  installElectronLiquidBackground(document.querySelector('#tattoo-studio .side'), 'electron-menu-background');
}
