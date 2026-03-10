document.addEventListener('html-components-loaded', () => {
  const $ = s => document.querySelector(s);

  const compressInput = $('#compressInput');
  const compressDrop = $('#compressDrop');
  const compressorWorkspace = $('#compressorWorkspace');
  const compressFormat = $('#compressFormat');
  const compressQuality = $('#compressQuality');
  const compressQualityVal = $('#compressQualityVal');
  const downloadCompressedBtn = $('#downloadCompressedBtn');
  
  const origSizeEl = $('#origSize');
  const newSizeEl = $('#newSize');
  const savedPercentEl = $('#savedPercent');
  const compressPreviewImg = $('#compressPreviewImg');
  const compressStats = $('#compressStats');
    const previewWrapper = $('#previewWrapper');

  let currentFile = null;
  let currentImageObject = null;
  let compressedBlob = null;

  if (!compressInput) return;

  // Format bytes to a human-readable string
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Handle Drag & Drop
  if (compressDrop) {
    compressDrop.addEventListener('dragover', (e) => { e.preventDefault(); compressDrop.classList.add('dragover'); });
    compressDrop.addEventListener('dragleave', () => compressDrop.classList.remove('dragover'));
    compressDrop.addEventListener('drop', (e) => { 
      e.preventDefault(); 
      compressDrop.classList.remove('dragover'); 
      if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]); 
    });
  }

  compressInput.addEventListener('change', (e) => {
    if (e.target.files.length) loadFile(e.target.files[0]);
  });

  function loadFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }
    currentFile = file;
    origSizeEl.textContent = formatBytes(file.size);
    
    compressorWorkspace.style.display = 'block';
    compressStats.style.display = 'flex';
    previewWrapper.style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImageObject = img;
        processCompression();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function processCompression() {
    if (!currentImageObject) return;

    const canvas = document.createElement('canvas');
    canvas.width = currentImageObject.width;
    canvas.height = currentImageObject.height;
    const ctx = canvas.getContext('2d');
    
    // Draw original image to canvas
    ctx.drawImage(currentImageObject, 0, 0);

    const format = compressFormat.value;
    const quality = parseInt(compressQuality.value, 10) / 100;

    canvas.toBlob((blob) => {
      compressedBlob = blob;
      
      // Update UI stats
      newSizeEl.textContent = formatBytes(blob.size);
      
      const savedBytes = currentFile.size - blob.size;
      const savedPct = (savedBytes / currentFile.size) * 100;
      
      if (savedPct > 0) {
        savedPercentEl.textContent = savedPct.toFixed(1) + '%';
        savedPercentEl.style.color = '#5cb85c';
      } else {
        savedPercentEl.textContent = '0% (Larger)';
        savedPercentEl.style.color = '#d9534f';
      }

      // Update Preview
      if (compressPreviewImg.src) URL.revokeObjectURL(compressPreviewImg.src);
      compressPreviewImg.src = URL.createObjectURL(blob);
      
    }, format, quality);
  }

  // Listeners for live preview
  compressQuality.addEventListener('input', (e) => {
    compressQualityVal.textContent = e.target.value;
    // Debounce slightly for performance on large images
    clearTimeout(window.compressTimeout);
    window.compressTimeout = setTimeout(processCompression, 150);
  });

  compressFormat.addEventListener('change', processCompression);

  downloadCompressedBtn.addEventListener('click', () => {
    if (!compressedBlob) return;
    
    // Generate new filename
    const ext = compressFormat.value === 'image/jpeg' ? '.jpg' : '.webp';
    const newName = currentFile.name.replace(/\.[^/.]+$/, "") + "-compressed" + ext;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedBlob);
    link.download = newName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});