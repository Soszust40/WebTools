document.addEventListener('html-components-loaded', () => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const citeType = $('#citeType');
  const citeFormat = $('#citeFormat');
  const citationForm = $('#citationForm');
  const citeGroups = $$('.cite-group');
  const citeGenerateBtn = $('#citeGenerateBtn');
  const citeClearBtn = $('#citeClearBtn');
  const citeCopyBtn = $('#citeCopyBtn');
  const citeOutput = $('#citeOutput');

  if(!citeType) return;

  function formatAuthors(authorStr, format) {
    if (!authorStr) return '';
    const authors = authorStr.split(';').map(a => a.trim()).filter(Boolean);
    const formatted = authors.map(name => {
      const parts = name.split(',');
      const lastName = parts[0] ? parts[0].trim() : name;
      let givenNames = parts[1] ? parts[1].trim() : '';
      if (format === 'apa') {
        if (!givenNames) return lastName;
        const initials = givenNames.split(/\s+/).map(n => n[0].toUpperCase() + '.').join(' ');
        return `${lastName}, ${initials}`;
      } else {
        if (!givenNames) return lastName;
        return `${givenNames} ${lastName}`;
      }
    });

    if (formatted.length === 0) return '';
    if (formatted.length === 1) return formatted[0];

    if (format === 'apa') {
      const last = formatted.pop();
      return formatted.join(', ') + ' & ' + last;
    } else {
      if (formatted.length === 2) return formatted.join(' and ');
      if (formatted.length >= 3 && format === 'mla') return `${formatted[0]}, et al.`;
      const last = formatted.pop();
      return formatted.join(', ') + ', and ' + last;
    }
  }

  function formatDate(dateStr, format) {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map(Number);
    const [year, month, day] = parts;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
      // Simple reset logic
      const inputs = citationForm.querySelectorAll('input');
      inputs.forEach(i => i.value = '');
      citeOutput.innerHTML = 'Your citation will appear here...';
      citeCopyBtn.style.display = 'none';
  }

  function copyCitation() {
      const text = citeOutput.innerText;
      navigator.clipboard.writeText(text).then(() => {
          citeCopyBtn.textContent = 'Copied!';
          setTimeout(() => citeCopyBtn.textContent = 'Copy', 2000);
      });
  }

  citeType.addEventListener('change', updateCitationForm);
  citeFormat.addEventListener('change', generateCitation);
  citeGenerateBtn.addEventListener('click', generateCitation);
  citeClearBtn.addEventListener('click', clearCitationForm);
  citeCopyBtn.addEventListener('click', copyCitation);
  updateCitationForm();
});