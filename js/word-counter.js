const AVG_READING_WPM = 240;
const AVG_SPEAKING_WPM = 140;

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

  if (textInput) {
    textInput.addEventListener('input', () => {
      const text = textInput.value.trim();
      // Split by whitespace to count words
      const words = text ? text.split(/\s+/).length : 0;
      
      // Update text stats
      wordCount.textContent = words;
      charCount.textContent = text.length;

      if (words === 0) {
        readingTime.textContent = '0 sec';
        speakingTime.textContent = '0 sec';
      } else {
        // Calculate times
        const readingSecs = (words / AVG_READING_WPM) * 60;
        const speakingSecs = (words / AVG_SPEAKING_WPM) * 60;
        
        // Update time displays
        readingTime.textContent = formatTime(readingSecs);
        speakingTime.textContent = formatTime(speakingSecs);
      }
    });
    
    console.log('Word Counter loaded successfully.');
  }
});