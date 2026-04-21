const AVG_READING_WPM = 240;
const AVG_SPEAKING_WPM = 140;

let profanityCategoriesData = {};

// Load the JSON
fetch('data/profanityEngine.json')
  .then(response => response.json())
  .then(data => {
    profanityCategoriesData = data.categories || {};
  })
  .catch(err => console.error('Error loading profanity list.', err));

function formatTime(totalSeconds) {
  if (totalSeconds < 1) return '0 sec';
  if (totalSeconds < 60) return `${Math.ceil(totalSeconds)} sec`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (seconds === 60) return `${minutes + 1} min 0 sec`;
  return `${minutes} min ${seconds} sec`;
}

document.addEventListener('html-components-loaded', () => {
  const textInput = document.querySelector('#textInput');
  const wordCount = document.querySelector('#wordCount');
  const charCount = document.querySelector('#charCount');
  const readingTime = document.querySelector('#readingTime');
  const speakingTime = document.querySelector('#speakingTime');
  const profanityScore = document.querySelector('#profanityScore');
  const profanityCategoriesDisp = document.querySelector('#profanityCategories');

  if (textInput) {
    textInput.addEventListener('input', () => {
      const text = textInput.value.trim();
      const words = text ? text.split(/\s+/).length : 0;
      
      wordCount.textContent = words;
      charCount.textContent = text.length;

      if (words === 0) {
        readingTime.textContent = '0 sec';
        speakingTime.textContent = '0 sec';
        profanityScore.textContent = '100%';
        profanityScore.style.color = '#5cb85c'; 
        if (profanityCategoriesDisp) profanityCategoriesDisp.textContent = '';
      } else {
        const readingSecs = (words / AVG_READING_WPM) * 60;
        const speakingSecs = (words / AVG_SPEAKING_WPM) * 60;
        
        readingTime.textContent = formatTime(readingSecs);
        speakingTime.textContent = formatTime(speakingSecs);

        let totalProfanityCount = 0;
        let triggeredCategories = new Set();
        const lowerText = text.toLowerCase();

        // Iterate through the categories object
        for (const [categoryName, wordsList] of Object.entries(profanityCategoriesData)) {
          if (Array.isArray(wordsList)) {
            for (const badWord of wordsList) {
              const escapedWord = badWord.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`\\b${escapedWord}\\b`, 'g');
              
              const matches = lowerText.match(regex);
              if (matches) {
                totalProfanityCount += matches.length;
                triggeredCategories.add(categoryName);
              }
            }
          }
        }

        // Logic: (Total Words - Bad Words) / Total Words
        let cleanRatio = (words - totalProfanityCount) / words;
        if (cleanRatio < 0) cleanRatio = 0; 
        let score = cleanRatio * 100;

        profanityScore.textContent = score.toFixed(1) + '%';

        if (score >= 95) {
          profanityScore.style.color = '#5cb85c'; // Green (100-95)
          if (profanityCategoriesDisp) profanityCategoriesDisp.textContent = '';
        } else if (score >= 75) {
          profanityScore.style.color = '#f0ad4e'; // Yellow (75-94)
        } else {
          profanityScore.style.color = '#d9534f'; // Red (Below 75)
        }

        // Update category flags display
        if (profanityCategoriesDisp && score < 95) {
          const catList = Array.from(triggeredCategories);
          profanityCategoriesDisp.textContent = catList.length > 0 ? `(Flags: ${catList.join(', ')})` : '';
        }
      }
    });
  }
});