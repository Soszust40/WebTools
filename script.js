const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* Navigation & Theme */
const toolItems = $$('.sidebar nav li');
const tools = $$('.tool');
const sidebar = $('#sidebar');
const hamburger = $('#hamburger');
const themeSwitch = $('#themeSwitch') || null;
const themeToggleTop = $('#themeToggle');

function showTool(id){
  toolItems.forEach(i=>i.classList.toggle('active', i.dataset.tool===id));
  tools.forEach(t=>t.classList.toggle('active', t.id===id));
}

toolItems.forEach(item=>{
  item.addEventListener('click', ()=> {
    showTool(item.dataset.tool);
    if(window.innerWidth < 900) sidebar.style.transform = 'translateX(-100%)';
  });
});

hamburger.addEventListener('click', ()=>{
  if(sidebar.style.transform === 'translateX(-100%)' || !sidebar.style.transform) {
    sidebar.style.transform = 'translateX(0)';
  } else {
    sidebar.style.transform = 'translateX(-100%)';
  }
});

if(themeToggleTop){
  themeToggleTop.addEventListener('click', ()=> {
    const dark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    if(themeSwitch) themeSwitch.checked = dark;
  });
}

if(themeSwitch){
  themeSwitch.addEventListener('change', ()=> {
    document.body.classList.toggle('dark', themeSwitch.checked);
    localStorage.setItem('theme', themeSwitch.checked ? 'dark' : 'light');
  });
}

window.addEventListener('load', ()=> {
  const saved = localStorage.getItem('theme');

  if(saved === 'light'){ 
    document.body.classList.remove('dark'); 
    if(themeSwitch) themeSwitch.checked = false; 
  } else {
    if(themeSwitch) themeSwitch.checked = true;
  }

  if(window.innerWidth < 900) sidebar.style.transform = 'translateX(-100%)';
  updateQualityVisibility();
});

/* Image Converter */
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

let imageFiles = [];

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
    
    if (imageFiles.length === 0) {
      convertAllBtn.style.display = 'none';
    }
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

  const convertBtn = document.createElement('button'); convertBtn.textContent = 'Convert';
  convertBtn.addEventListener('click', ()=> convertAndDownload([file]));
  actions.appendChild(convertBtn);

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

imageDrop.addEventListener('dragover', (e)=> { e.preventDefault(); imageDrop.classList.add('dragover'); });
imageDrop.addEventListener('dragleave', ()=> imageDrop.classList.remove('dragover'));
imageDrop.addEventListener('drop', (e)=> { e.preventDefault(); imageDrop.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
imageInput.addEventListener('change', (e)=> handleFiles(e.target.files));

/* Icon Builders */
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
  dv.setUint16(0, 0, true);
  dv.setUint16(2, 1, true);
  dv.setUint16(4, 1, true);
  dv.setUint8(6, 0);
  dv.setUint8(7, 0);
  dv.setUint8(8, 0);
  dv.setUint8(9, 0);
  dv.setUint16(10, 1, true);
  dv.setUint16(12, 32, true);
  dv.setUint32(14, pngLen, true);

  dv.setUint32(18, 22, true); 

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

function processImageToCanvas(file, opts = {}) {
  const { width = null, height = null, invert = false, grayscale = false } = opts;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (width && height) {
          w = Number(width);
          h = Number(height);
        } else if (width) {
          w = Number(width);
          const scale = w / img.width;
          h = Math.round(img.height * scale);
        } else if (height) {
          h = Number(height);
          const scale = h / img.height;
          w = Math.round(img.width * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        let filterString = '';
        if (invert) {
          filterString += 'invert(1) ';
        }
        if (grayscale) {
          filterString += 'grayscale(1) ';
        }

        if (filterString) {
          ctx.filter = filterString.trim();
        }

        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
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

  // Default: PNG, JPG, WebP (Original 'else' block)
  const mime = targetFormat === 'jpg' ? 'image/jpeg' : 'image/' + targetFormat;
  // Convert callback-based toBlob to a Promise
  const blob = await new Promise(resolve => canvas.toBlob(resolve, mime, quality));
  return { name: file.name.replace(/\.[^.]+$/, '') + '.' + targetFormat, blob };
}

async function convertAndDownload(files) {
  const fmt = formatSelect.value;
  // Read Settings
  const width = resizeWidthInput.value ? Number(resizeWidthInput.value) : null;
  const height = resizeHeightInput.value ? Number(resizeHeightInput.value) : null;
  const invert = invertColorsCheck.checked;
  const grayscale = grayscaleColorsCheck.checked;
  const quality = Number(qualitySlider.value) || 0.92;

  if (files.length === 0) return alert('No files selected');

  const options = { targetFormat: fmt, width, height, invert, grayscale, quality };

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
        alert(`Failed to process ${f.name}. Skipping.`);
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
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a'); a.href = url; a.download = res.name; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('An error occurred during conversion: ' + err.message);
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
    alert('An error occurred during zipping: ' + err.message);
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

formatSelect.addEventListener('change', updateQualityVisibility);
window.addEventListener('load', updateQualityVisibility);

qualitySlider.addEventListener('input', ()=> {
  qualityValue.textContent = Number(qualitySlider.value).toFixed(2);
});

/* QR Generator */
const qrText = $('#qrText');
const generateQR = $('#generateQR');
const qrCanvas = $('#qrCanvas');
const saveQR = $('#saveQR');
const qrSize = $('#qrSize');

generateQR.addEventListener('click', async () => {
  const txt = qrText.value.trim();
  if (!txt) return alert('Enter text or URL for QR code.');
  
  const size = Number(qrSize.value) || 200;
  const bgColor = $('#qrBgColor').value;
  const fgColor = $('#qrFgColor').value;

  qrCanvas.width = size;
  qrCanvas.height = size;
  
  const options = {
    width: size,
    color: {
      dark: fgColor,  // Foreground Color
      light: bgColor // Background Color
    }
  };

  try {
    await QRCode.toCanvas(qrCanvas, txt, options);
    saveQR.style.display = 'inline-block';
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    alert('Failed to generate QR code. Please check your inputs.');
  }
});

saveQR.addEventListener('click', () => {
  const url = qrCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'qr-code.png';
  a.click();
});

/* Word Counter */
const textInput = $('#textInput');
const wordCount = $('#wordCount');
const charCount = $('#charCount');
const readingTime = $('#readingTime');
const speakingTime = $('#speakingTime');
const AVG_READING_WPM = 240;
const AVG_SPEAKING_WPM = 140;

textInput.addEventListener('input', () => {
  const text = textInput.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  wordCount.textContent = words;
  charCount.textContent = text.length;
});

function formatTime(totalSeconds) {
  if (totalSeconds < 1) {
    return '0 sec';
  }
  if (totalSeconds < 60) {
    return `${Math.ceil(totalSeconds)} sec`;
  }
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  
  if (seconds === 60) {
    return `${minutes + 1} min 0 sec`;
  }
  
  return `${minutes} min ${seconds} sec`;
}

/* Word Count Timer */
if (textInput) {
  textInput.addEventListener('input', () => {
    const text = textInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;

    wordCount.textContent = words;
    charCount.textContent = text.length;

    if (words === 0) {
      readingTime.textContent = '0 sec';
      speakingTime.textContent = '0 sec';
    } else {
      const readingSecs = (words / AVG_READING_WPM) * 60;
      const speakingSecs = (words / AVG_SPEAKING_WPM) * 60;

      readingTime.textContent = formatTime(readingSecs);
      speakingTime.textContent = formatTime(speakingSecs);
    }
  });
}

/* List Sorter */
const sortBtn = $('#sortBtn');
const listInput = $('#listInput');
const listOutput = $('#listOutput');
const uniqueOnly = $('#uniqueOnly');
const caseSensitive = $('#caseSensitive');
const numericSort = $('#numericSort');
const sortOrder = $('#sortOrder');
const clearList = $('#clearList');

sortBtn.addEventListener('click', ()=>{
  const raw = listInput.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  let arr = raw.slice();
  if(!caseSensitive.checked) arr = arr.map(s=>s.toLowerCase());
  if(numericSort.checked){
    arr.sort((a,b)=> Number(a) - Number(b));
  } else {
    arr.sort((a,b)=> a.localeCompare(b));
  }
  if(sortOrder.value === 'desc') arr.reverse();
  if(uniqueOnly.checked) arr = Array.from(new Set(arr));
  listOutput.value = arr.join('\n');
});
clearList.addEventListener('click', ()=>{ listInput.value=''; listOutput.value=''; });

/* Image Settings Popup */
imageSettingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  imageSettingsPopup.classList.toggle('visible');
});

document.addEventListener('click', (e) => {
  if (imageSettingsPopup.classList.contains('visible') && !imageSettingsPopup.contains(e.target) && !imageSettingsBtn.contains(e.target)) {
    imageSettingsPopup.classList.remove('visible');
  }

  if(window.innerWidth < 900){
    if(!sidebar.contains(e.target) && !hamburger.contains(e.target)){
      sidebar.style.transform = 'translateX(-100%)';
    }
  }
});


/* PDF Tools */
const { PDFDocument } = PDFLib;

// --- DOM Selectors ---
const pdfCompressDrop = $('#pdfCompressDrop');
const pdfCombineDrop = $('#pdfCombineDrop');
const pdfSplitDrop = $('#pdfSplitDrop');
const pdfCompressInput = $('#pdfCompressInput');
const pdfCompressBtn = $('#pdfCompressBtn');
const pdfCompressClear = $('#pdfCompressClear');
const pdfCombineInput = $('#pdfCombineInput');
const pdfCombineBtn = $('#pdfCombineBtn');
const pdfCombineClear = $('#pdfCombineClear'); 
const pdfSplitInput = $('#pdfSplitInput');
const pdfSplitBtn = $('#pdfSplitBtn');
const pdfSplitClear = $('#pdfSplitClear');
const pdfSplitRange = $('#pdfSplitRange');

let compressFile = null;
let combineFiles = [];
let splitFile = null;

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function showProcessing(button) {
  button.disabled = true;
  button.textContent = 'Processing...';
}

function resetProcessing(button, originalText) {
  button.disabled = false;
  button.textContent = originalText;
}

// Compress PDF
pdfCompressInput.addEventListener('change', (e) => {
  if (e.target.files.length === 0) return;
  compressFile = e.target.files[0];
  pdfCompressDrop.querySelector('span').textContent = compressFile.name;
  pdfCompressBtn.style.display = 'block';
  pdfCompressClear.style.display = 'block';
});

pdfCompressBtn.addEventListener('click', async () => {
  if (!compressFile) return alert('Please select a file to compress.');
  
  showProcessing(pdfCompressBtn);

  try {
    const arrayBuffer = await readFileAsArrayBuffer(compressFile);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `compressed_${compressFile.name}`);

  } catch (err) {
    console.error(err);
    alert('An error occurred during compression: ' + err.message);
  }
  
  resetProcessing(pdfCompressBtn, 'Compress');
});

// Combine PDFs
pdfCombineInput.addEventListener('change', (e) => {
  if (e.target.files.length === 0) return;
  combineFiles = Array.from(e.target.files);
  pdfCombineDrop.querySelector('span').textContent = `${combineFiles.length} files selected`;
  pdfCombineBtn.style.display = 'block';
  pdfCombineClear.style.display = 'block';
});

pdfCombineBtn.addEventListener('click', async () => {
  if (combineFiles.length < 2) return alert('Please select at least two PDF files to combine.');
  
  showProcessing(pdfCombineBtn);
  
  try {
    const mergedPdf = await PDFDocument.create();

    for (const file of combineFiles) {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdf = await PDFDocument.load(arrayBuffer);
      
      const pageIndices = pdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    saveAs(blob, 'combined.pdf');

  } catch (err) {
    console.error(err);
    alert('An error occurred while combining PDFs: ' + err.message);
  }
  
  resetProcessing(pdfCombineBtn, 'Combine');
});


// Split PDF
pdfSplitInput.addEventListener('change', (e) => {
  if (e.target.files.length === 0) return;
  splitFile = e.target.files[0];
  pdfSplitDrop.querySelector('span').textContent = splitFile.name;
  pdfSplitBtn.style.display = 'block';
  pdfSplitClear.style.display = 'block';
});

function parsePageRange(rangeString, maxPage) {
  const indices = new Set();
  const parts = rangeString.replace(/\s+/g, '').split(',');

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          if (i > 0 && i <= maxPage) {
            indices.add(i - 1);
          }
        }
      }
    } else {
      const pageNum = Number(part);
      if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPage) {
        indices.add(pageNum - 1);
      }
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
}

pdfSplitBtn.addEventListener('click', async () => {
  const rangeStr = pdfSplitRange.value.trim();
  if (!splitFile) return alert('Please select a file to split.');
  if (!rangeStr) return alert('Please enter a page range (e.g., "1-3, 5").');
  
  showProcessing(pdfSplitBtn);
  
  try {
    const arrayBuffer = await readFileAsArrayBuffer(splitFile);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const maxPage = pdfDoc.getPageCount();

    const pageIndices = parsePageRange(rangeStr, maxPage);
    
    if (pageIndices.length === 0) {
      throw new Error('No valid pages were selected in the given range.');
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
    
    copiedPages.forEach((page) => {
      newPdf.addPage(page);
    });

    const newPdfBytes = await newPdf.save();
    const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
    saveAs(blob, `split_${splitFile.name}`);

  } catch (err) {
    console.error(err);
    alert('An error occurred while splitting the PDF: ' + err.message);
  }
  
  resetProcessing(pdfSplitBtn, 'Split');
});

pdfCompressClear.addEventListener('click', () => {
  compressFile = null;
  pdfCompressInput.value = '';
  pdfCompressDrop.querySelector('span').textContent = 'Drag & drop PDF to compress';
  pdfCompressBtn.style.display = 'none';
  pdfCompressClear.style.display = 'none';
});

pdfCombineClear.addEventListener('click', () => {
  combineFiles = [];
  pdfCombineInput.value = '';
  pdfCombineDrop.querySelector('span').textContent = 'Drag & drop PDFs to combine';
  pdfCombineBtn.style.display = 'none';
  pdfCombineClear.style.display = 'none';
});

pdfSplitClear.addEventListener('click', () => {
  splitFile = null;
  pdfSplitInput.value = '';
  pdfSplitRange.value = '';
  pdfSplitDrop.querySelector('span').textContent = 'Drag & drop PDF to split';
  pdfSplitBtn.style.display = 'none';
  pdfSplitClear.style.display = 'none';
});

// PDF Drag-and-Drop Handlers
[pdfCompressDrop, pdfCombineDrop, pdfSplitDrop].forEach(dropZone => {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const input = dropZone.querySelector('input[type="file"]');
    if (input) {
      input.files = e.dataTransfer.files;
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  });
});

// Vigenère Cipher
const vigenereKey = $('#vigenereKey');
const vigenereInput = $('#vigenereInput');
const vigenereOutput = $('#vigenereOutput');
const vigenereEncryptBtn = $('#vigenereEncryptBtn');
const vigenereDecryptBtn = $('#vigenereDecryptBtn');
const vigenerePreserveCase = $('#vigenerePreserveCase');
const vigenereKeepNonAlpha = $('#vigenereKeepNonAlpha');
const vigenereGenerateKeyBtn = $('#vigenereGenerateKeyBtn');


function vigenereCipher(text, key, isDecrypt) {
  const preserveCase = vigenerePreserveCase.checked;
  const keepNonAlpha = vigenereKeepNonAlpha.checked;
  
  if (!key) {
    alert('Please enter a keyword.');
    return '';
  }

  const keyUpper = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!keyUpper.length) {
    alert('Keyword must contain at least one alphabetic character.');
    return '';
  }

  let keyIndex = 0;
  let result = '';
  
  const inputText = preserveCase ? text : text.toUpperCase();

  for (let i = 0; i < inputText.length; i++) {
    const char = inputText[i];
    
    if (char.match(/[a-zA-Z]/)) {
      // Letter
      const isUpperCase = (char === char.toUpperCase());
      const baseCode = isUpperCase ? 65 : 97; // 'A' or 'a'
      const textCharCode = inputText.charCodeAt(i);
      
      const keyChar = keyUpper[keyIndex % keyUpper.length];
      const shift = keyChar.charCodeAt(0) - 65;
      
      keyIndex++;

      let newCharCode;
      if (isDecrypt) {
        // Decryption: (char - shift) % 26
        newCharCode = (textCharCode - baseCode - shift + 26) % 26 + baseCode;
      } else {
        // Encryption: (char + shift) % 26
        newCharCode = (textCharCode - baseCode + shift) % 26 + baseCode;
      }
      
      result += String.fromCharCode(newCharCode);

    } else {
      // Not Letter
      if (keepNonAlpha) {
        result += char;
      }
    }
  }

  return result;
}

vigenereEncryptBtn.addEventListener('click', () => {
  const text = vigenereInput.value;
  const key = vigenereKey.value;
  vigenereOutput.value = vigenereCipher(text, key, false);
});

vigenereDecryptBtn.addEventListener('click', () => {
  if (vigenereInput.value.trim() === '' && vigenereOutput.value.trim() !== '') {
    vigenereInput.value = vigenereOutput.value;
    vigenereOutput.value = '';
  }
  
  const text = vigenereInput.value;
  const key = vigenereKey.value;
  vigenereOutput.value = vigenereCipher(text, key, true);
});

// Random keyword Generator
const VIGENERE_WORD_LIST = [
  'ABILITY', 'ABROAD', 'ABUSE', 'ACCESS', 'ACCIDENT', 'ACCOUNT', 'ACTION', 'ACTIVE', 'ACTOR',
  'ADVICE', 'AFFAIR', 'AGENCY', 'AGREEMENT', 'AIRPORT', 'ALCOHOL', 'AMBITION', 'AMOUNT',
  'ANALYSIS', 'ANIMAL', 'ANSWER', 'ANXIETY', 'ANYBODY', 'APARTMENT', 'APPLE', 'APPLICATION',
  'APPOINTMENT', 'AREA', 'ARGUMENT', 'ARMY', 'ARRIVAL', 'ARTICLE', 'ARTIST', 'ASPECT',
  'ASSEMBLY', 'ASSIGNMENT', 'ASSISTANCE', 'ASSOCIATION', 'ATTENTION', 'ATTITUDE', 'AUDIENCE',
  'AUTHOR', 'AVERAGE', 'AWARD', 'BALANCE', 'BASIS', 'BEACH', 'BEGINNING', 'BENEFIT',
  'BIRTH', 'BLOOD', 'BOARD', 'BOTTOM', 'BRANCH', 'BREAD', 'BREAK', 'BREATH', 'BROTHER',
  'BUILDING', 'BUSINESS', 'BUYER', 'CABINET', 'CAMERA', 'CANCER', 'CANDIDATE', 'CAPITAL',
  'CARD', 'CAREER', 'CASE', 'CASH', 'CATEGORY', 'CAUSE', 'CELEBRATION', 'CHALLENGE',
  'CHANNEL', 'CHAPTER', 'CHARACTER', 'CHARGE', 'CHARITY', 'CHECK', 'CHEMISTRY', 'CHEST',
  'CHOCOLATE', 'CHOICE', 'CHURCH', 'CLIENT', 'CLIMATE', 'CLOTHING', 'COFFEE', 'COLLEAGUE',
  'COLLECTION', 'COLLEGE', 'COMBINATION', 'COMMITTEE', 'COMMON', 'COMMUNICATION',
  'COMMUNITY', 'COMPANY', 'COMPARISON', 'COMPETITION', 'COMPLAINT', 'COMPUTER', 'CONCEPT',
  'CONDITION', 'CONFERENCE', 'CONFIDENCE', 'CONNECTION', 'CONSEQUENCE', 'CONSTRUCTION',
  'CONTACT', 'CONTEXT', 'CONTRACT', 'CONTRIBUTION', 'CONTROL', 'CONVERSATION', 'COOKIE',
  'COUNTRY', 'COUNTY', 'COUPLE', 'COURAGE', 'COURSE', 'COUSIN', 'CREATE', 'CREDIT',
  'CRIME', 'CRITICISM', 'CULTURE', 'CURRENCY', 'CUSTOMER', 'CYCLE', 'DATABASE', 'DEALER',
  'DEBATE', 'DECISION', 'DEFINITION', 'DELIVERY', 'DEPARTMENT', 'DEPARTURE', 'DEPENDENT',
  'DEPOSIT', 'DEPRESSION', 'DEPTH', 'DESCRIPTION', 'DESIGN', 'DESK', 'DEVELOPER',
  'DIAMOND', 'DIFFERENCE', 'DIFFICULTY', 'DIRECTION', 'DIRECTOR', 'DISASTER',
  'DISCIPLINE', 'DISCUSSION', 'DISEASE', 'DISK', 'DISTRIBUTION', 'DISTRICT', 'DOCTOR',
  'DOCUMENT', 'DRIVER', 'EARTH', 'ECONOMICS', 'ECONOMY', 'EDITOR', 'EDUCATION', 'EFFECT',
  'EFFORT', 'ELECTION', 'ELECTRICITY', 'EMOTION', 'EMPLOYEE', 'EMPLOYER', 'END',
  'ENGINE', 'ENGINEER', 'ENTERTAINMENT', 'ENTRANCE', 'ENVIRONMENT', 'EQUIPMENT', 'ERROR',
  'ESTABLISHMENT', 'ESTATE', 'EVENT', 'EXAM', 'EXAMPLE', 'EXCHANGE', 'EXCITEMENT',
  'EXERCISE', 'EXPERIENCE', 'EXPERT', 'EXPLANATION', 'EXPRESSION', 'EXTENSION', 'FAILURE',
  'FAMILY', 'FARMER', 'FATHER', 'FEATURE', 'FEEDBACK', 'FIELD', 'FIGURE', 'FILM',
  'FINAL', 'FINANCE', 'FINDING', 'FIRE', 'FISH', 'FLIGHT', 'FLOWER', 'FOOD', 'FOOTBALL',
  'FORCE', 'FOREIGN', 'FOREST', 'FORM', 'FOUNDATION', 'FREEDOM', 'FRIEND', 'FUTURE',
  'GAME', 'GARDEN', 'GATE', 'GENERAL', 'GIRL', 'GOAL', 'GOLD', 'GOVERNMENT', 'GRANDFATHER',
  'GRASS', 'GROUP', 'GROWTH', 'GUIDE', 'GUITAR', 'HAIR', 'HALF', 'HALL', 'HAND',
  'HEAD', 'HEALTH', 'HEART', 'HEAT', 'HEAVY', 'HEIGHT', 'HISTORY', 'HOME', 'HOPE',
  'HOSPITAL', 'HOTEL', 'HOUR', 'HOUSE', 'HUMAN', 'HUSBAND', 'IDEA', 'IMAGE',
  'IMPACT', 'IMPORTANCE', 'IMPRESSION', 'IMPROVEMENT', 'INCOME', 'INDUSTRY', 'INFLATION',
  'INFORMATION', 'INJURY', 'INSECT', 'INSIDE', 'INSPECTION', 'INSPECTOR', 'INSTANCE',
  'INSTRUCTION', 'INSURANCE', 'INTENTION', 'INTERACTION', 'INTEREST', 'INTERNAL',
  'INTERNATIONAL', 'INTERNET', 'INTERVIEW', 'INTRODUCTION', 'INVESTIGATION', 'INVESTMENT',
  'ISSUE', 'ITEM', 'JACKET', 'JOB', 'JOURNALIST', 'JUDGEMENT', 'JUICE', 'KEY',
  'KING', 'KNOWLEDGE', 'LABORATORY', 'LADY', 'LAKE', 'LANGUAGE', 'LAWYER', 'LEADER',
  'LEADERSHIP', 'LEARNING', 'LEAST', 'LEAVE', 'LECTURE', 'LENGTH', 'LEVEL', 'LIBRARY',
  'LIFE', 'LIGHT', 'LINE', 'LINK', 'LIST', 'LITERATURE', 'LOCATION', 'LOSS',
  'LOVE', 'MACHINE', 'MAGAZINE', 'MAIL', 'MAIN', 'MAINTENANCE', 'MAJORITY', 'MAKE',
  'MANAGEMENT', 'MANAGER', 'MANNER', 'MAP', 'MARKET', 'MARKETING', 'MARRIAGE',
  'MATERIAL', 'MATHEMATICS', 'MATTER', 'MEAL', 'MEANING', 'MEASUREMENT', 'MEAT',
  'MEDIA', 'MEDICINE', 'MEDIUM', 'MEMBER', 'MEMBERSHIP', 'MEMORY', 'MENU', 'MESSAGE',
  'METAL', 'METHOD', 'MIDDLE', 'MIDNIGHT', 'MIND', 'MINUTE', 'MISSION', 'MISTAKE',
];

function generateRandomKey(numWords = 3) {
  let result = '';
  for (let i = 0; i < numWords; i++) {
    const randomIndex = Math.floor(Math.random() * VIGENERE_WORD_LIST.length);
    result += VIGENERE_WORD_LIST[randomIndex] += ' ';
  }
  return result;
}

vigenereGenerateKeyBtn.addEventListener('click', () => {
  vigenereKey.value = generateRandomKey(3);
});

// Color Converter
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

let isUpdating = false;


function updateColorInputs(color, source) {
  if (isUpdating) return;
  isUpdating = true;

  if (!color) {
    isUpdating = false;
    return;
  }

  const { r, g, b, h, s, l, hex } = color;

  if (hex === undefined || r === undefined || h === undefined) {
      isUpdating = false;
      return;
  }

  if (source !== 'picker') {
    colorPicker.value = hex;
  }
  if (source !== 'hex') {
    hexInput.value = hex;
  }
  if (source !== 'rgb') {
    rgbR.value = r;
    rgbG.value = g;
    rgbB.value = b;

    // Update RGB Spans
    rgbRValue.textContent = r;
    rgbGValue.textContent = g;
    rgbBValue.textContent = b;
  }
  if (source !== 'hsl') {
    // Round HSL Values
    const hRound = Math.round(h);
    const sRound = Math.round(s);
    const lRound = Math.round(l);

    hslH.value = hRound;
    hslS.value = sRound;
    hslL.value = lRound;

    // Update HSL Spans
    hslHValue.textContent = hRound;
    hslSValue.textContent = sRound;
    hslLValue.textContent = lRound;
  }

  isUpdating = false;
}

if (colorPicker) {
  colorPicker.addEventListener('input', () => {
    const hex = colorPicker.value;
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    const { r, g, b } = rgb;
    const { h, s, l } = rgbToHsl(r, g, b);
    updateColorInputs({ r, g, b, h, s, l, hex }, 'picker');
  });

  hexInput.addEventListener('input', () => {
    let hex = hexInput.value.trim();
    
    // Basic Validation
    if (!/^#[0-9A-F]{3,6}$/i.test(hex)) {
        if (/^[0-9A-F]{3,6}$/i.test(hex)) {
            hex = '#' + hex;
        } else {
            return;
        }
    }
    
    if (hex.length === 4 || hex.length === 7) {
        const rgb = hexToRgb(hex);
        if (!rgb) return;
        const { r, g, b } = rgb;
        const { h, s, l } = rgbToHsl(r, g, b);
        updateColorInputs({ r, g, b, h, s, l, hex: hex.toUpperCase() }, 'hex');
    }
  });

  [rgbR, rgbG, rgbB].forEach(input => {
    input.addEventListener('input', () => {
      const r = parseInt(rgbR.value) || 0;
      const g = parseInt(rgbG.value) || 0;
      const b = parseInt(rgbB.value) || 0;

      rgbRValue.textContent = r;
      rgbGValue.textContent = g;
      rgbBValue.textContent = b;

      const safeR = Math.max(0, Math.min(255, r));
      const safeG = Math.max(0, Math.min(255, g));
      const safeB = Math.max(0, Math.min(255, b));

      const hex = rgbToHex(safeR, safeG, safeB);
      const { h, s, l } = rgbToHsl(safeR, safeG, safeB);
      updateColorInputs({ r: safeR, g: safeG, b: safeB, h, s, l, hex }, 'rgb');
    });
  });

  [hslH, hslS, hslL].forEach(input => {
    input.addEventListener('input', () => {
      const h = parseInt(hslH.value) || 0;
      const s = parseInt(hslS.value) || 0;
      const l = parseInt(hslL.value) || 0;

      // Update Spans
      hslHValue.textContent = h;
      hslSValue.textContent = s;
      hslLValue.textContent = l;

      const safeH = Math.max(0, Math.min(360, h));
      const safeS = Math.max(0, Math.min(100, s));
      const safeL = Math.max(0, Math.min(100, l));

      const { r, g, b } = hslToRgb(safeH, safeS, safeL);
      const hex = rgbToHex(r, g, b);
      updateColorInputs({ r, g, b, h: safeH, s: safeS, l: safeL, hex }, 'hsl');
    });
  });
}

// Color Conversion Functions

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
  } else {
    return null;
  }
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

  if (max === min) {
    h = s = 0;
  } else {
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
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
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

function initColorConverter() {
  if (colorPicker) {
    const hex = colorPicker.value;
    const rgb = hexToRgb(hex);
    if (rgb) {
        const { r, g, b } = rgb;
        const { h, s, l } = rgbToHsl(r, g, b);
        updateColorInputs({ r, g, b, h, s, l, hex }, 'picker');
    }
  }
}

initColorConverter();

// Citation Maker Functions
const citeType = $('#citeType');
const citeFormat = $('#citeFormat');
const citationForm = $('#citationForm');
const citeGroups = $$('.cite-group');
const citeGenerateBtn = $('#citeGenerateBtn');
const citeClearBtn = $('#citeClearBtn');
const citeCopyBtn = $('#citeCopyBtn');
const citeOutput = $('#citeOutput');

function formatAuthors(authorStr, format) {
  if (!authorStr) return '';

  const authors = authorStr.split(';').map(a => a.trim()).filter(Boolean);

  const formatted = authors.map(name => {
    const parts = name.split(',');
    const lastName = parts[0] ? parts[0].trim() : name;
    let givenNames = parts[1] ? parts[1].trim() : '';

    if (format === 'apa') {
      // APA: "Last, F. M."
      if (!givenNames) return lastName;
      const initials = givenNames.split(/\s+/).map(n => n[0].toUpperCase() + '.').join(' ');
      return `${lastName}, ${initials}`;
    } else {
      // MLA & Chicago: "First M. Last"
      if (!givenNames) return lastName;
      return `${givenNames} ${lastName}`;
    }
  });

  // Multiple Authors Formatting
  if (formatted.length === 0) return '';
  if (formatted.length === 1) return formatted[0];

  if (format === 'apa') {
    const last = formatted.pop();
    return formatted.join(', ') + ' & ' + last;
  } else {
    if (formatted.length === 2) {
      return formatted.join(' and ');
    }
    if (formatted.length >= 3 && format === 'mla') {
      return `${formatted[0]}, et al.`;
    } else {
      const last = formatted.pop();
      return formatted.join(', ') + ', and ' + last;
    }
  }
}

function formatDate(dateStr, format) {
  if (!dateStr) return '';

  const parts = dateStr.split('-').map(Number);
  const [year, month, day] = parts;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  let dateOut = '';
  if (year && month && day) dateOut = `${monthNames[month - 1]} ${day}, ${year}`;
  else if (year && month) dateOut = `${monthNames[month - 1]} ${year}`;
  else if (year) dateOut = `${year}`;
  else return '';

  if (format === 'apa') return `(${dateOut})`;
  if (format === 'mla') {
      if (day) return `${day} ${monthNames[month-1].substring(0,3)}. ${year}`;
      return dateOut.replace(',', '');
  }
  if (format === 'chicago') return dateOut;
  return dateStr;
}

function updateCitationForm() {
  if (!citeType) return;
  const selectedType = citeType.value;
  citeGroups.forEach(group => {
    const supportedTypes = group.dataset.type.split(' ');
    group.style.display = supportedTypes.includes(selectedType) ? 'flex' : 'none';
  });
}

function generateCitation() {
  const type = citeType.value;
  const format = citeFormat.value;
  let citation = '';

  const getVal = (id) => ($('#' + id) && $('#' + id).offsetParent !== null) ? $('#' + id).value.trim() : '';
  const add = (text, punctuation = '. ') => (text ? text + punctuation : '');
  const addSpace = (text) => (text ? ' ' + text : '');
  
  const rawAuthor = getVal('citeAuthor');
  const author = formatAuthors(rawAuthor, format);
  
  const articleTitle = getVal('citeArticleTitle');
  const pubDate = getVal('citePublicationDate');
  const year = getVal('citeYear');
  const url = getVal('citeURL');
  const pageRange = getVal('citePageRange');

  const dateStr = pubDate || year;
  const formattedDate = formatDate(dateStr, format);

  // ===== WEBSITE =====
  if (type === 'website') {
    const siteName = getVal('citeSiteName');
    const accessDate = getVal('citeAccessDate');
    const formattedAccess = formatDate(accessDate, 'mla');

    if (format === 'apa') {
      citation = `${add(author)}${add(formattedDate || '(n.d.)')}<i>${add(articleTitle)}</i>${add(siteName)}${url || ''}`;
    } 
    else if (format === 'mla') {
      citation = `${add(author)}"${add(articleTitle, '." ')}<i>${add(siteName, ', ')}</i>${add(formattedDate, ', ')}${add(url, '.')}${accessDate ? ' Accessed ' + formattedAccess + '.' : ''}`;
    } 
    else if (format === 'chicago') {
      citation = `${add(author)}"${add(articleTitle, '." ')}${add(siteName, '. ')}${formattedDate ? 'Published ' + add(formattedDate) : ''}${url ? add(url, '.') : ''}`;
    }
  }

  // ===== BOOK =====
  else if (type === 'book') {
    const title = getVal('citeBookTitle');
    const city = getVal('citePubCity');
    const publisher = getVal('citePublisher');
    const edition = getVal('citeEdition');

    if (format === 'apa') {
      citation = `${add(author)}${add(formattedDate || '(n.d.)')}<i>${add(title)}</i>${edition ? add(edition, '. ') : ''}${add(publisher)}`;
    } 
    else if (format === 'mla') {
      citation = `${add(author)}<i>${add(title, '. ')}</i>${add(edition, ', ')}${add(publisher, ', ')}${add(year)}`;
    } 
    else if (format === 'chicago') {
      citation = `${add(author)}<i>${add(title, '. ')}</i>${add(edition, '. ')}${add(city, ': ')}${add(publisher, ', ')}${add(year)}`;
    }
  }

  // ===== JOURNAL =====
  else if (type === 'journal') {
    const journalName = getVal('citeJournalName');
    const volume = getVal('citeVolume');
    const issue = getVal('citeIssue');

    if (format === 'apa') {
      const vol = add(volume);
      const iss = issue ? `(${issue})` : '';
      const pages = pageRange ? `, ${pageRange}` : '';
      citation = `${add(author)}${add(formattedDate || '(n.d.)')}${add(articleTitle)}<i>${journalName}</i>${vol ? `, <i>${vol}</i>` : ''}${iss}${pages}.${addSpace(url)}`;
    } 
    else if (format === 'mla') {
      const vol = volume ? `vol. ${volume}, ` : '';
      const iss = issue ? `no. ${issue}, ` : '';
      const pages = pageRange ? `pp. ${pageRange}` : '';
      citation = `${add(author)}"${add(articleTitle, '." ')}<i>${add(journalName, ', ')}</i>${vol}${iss}${add(formattedDate, ', ')}${add(pages, '.')}${addSpace(url)}`;
    } 
    else if (format === 'chicago') {
      const vol = add(volume);
      const iss = issue ? `, no. ${issue} ` : ' ';
      const pages = pageRange ? `: ${pageRange}` : '';
      citation = `${add(author)}"${add(articleTitle, '." ')}<i>${add(journalName)}</i>${vol ? ' ' + vol : ''}${iss}${formattedDate || ''}${pages}.${addSpace(url)}`;
    }
  }
  
  // ===== BOOK CHAPTER =====
    else if (type === 'book-chapter') {
        const chapterTitle = getVal('citeChapterTitle');
        const bookTitle = getVal('citeBookTitle');
        const rawEditors = getVal('citeEditors');
        const editors = formatAuthors(rawEditors, format);
        const publisher = getVal('citePublisher');
        const city = getVal('citePubCity');
        
        // APA: Author. (Year). Chapter Title. In E. E. Editor (Ed.), *Book Title* (pp. xx-xx). Publisher.
        if (format === 'apa') {
            const editorFormatted = editors ? `In ${editors} (Ed${rawEditors.includes(';') ? 's' : ''}.), ` : '';
            const pages = pageRange ? ` (pp. ${pageRange})` : '';
            citation = `${add(author)}${add(formattedDate || '(n.d.)')}${add(chapterTitle)} ${editorFormatted}<i>${add(bookTitle, `${pages}.`)}</i> ${add(publisher)}`;
        }
        // MLA: Author. "Chapter Title." *Book Title*, edited by Editor Name(s), Publisher, Year, pp. xx-xx.
        else if (format === 'mla') {
            const editorFormatted = editors ? `edited by ${editors}, ` : '';
            const pages = pageRange ? `, pp. ${pageRange}` : '';
            citation = `${add(author)}"${add(chapterTitle, '." ')}<i>${add(bookTitle, ', ')}</i>${editorFormatted}${add(publisher, ', ')}${add(year, pages + '.')}`;
        }
        // Chicago: Author. "Chapter Title." In *Book Title*, edited by Editor Name(s), page range. City: Publisher, Year.
        else if (format === 'chicago') {
            const editorFormatted = editors ? `, edited by ${editors}` : '';
            const pages = pageRange ? `, ${pageRange}` : '';
            citation = `${add(author)}"${add(chapterTitle, '." ')}In <i>${bookTitle}</i>${editorFormatted}${add(pages, '. ')}${add(city, ': ')}${add(publisher, ', ')}${add(year)}`;
        }
    }

    // ===== MAGAZINE =====
    else if (type === 'magazine') {
        const magName = getVal('citeMagazineName');
        const volume = getVal('citeVolume');
        const issue = getVal('citeIssue');

        // APA: Author. (Date). Article Title. *Magazine Name, Volume*(Issue), pp-pp.
        if (format === 'apa') {
            const vol = volume ? `, <i>${volume}</i>` : '';
            const iss = issue ? `(${issue})` : '';
            const pages = pageRange ? `, ${pageRange}` : '';
            citation = `${add(author)}${add(formattedDate || '(n.d.)')}${add(articleTitle)}<i>${magName}</i>${vol}${iss}${pages}.`;
        }
        // MLA: Author. "Article Title." *Magazine Name*, vol. #, no. #, Date, pp. xx-xx.
        else if (format === 'mla') {
            const vol = volume ? `vol. ${volume}, ` : '';
            const iss = issue ? `no. ${issue}, ` : '';
            const pages = pageRange ? `, pp. ${pageRange}` : '';
            citation = `${add(author)}"${add(articleTitle, '." ')}<i>${add(magName, ', ')}</i>${vol}${iss}${add(formattedDate, ', ')}${add(pages, '.')}`;
        }
        // Chicago: Author. "Article Title." *Magazine Name*, Date.
        else if (format === 'chicago') {
            citation = `${add(author)}"${add(articleTitle, '." ')}<i>${add(magName, ', ')}</i>${add(formattedDate, '.')}`;
        }
    }

    // ===== NEWSPAPER =====
    else if (type === 'newspaper') {
        const newsName = getVal('citeNewspaperName');
        const section = getVal('citeSection');

        // APA: Author. (Date). Article Title. *Newspaper Name*, pp. A1-A2.
        if (format === 'apa') {
            const pages = pageRange ? `, p${pageRange.includes('-') ? 'p' : ''}. ${pageRange}` : '';
            citation = `${add(author)}${add(formattedDate || '(n.d.)')}${add(articleTitle)}<i>${newsName}</i>${pages}.`;
        }
        // MLA: Author. "Article Title." *Newspaper Name*, Date, pp. xx-xx.
        else if (format === 'mla') {
            const pages = pageRange ? `, p${pageRange.includes('-') ? 'p' : ''}. ${pageRange}` : '';
            citation = `${add(author)}"${add(articleTitle, '." ')}<i>${add(newsName, ', ')}</i>${add(formattedDate, '')}${pages}.`;
        }
        // Chicago: Author. "Article Title." *Newspaper Name*, Date.
        else if (format === 'chicago') {
             citation = `${add(author)}"${add(articleTitle, '." ')}<i>${add(newsName, ', ')}</i>${add(formattedDate, '.')}`;
        }
    }
    
    // ===== FILM / VIDEO =====
    else if (type === 'film') {
        const rawDirector = getVal('citeDirector'); 
        const director = formatAuthors(rawDirector, format);
        const filmTitle = getVal('citeFilmTitle');
        const studio = getVal('citeStudio');

        // APA: Director, A. A. (Director). (Year). *Film Title* [Film]. Studio.
        if (format === 'apa') {
             const dir = director ? `${director} (Director). ` : '';
             citation = `${dir}${add(formattedDate || '(n.d.)')}<i>${add(filmTitle, '.')}</i> [Film]. ${add(studio)}`;
        }
        // MLA: *Film Title*. Directed by First M. Last, Studio, Year.
        else if (format === 'mla') {
            const dir = director ? `Directed by ${director}, ` : '';
            citation = `<i>${add(filmTitle, '. ')}</i>${dir}${add(studio, ', ')}${add(year, '.')}`;
        }
        // Chicago: *Film Title*. Directed by First M. Last. Studio, Year.
        else if (format === 'chicago') {
            const dir = director ? `Directed by ${director}. ` : '';
            citation = `<i>${add(filmTitle, '. ')}</i>${dir}${add(studio, ', ')}${add(year, '.')}`;
        }
    }

  // Format and Cleanup
  if (citation) {
    citation = citation
      .replace(/\s+/g, ' ')       // Remove duplicate spaces
      .replace(/\s+([.,;:])/g, '$1') // Remove space before punctuation
      .replace(/\.\./g, '.')       // Remove duplicate periods
      .replace(/, \./g, '.')      // Remove comma before period
      .replace(/: \./g, '.')      // Remove colon before period
      .replace(/" \./g, '."')     // Fix space before quote period
      .trim();
      
    citeOutput.innerHTML = citation;
    citeCopyBtn.style.display = 'inline-block';
    citeCopyBtn.textContent = 'Copy';
  } else {
    citeOutput.innerHTML = '⚠️ Please fill in the required fields to generate a citation.';
    citeCopyBtn.style.display = 'none';
  }
}

function clearCitationForm() {
  if (citationForm) {
    const inputs = citationForm.querySelectorAll('input[type="text"]');
    inputs.forEach(input => input.value = '');
  }
  citeOutput.innerHTML = 'Your citation will appear here...';
  citeCopyBtn.style.display = 'none';
}

function copyCitation() {
  if (!citeOutput) return;

  const tempDiv = document.createElement('div');
  
  tempDiv.innerHTML = citeOutput.innerHTML;
  
  tempDiv.style.color = '#000000';
  tempDiv.style.backgroundColor = '#FFFFFF';
  
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0px';
  
  document.body.appendChild(tempDiv);
  
  const range = document.createRange();
  range.selectNode(tempDiv);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      citeCopyBtn.textContent = 'Copied!';
    } else {
      citeCopyBtn.textContent = 'Error';
    }
  } catch (err) {
    console.error('Failed to copy rich text: ', err);
    citeCopyBtn.textContent = 'Error';
  }

  selection.removeAllRanges();
  document.body.removeChild(tempDiv);
}

if (citeType) {
  citeType.addEventListener('change', updateCitationForm);
  citeFormat.addEventListener('change', generateCitation);

  citeGenerateBtn.addEventListener('click', generateCitation);
  citeClearBtn.addEventListener('click', clearCitationForm);
  citeCopyBtn.addEventListener('click', copyCitation);

  updateCitationForm();
  citeOutput.innerHTML = 'Your citation will appear here...';
}

// Diff Tool Functions
const diffOld = $('#diffOld');
const diffNew = $('#diffNew');
const diffCompareBtn = $('#diffCompareBtn');
const diffType = $('#diffType');
const diffOutput = $('#diffOutput');
const diffIgnoreWhitespace = $('#diffIgnoreWhitespace');

if (diffCompareBtn) {
  diffCompareBtn.addEventListener('click', () => {
    const oldText = diffOld.value;
    const newText = diffNew.value;
    
    const type = diffType.value;
    const ignoreWhitespace = diffIgnoreWhitespace.checked;
    
    diffOutput.innerHTML = '';

    const options = {
      ignoreWhitespace: ignoreWhitespace
    };

    let diff;
    switch (type) {
      case 'words':
        diff = Diff.diffWords(oldText, newText, options);
        break;
      case 'chars':
        let oldTextChars = oldText;
        let newTextChars = newText;
        if (ignoreWhitespace) {
          // Remove all whitespace characters
          oldTextChars = oldText.replace(/\s+/g, '');
          newTextChars = newText.replace(/\s+/g, '');
        }
        diff = Diff.diffChars(oldTextChars, newTextChars);
        break;
      case 'lines':
      default:
        diff = Diff.diffLines(oldText, newText, options);
        break;
    }

    const fragment = document.createDocumentFragment();
    let hasChanges = false;

    if (type === 'lines') {
      let oldLineNum = 1;
      let newLineNum = 1;
      
      diff.forEach(part => {
        let cssClass = part.added ? 'diff-added' : part.removed ? 'diff-removed' : 'diff-common';
        if (part.added || part.removed) hasChanges = true;
        
        const lines = part.value.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          if (i === lines.length - 1 && lines[i] === '') {
            continue; 
          }
          
          const line = lines[i];
          const numSpan = document.createElement('span');
          numSpan.className = 'line-num';
          
          const contentSpan = document.createElement('span');
          contentSpan.className = cssClass;
          contentSpan.textContent = line;
          
          if (part.added) {
            // New line: 5 spaces | 4-digit num | " + "
            numSpan.textContent = `     ${String(newLineNum).padStart(4)} + `;
            newLineNum++;
          } else if (part.removed) {
            // Old line: 4-digit num | 6 spaces | " - "
            numSpan.textContent = `${String(oldLineNum).padStart(4)}      - `;
            oldLineNum++;
          } else {
            // Common line: 4-digit old num | 1 space | 4-digit new num | "   "
            numSpan.textContent = `${String(oldLineNum).padStart(4)} ${String(newLineNum).padStart(4)}   `;
            oldLineNum++;
            newLineNum++;
          }
          
          fragment.appendChild(numSpan);
          fragment.appendChild(contentSpan);
          fragment.appendChild(document.createTextNode('\n'));
        }
      });

    } else { 
      diff.forEach(part => {
        const span = document.createElement('span');
        if (part.added) {
          span.className = 'diff-added';
          hasChanges = true;
        } else if (part.removed) {
          span.className = 'diff-removed';
          hasChanges = true;
        } else {
          span.className = 'diff-common';
        }
        span.textContent = part.value;
        fragment.appendChild(span);
      });
    }

    if (!oldText && !newText) {
      diffOutput.textContent = "Click 'Compare' to see results...";
    } else if (!hasChanges) {
      const span = document.createElement('span');
      span.className = 'diff-common';
      span.textContent = 'Texts are identical.';
      diffOutput.appendChild(span);
    } else {
      diffOutput.appendChild(fragment);
    }
  });
}