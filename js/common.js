const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// Navigation & Theme Logic
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = $('#sidebar');
  const hamburger = $('#hamburger');
  const themeSwitch = $('#themeSwitch') || null;
  const themeToggleTop = $('#themeToggle');

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

  // Load saved theme
  const saved = localStorage.getItem('theme');
  if(saved === 'light'){ 
    document.body.classList.remove('dark'); 
    if(themeSwitch) themeSwitch.checked = false; 
  } else {
    if(themeSwitch) themeSwitch.checked = true;
  }

  // Sidebar Toggle
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', ()=>{
      if(sidebar.style.transform === 'translateX(-100%)' || !sidebar.style.transform) {
        sidebar.style.transform = 'translateX(0)';
      } else {
        sidebar.style.transform = 'translateX(-100%)';
      }
    });

    document.addEventListener('click', (e) => {
      if(window.innerWidth < 900){
        if(!sidebar.contains(e.target) && !hamburger.contains(e.target)){
          sidebar.style.transform = 'translateX(-100%)';
        }
      }
    });
  }
});

document.addEventListener('html-components-loaded', () => {
  const toolItems = $$('.sidebar nav li');
  const tools = $$('.tool');
  const sidebar = $('#sidebar');

  function showTool(id){
    toolItems.forEach(i=>i.classList.toggle('active', i.dataset.tool===id));
    tools.forEach(t=>t.classList.toggle('active', t.id===id));
  }

  toolItems.forEach(item=>{
    item.addEventListener('click', ()=> {
      showTool(item.dataset.tool);
      if(window.innerWidth < 900 && sidebar) sidebar.style.transform = 'translateX(-100%)';
    });
  });

  if(window.innerWidth < 900 && sidebar) sidebar.style.transform = 'translateX(-100%)';
});

window.readFileAsArrayBuffer = function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

window.showProcessing = function(button) {
  if(!button) return;
  button.disabled = true;
  button.dataset.originalText = button.textContent;
  button.textContent = 'Processing...';
};

window.resetProcessing = function(button, originalText) {
  if(!button) return;
  button.disabled = false;
  button.textContent = originalText || button.dataset.originalText || 'Convert';
};