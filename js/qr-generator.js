document.addEventListener('html-components-loaded', () => {
  const $ = s => document.querySelector(s);

  const qrText = $('#qrText');
  const generateQR = $('#generateQR');
  const qrCanvas = $('#qrCanvas');
  const saveQR = $('#saveQR');
  const qrSize = $('#qrSize');

  if(!qrText) return;

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
      color: { dark: fgColor, light: bgColor }
    };

    try {
      await QRCode.toCanvas(qrCanvas, txt, options);
      saveQR.style.display = 'inline-block';
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      alert('Failed to generate QR code.');
    }
  });

  saveQR.addEventListener('click', () => {
    const url = qrCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code.png';
    a.click();
  });
});