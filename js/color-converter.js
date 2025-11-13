document.addEventListener('html-components-loaded', () => {
  const $ = s => document.querySelector(s);

  const colorPicker = $('#colorPicker');
  const hexInput = $('#hexInput');
  const rgbR = $('#rgbR');
  const rgbG = $('#rgbG');
  const rgbB = $('#rgbB');
  const hslH = $('#hslH');
  const hslS = $('#hslS');
  const hslL = $('#hslL');
  const rgbRValue = $('#rgbRValue');
  const rgbGValue = $('#rgbGValue');
  const rgbBValue = $('#rgbBValue');
  const hslHValue = $('#hslHValue');
  const hslSValue = $('#hslSValue');
  const hslLValue = $('#hslLValue');
  const getComplementaryBtn = $('#getComplementaryBtn');

  if(!colorPicker) return;

  let isUpdating = false;

  function updateColorInputs(color, source) {
    if (isUpdating) return;
    isUpdating = true;
    if (!color || color.hex === undefined) { isUpdating = false; return; }

    const { r, g, b, h, s, l, hex } = color;

    if (source !== 'picker') colorPicker.value = hex;
    if (source !== 'hex') hexInput.value = hex;
    
    if (source !== 'rgb') {
      rgbR.value = r; rgbG.value = g; rgbB.value = b;
      rgbRValue.textContent = r; rgbGValue.textContent = g; rgbBValue.textContent = b;
    }
    
    if (source !== 'hsl') {
      const hRound = Math.round(h);
      const sRound = Math.round(s);
      const lRound = Math.round(l);
      hslH.value = hRound; hslS.value = sRound; hslL.value = lRound;
      hslHValue.textContent = hRound; hslSValue.textContent = sRound; hslLValue.textContent = lRound;
    }
    isUpdating = false;
  }

  function hexToRgb(hex) {
    if (!hex) return null;
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    } else return null;
    return { r, g, b };
  }

  function rgbToHex(r, g, b) {
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    h /= 360; s /= 100; l /= 100;
    if (s === 0) { r = g = b = l; } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  // Event Listeners
  colorPicker.addEventListener('input', () => {
    const hex = colorPicker.value;
    const rgb = hexToRgb(hex);
    if (rgb) {
      const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
      updateColorInputs({ ...rgb, h, s, l, hex }, 'picker');
    }
  });

  hexInput.addEventListener('input', () => {
    let hex = hexInput.value.trim();
    if (!/^#[0-9A-F]{3,6}$/i.test(hex)) {
        if (/^[0-9A-F]{3,6}$/i.test(hex)) hex = '#' + hex; else return;
    }
    if (hex.length === 4 || hex.length === 7) {
        const rgb = hexToRgb(hex);
        if (rgb) {
            const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
            updateColorInputs({ ...rgb, h, s, l, hex: hex.toUpperCase() }, 'hex');
        }
    }
  });

  [rgbR, rgbG, rgbB].forEach(input => {
    input.addEventListener('input', () => {
      const r = parseInt(rgbR.value) || 0;
      const g = parseInt(rgbG.value) || 0;
      const b = parseInt(rgbB.value) || 0;
      rgbRValue.textContent = r; rgbGValue.textContent = g; rgbBValue.textContent = b;
      const hex = rgbToHex(r, g, b);
      const { h, s, l } = rgbToHsl(r, g, b);
      updateColorInputs({ r, g, b, h, s, l, hex }, 'rgb');
    });
  });

  [hslH, hslS, hslL].forEach(input => {
    input.addEventListener('input', () => {
      const h = parseInt(hslH.value) || 0;
      const s = parseInt(hslS.value) || 0;
      const l = parseInt(hslL.value) || 0;
      hslHValue.textContent = h; hslSValue.textContent = s; hslLValue.textContent = l;
      const { r, g, b } = hslToRgb(h, s, l);
      const hex = rgbToHex(r, g, b);
      updateColorInputs({ r, g, b, h, s, l, hex }, 'hsl');
    });
  });

  if (getComplementaryBtn) {
    getComplementaryBtn.addEventListener('click', () => {
      if (isUpdating) return;
      const h = parseInt(hslH.value) || 0;
      const s = parseInt(hslS.value) || 0;
      const l = parseInt(hslL.value) || 0;
      const newH = (h + 180) % 360;
      const { r, g, b } = hslToRgb(newH, s, l);
      const hex = rgbToHex(r, g, b);
      updateColorInputs({ r, g, b, h: newH, s, l, hex }, 'button');
    });
  }

  // Initialize on load
  const hex = colorPicker.value;
  const rgb = hexToRgb(hex);
  if (rgb) {
      const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
      updateColorInputs({ ...rgb, h, s, l, hex }, 'picker');
  }
});