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

/* Convert File to Format */
function convertFileToFormat(file, opts={}){
  // Updated options
  const {targetFormat='png', width=null, height=null, quality=0.92, invert=false} = opts;
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Updated sizing logic
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
        
        // Apply invert filter if checked
        if (invert) {
            ctx.filter = 'invert(1)';
        }
        
        ctx.drawImage(img, 0, 0, w, h);

        if(targetFormat === 'ico'){
          const pngDataUrl = canvas.toDataURL('image/png');
          const pngBytes = dataURLToUint8Array(pngDataUrl);
          const ico = buildIcoFromPng(pngBytes);
          resolve({name: file.name.replace(/\.[^.]+$/, '') + '.ico', blob: new Blob([ico], {type:'image/x-icon'})});
          return;
        } else if(targetFormat === 'icns'){
          const pngDataUrl = canvas.toDataURL('image/png');
          const pngBytes = dataURLToUint8Array(pngDataUrl);
          const icns = buildIcnsFromPng(pngBytes);
          resolve({name: file.name.replace(/\.[^.]+$/, '') + '.icns', blob: new Blob([icns], {type:'application/octet-stream'})});
          return;
        } else {
          const mime = targetFormat === 'jpg' ? 'image/jpeg' : 'image/' + targetFormat;
          canvas.toBlob(blob => {
            resolve({name: file.name.replace(/\.[^.]+$/, '') + '.' + targetFormat, blob});
          }, mime, targetFormat === 'jpg' ? quality : quality);
        }
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function convertAndDownload(files){
  const fmt = formatSelect.value;
  // Read Settings
  const width = resizeWidthInput.value ? Number(resizeWidthInput.value) : null;
  const height = resizeHeightInput.value ? Number(resizeHeightInput.value) : null;
  const invert = invertColorsCheck.checked;
  const quality = Number(qualitySlider.value) || 0.92;
  
  if(files.length === 0) return alert('No files selected');

  const options = {targetFormat: fmt, width, height, invert, quality};

  if(files.length === 1){
    const res = await convertFileToFormat(files[0], options);
    const url = URL.createObjectURL(res.blob);
    const a = document.createElement('a'); a.href = url; a.download = res.name; a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const zip = new JSZip();
  for(const f of files){
    const res = await convertFileToFormat(f, options);
    zip.file(res.name, res.blob);
  }
  const content = await zip.generateAsync({type:'blob'});
  saveAs(content, `converted_images.zip`);
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

generateQR.addEventListener('click', async ()=>{
  const txt = qrText.value.trim();
  if(!txt) return alert('Enter text or URL for QR code.');
  const size = Number(qrSize.value) || 200;
  qrCanvas.width = size; qrCanvas.height = size;
  await QRCode.toCanvas(qrCanvas, txt, {width:size});
  saveQR.style.display='inline-block';
});
saveQR.addEventListener('click', ()=>{
  const url = qrCanvas.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = 'qr-code.png'; a.click();
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


