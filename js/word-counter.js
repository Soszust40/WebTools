const AVG_READING_WPM = 240;
const AVG_SPEAKING_WPM = 140;

/**
 * AI Fingerprints & Transitions
 */
const AI_FINGERPRINTS = [
  /\bdelve(?: into)?\b/gi, /\bunderscore(?:s)?\b/gi, /\bpivotal\b/gi, /\brealm\b/gi,
  /\bharness\b/gi, /\billuminate\b/gi, /\bthat being said\b/gi, /\bat its core\b/gi,
  /\bto put it simply\b/gi, /\bunderscores the importance of\b/gi,
  /\ba key takeaway is\b/gi, /\bfrom a broader perspective\b/gi,
  /\bshed light on\b/gi, /\bfacilitate\b/gi, /\brefine\b/gi, /\bbolster(?:ed)?\b/gi,
  /\bdifferentiate\b/gi, /\bstreamline\b/gi, /\ba testament to\b/gi,
  /\btapestry of\b/gi, /\blandscape of\b/gi, /\balign with\b/gi, /\bintricacies\b/gi, 
  /\bmeticulous(?:ly)?\b/gi, /\bshowcase(?:s|ing)?\b/gi, /\bstands as\b/gi, 
  /\bserves as\b/gi, /\bsetting the stage for\b/gi
];

/**
 * AI Hedging, Qualifiers & Weasel Words
 */
const AI_QUALIFIERS = [
  /\bgenerally speaking\b/gi, /\btypically\b/gi, /\btends to\b/gi, 
  /\barguably\b/gi, /\bto some extent\b/gi, /\bbroadly speaking\b/gi,
  /\bit appears that\b/gi, /\bpotentially\b/gi, /\bobservers have cited\b/gi, 
  /\bexperts argue\b/gi, /\bsome critics argue\b/gi
];

/**
 * Buzzwords
 */
const AI_BUZZWORDS = [
  /\brevolutionize\b/gi, /\binnovative\b/gi, /\bcutting-edge\b/gi, 
  /\bgame-changing\b/gi, /\btransformative\b/gi, /\bseamless integration\b/gi, 
  /\bscalable solution\b/gi, /\belevate\b/gi, /\bunlock\b/gi, /\bboasts a\b/gi, 
  /\bvibrant\b/gi, /\bnestled\b/gi, /\bin the heart of\b/gi, /\bdiverse array\b/gi, 
  /\bgroundbreaking\b/gi
];

/**
 * AI Structure
 */
const AI_STRUCTURES = [
  /\bnot only\b.{1,30}\bbut\b/gi, 
  /\bnot just\b.{1,30}\bit'?s\b/gi,
  /\bdespite its\b.{1,50}\bfaces several challenges\b/gi,
  /\bchallenges and future directions\b/gi,
  /\bas of my last knowledge update\b/gi, 
  /\bwhile specific details are limited\b/gi,
  /\bbased on available information\b/gi
];

let profanityCategoriesData = {};

// Load the Profanity JSON
fetch('data/profanityEngine.json')
  .then(response => response.json())
  .then(data => {
    profanityCategoriesData = data.categories || {};
  })
  .catch(err => console.error('Error loading profanity list.', err));

function formatTime(totalSeconds) {
  if (totalSeconds < 1) return '0 sec';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return seconds === 60 ? `${minutes + 1} min 0 sec` : `${minutes} min ${seconds} sec`;
}

function calculateAIProbability(text, wordsCount) {
  const aiScoreDisp = document.querySelector('#aiScore');
  const aiNote = document.querySelector('#aiNote');

  if (wordsCount < 25) {
    if (aiScoreDisp) aiScoreDisp.textContent = '---';
    if (aiNote) aiNote.textContent = 'Minimum 25 words required for analysis.';
    return;
  }

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const wordsArray = text.toLowerCase().match(/\w+/g) || [];

  // Burstiness - AI tends to have more uniform sentence lengths
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  let burstinessContribution = Math.max(0, 40 - (stdDev * 3.5));

  // Human Flourishes - Em-dashes, semicolons, contractions
  const emDashes = (text.match(/—|--/g) || []).length;
  const semicolons = (text.match(/;/g) || []).length;
  const contractions = (text.match(/\b\w+n't\b|\bI'm\b|\bit's\b|\byou're\b|\bwe've\b/gi) || []).length;
  
  const humanBonus = (semicolons * 6) + (contractions * 2);
  
  let emDashPenalty = 0;
  if (emDashes > Math.max(1, wordsCount / 50)) {
    emDashPenalty = emDashes * 4;
  }

  // AI Trigger Analysis - Each match adds to AI weight and tracks category flags
  let aiWeights = 0;
  let triggeredAICategories = new Set();

  AI_FINGERPRINTS.forEach(r => { 
    if (text.match(r)) { aiWeights += 12; triggeredAICategories.add("Fingerprints/Transitions"); } 
  });
  AI_QUALIFIERS.forEach(r => { 
    if (text.match(r)) { aiWeights += 8; triggeredAICategories.add("Weasel Words/Qualifiers"); } 
  });
  AI_BUZZWORDS.forEach(r => { 
    if (text.match(r)) { aiWeights += 10; triggeredAICategories.add("Buzzwords/Puffery"); } 
  });
  AI_STRUCTURES.forEach(r => { 
    if (text.match(r)) { aiWeights += 15; triggeredAICategories.add("Rigid Structures/Disclaimers"); } 
  });

  if (emDashPenalty > 0) {
    triggeredAICategories.add("Excessive Em-dashes");
  }

  // Vocabulary diversity (Type-Token Ratio) - AI tends to have lower TTR due to repetition
  const uniqueWords = new Set(wordsArray).size;
  const ttr = (uniqueWords / wordsCount) * 100;
  let vocabAIContribution = Math.max(0, (55 - ttr) * 1.2);

  // Final Score Calculation
  let score = (burstinessContribution + Math.min(aiWeights, 120) + vocabAIContribution + emDashPenalty) - humanBonus;
  score = Math.max(5, Math.min(Math.round(score), 99));

  if (aiScoreDisp) {
    aiScoreDisp.textContent = `${score}%`;
    aiScoreDisp.style.color = score > 70 ? '#d9534f' : score > 35 ? '#f0ad4e' : '#5cb85c';
  }

  if (aiNote) {
    let noteText = "";
    if (score < 30) noteText = "Strong human markers: variable length, contractions, and unique phrasing.";
    else if (score < 70) noteText = "Mixed markers: likely human-edited or highly formalized academic/PR writing.";
    else noteText = "High AI probability: repetitive structures, puffery, and robotic transitions detected.";

    if (triggeredAICategories.size > 0) {
      noteText += ` (Flags: ${Array.from(triggeredAICategories).join(', ')})`;
    }
    
    aiNote.textContent = noteText;
  }
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

      calculateAIProbability(text, words);

      if (words === 0) {
        readingTime.textContent = '0 sec';
        speakingTime.textContent = '0 sec';
        profanityScore.textContent = '100.0%';
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

        for (const [categoryName, wordsList] of Object.entries(profanityCategoriesData)) {
          if (Array.isArray(wordsList)) {
            for (const badWord of wordsList) {
              const regex = new RegExp(`\\b${badWord.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
              const matches = lowerText.match(regex);
              if (matches) {
                totalProfanityCount += matches.length;
                triggeredCategories.add(categoryName);
              }
            }
          }
        }

        let pScoreVal = Math.max(0, ((words - totalProfanityCount) / words) * 100);
        profanityScore.textContent = pScoreVal.toFixed(1) + '%';
        profanityScore.style.color = pScoreVal >= 95 ? '#5cb85c' : pScoreVal >= 75 ? '#f0ad4e' : '#d9534f';

        if (profanityCategoriesDisp) {
          const catList = Array.from(triggeredCategories);
          profanityCategoriesDisp.textContent = (catList.length > 0 && pScoreVal < 95) ? `Categories Flagged: ${catList.join(', ')}` : '';
        }
      }
    });
  }
});