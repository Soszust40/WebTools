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
  pdfCombineInput.addEventListener('change', (e) => {
    if (e.target.files.length === 0) return;
    combineFiles = Array.from(e.target.files);
    pdfCombineDrop.querySelector('span').textContent = `${combineFiles.length} files selected`;
    pdfCombineBtn.style.display = 'block';
    pdfCombineClear.style.display = 'block';
  });

  pdfCombineBtn.addEventListener('click', async () => {
    if (combineFiles.length < 2) return alert('Please select at least two PDF files.');
    showProcessing(pdfCombineBtn);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of combineFiles) {
        const arrayBuffer = await readFileAsArrayBuffer(file);
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