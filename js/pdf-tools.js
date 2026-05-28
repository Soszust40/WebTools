document.addEventListener('html-components-loaded', () => {
  const $ = s => document.querySelector(s);
  
  if(typeof PDFLib === 'undefined') { console.warn('PDFLib not loaded'); return; }
  const { PDFDocument } = PDFLib;

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

  if(!pdfCompressInput) return;

  let compressFile = null;
  let combineFiles = [];
  let splitFile = null;

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
      alert('Compression error: ' + err.message);
    }
    resetProcessing(pdfCompressBtn, 'Compress');
  });

  // Combine PDFs
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const pdfCombineList = $('#pdfCombineList');
  let draggedItem = null;

  // Render PDF Thumbnail using PDF.js
  async function generateThumbnail(url, index) {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        const canvas = document.getElementById(`pdf-thumb-canvas-${index}`);
        const loader = document.getElementById(`pdf-thumb-loader-${index}`);
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 1.0 });
        const scale = Math.min(50 / viewport.width, 65 / viewport.height) * 2; 
        const scaledViewport = page.getViewport({ scale: scale });

        const context = canvas.getContext('2d');
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
        };
        
        await page.render(renderContext).promise;
        
        if (loader) loader.style.display = 'none';
        canvas.style.display = 'block';
    } catch (err) {
        console.error('Error generating thumbnail:', err);
        const loader = document.getElementById(`pdf-thumb-loader-${index}`);
        if(loader) loader.textContent = 'PDF'; // Fallback text on error
    }
  }

  function renderCombineList() {
    if (combineFiles.length === 0) {
      pdfCombineList.style.display = 'none';
      pdfCombineBtn.style.display = 'none';
      pdfCombineClear.style.display = 'none';
      pdfCombineDrop.querySelector('span').textContent = 'Drag & drop PDFs to combine';
      return;
    }

    pdfCombineList.style.display = 'flex';
    pdfCombineBtn.style.display = 'block';
    pdfCombineClear.style.display = 'block';
    pdfCombineDrop.querySelector('span').textContent = `Add more PDFs (Current: ${combineFiles.length})`;
    
    pdfCombineList.innerHTML = '';
    
    combineFiles.forEach((fileObj, index) => {
      const item = document.createElement('div');
      item.className = 'pdf-sortable-item';
      item.draggable = true;
      item.dataset.index = index;

      if (!fileObj.blobUrl) fileObj.blobUrl = URL.createObjectURL(fileObj.file);

      const sizeMb = (fileObj.file.size / (1024 * 1024)).toFixed(2);

      item.innerHTML = `
        <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
        <div class="pdf-item-preview">
          <span class="pdf-preview-loading" id="pdf-thumb-loader-${index}">Load...</span>
          <canvas id="pdf-thumb-canvas-${index}" style="display:none;"></canvas>
        </div>
        <div class="pdf-item-info">
          <span class="pdf-item-name">${fileObj.file.name}</span>
          <span class="pdf-item-size">${sizeMb} MB</span>
        </div>
        <button class="pdf-item-remove" data-idx="${index}" title="Remove file"><i class="fa-solid fa-trash"></i></button>
      `;

      // Drag and Drop Listeners
      item.addEventListener('dragstart', function(e) {
          draggedItem = item;
          setTimeout(() => item.classList.add('dragging'), 0);
      });

      item.addEventListener('dragend', function() {
          setTimeout(() => {
              draggedItem.classList.remove('dragging');
              draggedItem = null;
              updateCombineFilesOrder();
          }, 0);
      });

      item.addEventListener('dragover', function(e) {
          e.preventDefault();
          const afterElement = getDragAfterElement(pdfCombineList, e.clientY);
          if (afterElement == null) pdfCombineList.appendChild(draggedItem);
          else pdfCombineList.insertBefore(draggedItem, afterElement);
      });

      item.querySelector('.pdf-item-remove').addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          URL.revokeObjectURL(combineFiles[idx].blobUrl);
          combineFiles.splice(idx, 1);
          renderCombineList();
      });

      pdfCombineList.appendChild(item);

      // Trigger the thumbnail generation
      if (typeof pdfjsLib !== 'undefined') {
          generateThumbnail(fileObj.blobUrl, index);
      }
    });
  }

  // Calculate where to drop the item based on cursor Y position
  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.pdf-sortable-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Sync the array with the new HTML DOM order
  function updateCombineFilesOrder() {
      const newOrder = [];
      const items = pdfCombineList.querySelectorAll('.pdf-sortable-item');
      items.forEach(item => {
          const oldIndex = parseInt(item.dataset.index);
          newOrder.push(combineFiles[oldIndex]);
      });
      combineFiles = newOrder;
      renderCombineList(); 
  }

  // Input change listener
  pdfCombineInput.addEventListener('change', (e) => {
    if (e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files).map(file => ({ file: file, blobUrl: null }));
    combineFiles = [...combineFiles, ...newFiles];
    renderCombineList();
    e.target.value = '';
  });

  // Combine button
  pdfCombineBtn.addEventListener('click', async () => {
    if (combineFiles.length < 2) return alert('Please select at least two PDF files.');
    showProcessing(pdfCombineBtn);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const fileObj of combineFiles) {
        const arrayBuffer = await readFileAsArrayBuffer(fileObj.file);
        const pdf = await PDFDocument.load(arrayBuffer);
        const pageIndices = pdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      saveAs(blob, 'combined.pdf');
    } catch (err) {
      console.error(err);
      alert('Combine error: ' + err.message);
    }
    resetProcessing(pdfCombineBtn, 'Combine Files');
  });

  pdfCombineClear.addEventListener('click', () => {
    combineFiles.forEach(f => { if(f.blobUrl) URL.revokeObjectURL(f.blobUrl); });
    combineFiles = [];
    pdfCombineInput.value = '';
    renderCombineList();
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
            if (i > 0 && i <= maxPage) indices.add(i - 1);
          }
        }
      } else {
        const pageNum = Number(part);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPage) indices.add(pageNum - 1);
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
      
      if (pageIndices.length === 0) throw new Error('No valid pages selected.');

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      saveAs(blob, `split_${splitFile.name}`);
    } catch (err) {
      console.error(err);
      alert('Split error: ' + err.message);
    }
    resetProcessing(pdfSplitBtn, 'Split');
  });

  // Clear Buttons
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

  // Drag Handlers
  [pdfCompressDrop, pdfCombineDrop, pdfSplitDrop].forEach(dropZone => {
    if(!dropZone) return;
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const input = dropZone.querySelector('input[type="file"]');
      if (input) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
});