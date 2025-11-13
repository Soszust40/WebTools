document.addEventListener('html-components-loaded', () => {
  const $ = s => document.querySelector(s);

  const vigenereKey = $('#vigenereKey');
  const vigenereInput = $('#vigenereInput');
  const vigenereOutput = $('#vigenereOutput');
  const vigenereEncryptBtn = $('#vigenereEncryptBtn');
  const vigenereDecryptBtn = $('#vigenereDecryptBtn');
  const vigenerePreserveCase = $('#vigenerePreserveCase');
  const vigenereKeepNonAlpha = $('#vigenereKeepNonAlpha');
  const vigenereGenerateKeyBtn = $('#vigenereGenerateKeyBtn');

  if(!vigenereInput) return;

  const VIGENERE_WORD_LIST = [
    'ABILITY', 'ABROAD', 'ABUSE', 'ACCESS', 'ACCIDENT', 'ACCOUNT', 'ACTION', 'ACTIVE', 'ACTOR',
    'ADVICE', 'AFFAIR', 'AGENCY', 'AGREEMENT', 'AIRPORT', 'ALCOHOL', 'AMBITION', 'AMOUNT',
    'ANALYSIS', 'ANIMAL', 'ANSWER', 'ANXIETY', 'ANYBODY', 'APARTMENT', 'APPLE', 'APPLICATION',
    'APPOINTMENT', 'AREA', 'ARGUMENT', 'ARMY', 'ARRIVAL', 'ARTICLE', 'ARTIST', 'ASPECT',
    'ASSEMBLY', 'ASSIGNMENT', 'ASSISTANCE', 'ASSOCIATION', 'ATTENTION', 'ATTITUDE', 'AUDIENCE',
    'AUTHOR', 'AVERAGE', 'AWARD', 'BALANCE', 'BASIS', 'BEACH', 'BEGINNING', 'BENEFIT',
    'BIRTH', 'BLOOD', 'BOARD', 'BOTTOM', 'BRANCH', 'BREAD', 'BREAK', 'BREATH', 'BROTHER',
    'BUILDING', 'BUSINESS', 'BUYER', 'CABINET', 'CAMERA', 'CANCER', 'CANDIDATE', 'CAPITAL',
    'CARD', 'CAREER', 'CASE', 'CASH', 'CATEGORY', 'CAUSE', 'CELEBRATION', 'CHALLENGE',
    'CHANNEL', 'CHAPTER', 'CHARACTER', 'CHARGE', 'CHARITY', 'CHECK', 'CHEMISTRY', 'CHEST',
    'CHOCOLATE', 'CHOICE', 'CHURCH', 'CLIENT', 'CLIMATE', 'CLOTHING', 'COFFEE', 'COLLEAGUE',
    'COLLECTION', 'COLLEGE', 'COMBINATION', 'COMMITTEE', 'COMMON', 'COMMUNICATION',
    'COMMUNITY', 'COMPANY', 'COMPARISON', 'COMPETITION', 'COMPLAINT', 'COMPUTER', 'CONCEPT',
    'CONDITION', 'CONFERENCE', 'CONFIDENCE', 'CONNECTION', 'CONSEQUENCE', 'CONSTRUCTION',
    'CONTACT', 'CONTEXT', 'CONTRACT', 'CONTRIBUTION', 'CONTROL', 'CONVERSATION', 'COOKIE',
    'COUNTRY', 'COUNTY', 'COUPLE', 'COURAGE', 'COURSE', 'COUSIN', 'CREATE', 'CREDIT',
    'CRIME', 'CRITICISM', 'CULTURE', 'CURRENCY', 'CUSTOMER', 'CYCLE', 'DATABASE', 'DEALER',
    'DEBATE', 'DECISION', 'DEFINITION', 'DELIVERY', 'DEPARTMENT', 'DEPARTURE', 'DEPENDENT',
    'DEPOSIT', 'DEPRESSION', 'DEPTH', 'DESCRIPTION', 'DESIGN', 'DESK', 'DEVELOPER',
    'DIAMOND', 'DIFFERENCE', 'DIFFICULTY', 'DIRECTION', 'DIRECTOR', 'DISASTER',
    'DISCIPLINE', 'DISCUSSION', 'DISEASE', 'DISK', 'DISTRIBUTION', 'DISTRICT', 'DOCTOR',
    'DOCUMENT', 'DRIVER', 'EARTH', 'ECONOMICS', 'ECONOMY', 'EDITOR', 'EDUCATION', 'EFFECT',
    'EFFORT', 'ELECTION', 'ELECTRICITY', 'EMOTION', 'EMPLOYEE', 'EMPLOYER', 'END',
    'ENGINE', 'ENGINEER', 'ENTERTAINMENT', 'ENTRANCE', 'ENVIRONMENT', 'EQUIPMENT', 'ERROR',
    'ESTABLISHMENT', 'ESTATE', 'EVENT', 'EXAM', 'EXAMPLE', 'EXCHANGE', 'EXCITEMENT',
    'EXERCISE', 'EXPERIENCE', 'EXPERT', 'EXPLANATION', 'EXPRESSION', 'EXTENSION', 'FAILURE',
    'FAMILY', 'FARMER', 'FATHER', 'FEATURE', 'FEEDBACK', 'FIELD', 'FIGURE', 'FILM',
    'FINAL', 'FINANCE', 'FINDING', 'FIRE', 'FISH', 'FLIGHT', 'FLOWER', 'FOOD', 'FOOTBALL',
    'FORCE', 'FOREIGN', 'FOREST', 'FORM', 'FOUNDATION', 'FREEDOM', 'FRIEND', 'FUTURE',
    'GAME', 'GARDEN', 'GATE', 'GENERAL', 'GIRL', 'GOAL', 'GOLD', 'GOVERNMENT', 'GRANDFATHER',
    'GRASS', 'GROUP', 'GROWTH', 'GUIDE', 'GUITAR', 'HAIR', 'HALF', 'HALL', 'HAND',
    'HEAD', 'HEALTH', 'HEART', 'HEAT', 'HEAVY', 'HEIGHT', 'HISTORY', 'HOME', 'HOPE',
    'HOSPITAL', 'HOTEL', 'HOUR', 'HOUSE', 'HUMAN', 'HUSBAND', 'IDEA', 'IMAGE',
    'IMPACT', 'IMPORTANCE', 'IMPRESSION', 'IMPROVEMENT', 'INCOME', 'INDUSTRY', 'INFLATION',
    'INFORMATION', 'INJURY', 'INSECT', 'INSIDE', 'INSPECTION', 'INSPECTOR', 'INSTANCE',
    'INSTRUCTION', 'INSURANCE', 'INTENTION', 'INTERACTION', 'INTEREST', 'INTERNAL',
    'INTERNATIONAL', 'INTERNET', 'INTERVIEW', 'INTRODUCTION', 'INVESTIGATION', 'INVESTMENT',
    'ISSUE', 'ITEM', 'JACKET', 'JOB', 'JOURNALIST', 'JUDGEMENT', 'JUICE', 'KEY',
    'KING', 'KNOWLEDGE', 'LABORATORY', 'LADY', 'LAKE', 'LANGUAGE', 'LAWYER', 'LEADER',
    'LEADERSHIP', 'LEARNING', 'LEAST', 'LEAVE', 'LECTURE', 'LENGTH', 'LEVEL', 'LIBRARY',
    'LIFE', 'LIGHT', 'LINE', 'LINK', 'LIST', 'LITERATURE', 'LOCATION', 'LOSS',
    'LOVE', 'MACHINE', 'MAGAZINE', 'MAIL', 'MAIN', 'MAINTENANCE', 'MAJORITY', 'MAKE',
    'MANAGEMENT', 'MANAGER', 'MANNER', 'MAP', 'MARKET', 'MARKETING', 'MARRIAGE',
    'MATERIAL', 'MATHEMATICS', 'MATTER', 'MEAL', 'MEANING', 'MEASUREMENT', 'MEAT',
    'MEDIA', 'MEDICINE', 'MEDIUM', 'MEMBER', 'MEMBERSHIP', 'MEMORY', 'MENU', 'MESSAGE',
    'METAL', 'METHOD', 'MIDDLE', 'MIDNIGHT', 'MIND', 'MINUTE', 'MISSION', 'MISTAKE',
    ];

  function vigenereCipher(text, key, isDecrypt) {
    const preserveCase = vigenerePreserveCase.checked;
    const keepNonAlpha = vigenereKeepNonAlpha.checked;
    
    if (!key) { alert('Please enter a keyword.'); return ''; }

    const keyUpper = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!keyUpper.length) { alert('Keyword must contain at least one letter.'); return ''; }

    let keyIndex = 0;
    let result = '';
    const inputText = preserveCase ? text : text.toUpperCase();

    for (let i = 0; i < inputText.length; i++) {
      const char = inputText[i];
      if (char.match(/[a-zA-Z]/)) {
        const isUpperCase = (char === char.toUpperCase());
        const baseCode = isUpperCase ? 65 : 97;
        const textCharCode = inputText.charCodeAt(i);
        const keyChar = keyUpper[keyIndex % keyUpper.length];
        const shift = keyChar.charCodeAt(0) - 65;
        keyIndex++;

        let newCharCode;
        if (isDecrypt) newCharCode = (textCharCode - baseCode - shift + 26) % 26 + baseCode;
        else newCharCode = (textCharCode - baseCode + shift) % 26 + baseCode;
        
        result += String.fromCharCode(newCharCode);
      } else {
        if (keepNonAlpha) result += char;
      }
    }
    return result;
  }

  vigenereEncryptBtn.addEventListener('click', () => {
    const text = vigenereInput.value;
    const key = vigenereKey.value;
    vigenereOutput.value = vigenereCipher(text, key, false);
  });

  vigenereDecryptBtn.addEventListener('click', () => {
    if (vigenereInput.value.trim() === '' && vigenereOutput.value.trim() !== '') {
      vigenereInput.value = vigenereOutput.value;
      vigenereOutput.value = '';
    }
    const text = vigenereInput.value;
    const key = vigenereKey.value;
    vigenereOutput.value = vigenereCipher(text, key, true);
  });

  vigenereGenerateKeyBtn.addEventListener('click', () => {
    let result = '';
    const list = VIGENERE_WORD_LIST.length > 0 ? VIGENERE_WORD_LIST : ['SECRET', 'CODE', 'KEY'];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * list.length);
      result += list[randomIndex] + ' ';
    }
    vigenereKey.value = result.trim();
  });
});