document.addEventListener('html-components-loaded', () => {
  const $ = s => document.querySelector(s);

  const imageInput = $('#imageInput');
  const imageDrop = $('#imageDrop');
  const previewGrid = $('#previewGrid');
  const formatSelect = $('#formatSelect');
  const convertAllBtn = $('#convertAllBtn');
  const resizeWidthInput = $('#resizeWidth');
  const qualitySlider = $('#qualitySlider');
  const qualityValue = $('#qualityValue');
  const qualityLabel = $('#qualityLabel');
  const resizeHeightInput = $('#resizeHeight');
  const invertColorsCheck = $('#invertColors');
  const grayscaleColorsCheck = $('#grayscaleColors');
  const imageSettingsBtn = $('#imageSettingsBtn');
  const imageSettingsPopup = $('#imageSettingsPopup');
  const removeBgCheck = $('#removeBg');
  const removeBgOptions = $('#removeBgOptions');
  const removeBgColorInput = $('#removeBgColor');
  const bgToleranceInput = $('#bgTolerance');
  const bgToleranceVal = $('#bgToleranceVal');

  let imageFiles = [];

  if (!imageInput) return;

  function mkPreviewItem(file, url){
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-item';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'preview-remove-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove image';
    removeBtn.setAttribute('aria-label', 'Remove image');
    
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      wrapper.remove();
      imageFiles = imageFiles.filter(item => item.file !== file);
      if (imageFiles.length === 0) convertAllBtn.style.display = 'none';
    });
    
    wrapper.appendChild(removeBtn);

    const thumb = document.createElement('div'); thumb.className='preview-thumb';
    const img = document.createElement('img'); img.src = url; img.alt = file.name;
    thumb.appendChild(img);
    wrapper.appendChild(thumb);

    const meta = document.createElement('div'); meta.className='preview-meta';
    const name = document.createElement('span'); name.className='preview-filename';
    name.textContent = file.name;
    name.title = file.name;
    const size = document.createElement('span'); 
    size.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    meta.appendChild(name); meta.appendChild(size);
    wrapper.appendChild(meta);

    const actions = document.createElement('div'); actions.className='preview-actions';
    const checkbox = document.createElement('input'); checkbox.type='checkbox'; checkbox.checked = true; checkbox.title='Include in conversion';
    actions.appendChild(checkbox);

    const convertBtnItem = document.createElement('button'); convertBtnItem.textContent = 'Convert';
    convertBtnItem.addEventListener('click', ()=> convertAndDownload([file]));
    actions.appendChild(convertBtnItem);

    const viewBtn = document.createElement('button'); viewBtn.textContent = 'Open';
    viewBtn.addEventListener('click', ()=> {
      const w = window.open();
      w.document.body.style.margin = '0';
      const i = new Image();
      i.src = url; i.style.maxWidth='100%'; i.style.display='block';
      w.document.body.appendChild(i);
    });
    actions.appendChild(viewBtn);

    wrapper.appendChild(actions);
    previewGrid.appendChild(wrapper);

    return {wrapper, checkbox, img, name};
  }

  function resetPreviews(){
    previewGrid.innerHTML = '';
    imageFiles = [];
    convertAllBtn.style.display = 'none';
  }

  function handleFiles(files){
    resetPreviews(); 
    const arr = Array.from(files);
    arr.forEach(file=>{
      if(!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const preview = mkPreviewItem(file, url);
      imageFiles.push({file, url, preview});
    });
    if(imageFiles.length) convertAllBtn.style.display = 'inline-block';
  }

  if(imageDrop) {
      imageDrop.addEventListener('dragover', (e)=> { e.preventDefault(); imageDrop.classList.add('dragover'); });
      imageDrop.addEventListener('dragleave', ()=> imageDrop.classList.remove('dragover'));
      imageDrop.addEventListener('drop', (e)=> { e.preventDefault(); imageDrop.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
  }
  imageInput.addEventListener('change', (e)=> handleFiles(e.target.files));

  /* Icon Builders Helpers */
  function dataURLToUint8Array(dataURL){
    const base64 = dataURL.split(',')[1];
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) arr[i]=raw.charCodeAt(i);
    return arr;
  }

  function buildIcoFromPng(pngBytes){
    const pngLen = pngBytes.length;
    const header = new ArrayBuffer(6 + 16);
    const dv = new DataView(header);
    dv.setUint16(0, 0, true); dv.setUint16(2, 1, true); dv.setUint16(4, 1, true);
    dv.setUint8(6, 0); dv.setUint8(7, 0); dv.setUint8(8, 0); dv.setUint8(9, 0);
    dv.setUint16(10, 1, true); dv.setUint16(12, 32, true);
    dv.setUint32(14, pngLen, true); dv.setUint32(18, 22, true); 
    const data = new Uint8Array(header.byteLength + pngLen);
    data.set(new Uint8Array(header), 0);
    data.set(pngBytes, header.byteLength);
    return data.buffer;
  }

  function buildIcnsFromPng(pngBytes){
    function chunk(type, data){
      const len = 8 + data.length;
      const buf = new Uint8Array(len);
      for(let i=0;i<4;i++) buf[i]=type.charCodeAt(i);
      buf[4]= (len>>24)&0xFF; buf[5]= (len>>16)&0xFF; buf[6]= (len>>8)&0xFF; buf[7]= (len)&0xFF;
      buf.set(data,8);
      return buf;
    }
    const payload = chunk('png ', pngBytes);
    const totalLen = 8 + payload.length;
    const out = new Uint8Array(totalLen);
    out.set([0x69,0x63,0x6E,0x73],0);
    out[4]= (totalLen>>24)&0xFF; out[5]= (totalLen>>16)&0xFF; out[6]= (totalLen>>8)&0xFF; out[7]= (totalLen)&0xFF;
    out.set(payload,8);
    return out.buffer;
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function processImageToCanvas(file, opts = {}) {
    const { 
      width = null, 
      height = null, 
      invert = false, 
      grayscale = false,
      removeBg = false,
      removeColor = '#ffffff',
      tolerance = 15
    } = opts;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (width && height) {
            w = Number(width); h = Number(height);
          } else if (width) {
            w = Number(width); const scale = w / img.width; h = Math.round(img.height * scale);
          } else if (height) {
            h = Number(height); const scale = h / img.height; w = Math.round(img.width * scale);
          }

          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');

          let filterString = '';
          if (invert) filterString += 'invert(1) ';
          if (grayscale) filterString += 'grayscale(1) ';
          if (filterString) ctx.filter = filterString.trim();

          ctx.drawImage(img, 0, 0, w, h);

          if (removeBg) {
            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data;
            const target = hexToRgb(removeColor);
            const thresh = (tolerance / 100) * (255 * 3); 

            if (target) {
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const diff = Math.abs(r - target.r) + Math.abs(g - target.g) + Math.abs(b - target.b);
                if (diff <= thresh) data[i + 3] = 0;
              }
              ctx.putImageData(imageData, 0, 0);
            }
          }
          resolve(canvas);
        };
        img.onerror = reject; img.src = reader.result;
      };
      reader.onerror = reject; reader.readAsDataURL(file);
    });
  }

  async function convertFileToFormat(file, opts = {}) {
    const { targetFormat = 'png', quality = 0.92 } = opts;
    const canvas = await processImageToCanvas(file, opts);
    const { PDFDocument } = PDFLib;

    if (targetFormat === 'ico') {
      const pngDataUrl = canvas.toDataURL('image/png');
      const pngBytes = dataURLToUint8Array(pngDataUrl);
      const ico = buildIcoFromPng(pngBytes);
      return { name: file.name.replace(/\.[^.]+$/, '') + '.ico', blob: new Blob([ico], { type: 'image/x-icon' }) };
    }

    if (targetFormat === 'icns') {
      const pngDataUrl = canvas.toDataURL('image/png');
      const pngBytes = dataURLToUint8Array(pngDataUrl);
      const icns = buildIcnsFromPng(pngBytes);
      return { name: file.name.replace(/\.[^.]+$/, '') + '.icns', blob: new Blob([icns], { type: 'application/octet-stream' }) };
    }

    if (targetFormat === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      const pngDataUrl = canvas.toDataURL('image/png');
      const pngBytes = dataURLToUint8Array(pngDataUrl);
      const pngImage = await pdfDoc.embedPng(pngBytes);
      const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
      page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });
      const pdfBytes = await pdfDoc.save();
      return { name: file.name.replace(/\.[^.]+$/, '') + '.pdf', blob: new Blob([pdfBytes], { type: 'application/pdf' }) };
    }

    const mime = targetFormat === 'jpg' ? 'image/jpeg' : 'image/' + targetFormat;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, mime, quality));
    return { name: file.name.replace(/\.[^.]+$/, '') + '.' + targetFormat, blob };
  }

  async function convertAndDownload(files) {
    const fmt = formatSelect.value;
    const width = resizeWidthInput.value ? Number(resizeWidthInput.value) : null;
    const height = resizeHeightInput.value ? Number(resizeHeightInput.value) : null;
    const invert = invertColorsCheck.checked;
    const grayscale = grayscaleColorsCheck.checked;
    const quality = Number(qualitySlider.value) || 0.92;
    const removeBg = removeBgCheck.checked;
    const removeColor = removeBgColorInput.value;
    const tolerance = Number(bgToleranceInput.value);

    if (files.length === 0) return alert('No files selected');

    const options = { targetFormat: fmt, width, height, invert, grayscale, quality, removeBg, removeColor, tolerance };

    if (fmt === 'pdf') {
      const { PDFDocument } = PDFLib;
      const pdfDoc = await PDFDocument.create();
      showProcessing(convertAllBtn);

      for (const f of files) {
        try {
          const canvas = await processImageToCanvas(f, options);
          const pngDataUrl = canvas.toDataURL('image/png');
          const pngBytes = dataURLToUint8Array(pngDataUrl);
          const pngImage = await pdfDoc.embedPng(pngBytes);
          const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
          page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });
        } catch (err) {
          console.error('Failed to add image to PDF:', f.name, err);
        }
      }
      resetProcessing(convertAllBtn, 'Convert Selected');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, 'converted_images.pdf');
      return;
    }

    if (files.length === 1) {
      try {
        showProcessing(convertAllBtn);
        const res = await convertFileToFormat(files[0], options);
        saveAs(res.blob, res.name);
      } catch (err) {
        alert('An error occurred: ' + err.message);
      }
      resetProcessing(convertAllBtn, 'Convert Selected');
      return;
    }

    try {
      showProcessing(convertAllBtn);
      const zip = new JSZip();
      for (const f of files) {
        const res = await convertFileToFormat(f, options);
        zip.file(res.name, res.blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `converted_images.zip`);
    } catch (err) {
      alert('Error zipping: ' + err.message);
    }
    resetProcessing(convertAllBtn, 'Convert Selected');
  }

  convertAllBtn.addEventListener('click', ()=> {
    const selected = imageFiles.filter(i => i.preview.checkbox.checked).map(i=>i.file);
    if(selected.length === 0) return alert('No images selected');
    convertAndDownload(selected);
  });

  function updateQualityVisibility(){
    const fmt = formatSelect.value;
    if(fmt === 'jpg' || fmt === 'webp'){
      qualityLabel.style.display = 'inline-flex';
    } else {
      qualityLabel.style.display = 'none';
    }
  }

  if(removeBgCheck) {
    removeBgCheck.addEventListener('change', () => {
      removeBgOptions.style.display = removeBgCheck.checked ? 'flex' : 'none';
    });
  }

  if(bgToleranceInput) {
    bgToleranceInput.addEventListener('input', () => {
      bgToleranceVal.textContent = bgToleranceInput.value;
    });
  }

  formatSelect.addEventListener('change', updateQualityVisibility);
  qualitySlider.addEventListener('input', ()=> {
    qualityValue.textContent = Number(qualitySlider.value).toFixed(2);
  });

  // Settings Popup Logic
  imageSettingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    imageSettingsPopup.classList.toggle('visible');
  });

  document.addEventListener('click', (e) => {
    if (imageSettingsPopup && imageSettingsPopup.classList.contains('visible') && !imageSettingsPopup.contains(e.target) && !imageSettingsBtn.contains(e.target)) {
      imageSettingsPopup.classList.remove('visible');
    }
  });

  updateQualityVisibility();
});