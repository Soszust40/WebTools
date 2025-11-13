document.addEventListener('html-components-loaded', () => {
  const $ = s => document.querySelector(s);

  const sortBtn = $('#sortBtn');
  const listInput = $('#listInput');
  const listOutput = $('#listOutput');
  const uniqueOnly = $('#uniqueOnly');
  const caseSensitive = $('#caseSensitive');
  const numericSort = $('#numericSort');
  const sortOrder = $('#sortOrder');
  const clearList = $('#clearList');

  if(!sortBtn) return;

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

  clearList.addEventListener('click', ()=>{ 
    listInput.value=''; 
    listOutput.value=''; 
  });
});