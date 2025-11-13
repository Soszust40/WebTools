async function loadHTMLComponents() {
  const includes = document.querySelectorAll('[data-include]');
  
  const promises = Array.from(includes).map(async (el) => {
    const file = el.getAttribute('data-include');
    try {
      const response = await fetch(file);
      if (response.ok) {
        const html = await response.text();
        el.outerHTML = html;
      } else {
        console.error(`Could not load ${file}: ${response.statusText}`);
      }
    } catch (err) {
      console.error(`Error loading ${file}:`, err);
    }
  });

  // Wait for all HTML to be loaded
  await Promise.all(promises);

  document.dispatchEvent(new Event('html-components-loaded'));
}

loadHTMLComponents();