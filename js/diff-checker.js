document.addEventListener('html-components-loaded', () => {
  const $ = s => document.querySelector(s);
  
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
      // Ensure "Diff" library is loaded
      if(typeof Diff === 'undefined') { diffOutput.textContent = "Diff library not loaded."; return; }

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
});