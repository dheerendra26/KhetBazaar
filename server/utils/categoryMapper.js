/**
 * categoryMapper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Maps any user-typed product name (in Hindi, English, regional variants,
 * partial names, plurals) to one of the four platform categories:
 *   "vegetable" | "fruit" | "dairy" | "seeds"
 *
 * Structure of SYNONYM_MAP:
 *   Key   → canonical product name (display label, title-cased)
 *   Value → { category, synonyms[] }
 *
 * resolveCategory(inputName) → { canonical, category, confidence }
 *   confidence: "exact" | "synonym" | "fuzzy" | "default"
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SYNONYM_MAP = {

  // ── VEGETABLES ─────────────────────────────────────────────────────────────
  "Potato": {
    category: "vegetable",
    synonyms: [
      "aloo", "alu", "allo", "allu", "alloo", "alou", "aluoo",
      "aaloo", "aalo", "aloo sabzi",
      "potato", "potatoes", "brown potato", "white potato",
      "baby potato", "sweet potato",
      "batata", "urulaikizhangu", "bangala dumpa", "آلو", "आलू",
    ],
  },
  "Tomato": {
    category: "vegetable",
    synonyms: [
      "tamatar", "tamaatar", "tamater", "tmaatar", "tamato", "tamtar",
      "tomoto", "tomato", "tomatoes",
      "red tomato", "cherry tomato", "country tomato",
      "thakkali", "tameta", "टमाटर",
    ],
  },
  "Onion": {
    category: "vegetable",
    synonyms: [
      "pyaz", "pyaaz", "pyaj", "onion", "onions",
      "red onion", "white onion", "small onion", "shallot",
      "vengayam", "ullipaya", "kandha", "प्याज",
    ],
  },
  "Garlic": {
    category: "vegetable",
    synonyms: [
      "lahsun", "lasun", "lehsun", "garlic", "garlic bulb",
      "poondu", "vellulli", "लहसुन",
    ],
  },
  "Ginger": {
    category: "vegetable",
    synonyms: [
      "adrak", "adrakh", "adarak", "ginger", "fresh ginger",
      "inji", "allam", "अदरक",
    ],
  },
  "Cauliflower": {
    category: "vegetable",
    synonyms: [
      "phool gobhi", "phool gobi", "phoolgobi", "cauliflower",
      "gobi", "gobhi", "फूलगोभी",
    ],
  },
  "Cabbage": {
    category: "vegetable",
    synonyms: [
      "patta gobhi", "patta gobi", "band gobhi", "bandgobi",
      "cabbage", "band gобhи", "पत्तागोभी",
    ],
  },
  "Carrot": {
    category: "vegetable",
    synonyms: [
      "gajar", "gaajar", "carrot", "carrots", "red carrot",
      "desi carrot", "गाजर",
    ],
  },
  "Spinach": {
    category: "vegetable",
    synonyms: [
      "palak", "paalak", "spinach", "saag", "palak saag",
      "keerai", "spinach leaves", "पालक",
    ],
  },
  "Brinjal": {
    category: "vegetable",
    synonyms: [
      "baingan", "baigan", "begun", "eggplant", "brinjal", "aubergine",
      "kathirikkai", "vankaya", "ringna", "बैंगन",
    ],
  },
  "Ladyfinger": {
    category: "vegetable",
    synonyms: [
      "bhindi", "bhendi", "ladyfinger", "lady finger", "okra",
      "ladies finger", "vendakkai", "बेंडी", "भिंडी",
    ],
  },
  "Peas": {
    category: "vegetable",
    synonyms: [
      "matar", "mattar", "mutter", "peas", "green peas", "hara matar",
      "fresh peas", "pattani", "मटर",
    ],
  },
  "Capsicum": {
    category: "vegetable",
    synonyms: [
      "shimla mirch", "shimla mirchi", "capsicum", "bell pepper",
      "green pepper", "red pepper", "yellow pepper", "शिमला मिर्च",
    ],
  },
  "Green Chilli": {
    category: "vegetable",
    synonyms: [
      "hari mirch", "hari mirchi", "mirchi", "mircha", "mirchee",
      "lal mirch", "green chilli", "green chili",
      "chilli", "chili", "chilly", "mirch", "hari mirch wali",
      "हरी मिर्च", "मिर्ची",
    ],
  },
  "Cucumber": {
    category: "vegetable",
    synonyms: [
      "kheera", "khira", "kheere", "cucumber", "desi cucumber",
      "vellarikkai", "dosakaya", "खीरा",
    ],
  },
  "Pumpkin": {
    category: "vegetable",
    synonyms: [
      "kaddu", "kaddoo", "sitaphal", "pumpkin", "yellow pumpkin",
      "poosanikai", "kumbalakaya", "कद्दू",
    ],
  },
  "Bottle Gourd": {
    category: "vegetable",
    synonyms: [
      "lauki", "ghiya", "doodhi", "bottle gourd", "calabash",
      "sorakkai", "anapakaya", "लौकी", "घीया",
    ],
  },
  "Bitter Gourd": {
    category: "vegetable",
    synonyms: [
      "karela", "karaila", "bitter gourd", "bitter melon",
      "pavakkai", "kakarakaya", "करेला",
    ],
  },
  "Radish": {
    category: "vegetable",
    synonyms: [
      "mooli", "muli", "radish", "white radish", "desi radish",
      "mullangi", "मूली",
    ],
  },
  "Beetroot": {
    category: "vegetable",
    synonyms: [
      "chukandar", "beetroot", "beet", "red beet", "चुकंदर",
    ],
  },
  "Sweet Corn": {
    category: "vegetable",
    synonyms: [
      "bhutta", "bhutte", "makka", "corn", "maize", "sweet corn",
      "corn cob", "मक्का", "भुट्टा",
    ],
  },
  "Coriander": {
    category: "vegetable",
    synonyms: [
      "dhaniya", "dhania", "dhanya", "coriander", "cilantro",
      "kothamalli", "kothimira", "धनिया",
    ],
  },
  "Fenugreek": {
    category: "vegetable",
    synonyms: [
      "methi", "methi saag", "fenugreek", "methi leaves",
      "venthayakeerai", "menthi", "मेथी",
    ],
  },
  "Mushroom": {
    category: "vegetable",
    synonyms: [
      "mushroom", "khumb", "khumbi", "dhingri", "oyster mushroom",
      "button mushroom", "मशरूम",
    ],
  },

  // ── FRUITS ─────────────────────────────────────────────────────────────────
  "Mango": {
    category: "fruit",
    synonyms: [
      "aam", "aaam", "mango", "mangoes", "raw mango",
      "alphonso", "kesar", "dasheri", "langra", "totapuri",
      "maangai", "mamidi", "आम",
    ],
  },
  "Banana": {
    category: "fruit",
    synonyms: [
      "kela", "kele", "banana", "bananas", "plantain",
      "raw banana", "green banana", "elaichi banana",
      "vazhai pazham", "aratipandu", "केला",
    ],
  },
  "Apple": {
    category: "fruit",
    synonyms: [
      "seb", "sev", "apple", "apples", "red apple", "green apple",
      "kashmiri apple", "shimla apple", "सेब",
    ],
  },
  "Grapes": {
    category: "fruit",
    synonyms: [
      "angur", "angoor", "grapes", "black grapes", "green grapes",
      "seedless grapes", "draksha", "द्राक्षा", "अंगूर",
    ],
  },
  "Orange": {
    category: "fruit",
    synonyms: [
      "santra", "narangi", "orange", "oranges", "nagpur orange",
      "kamala", "naranja", "संतरा",
    ],
  },
  "Papaya": {
    category: "fruit",
    synonyms: [
      "papita", "papaya", "raw papaya", "green papaya",
      "pappali", "boppai", "पपीता",
    ],
  },
  "Watermelon": {
    category: "fruit",
    synonyms: [
      "tarbooz", "tarbuj", "watermelon", "water melon",
      "tharboocha", "puchakaya", "तरबूज",
    ],
  },
  "Guava": {
    category: "fruit",
    synonyms: [
      "amrood", "amrud", "guava", "peru", "jam",
      "koyya pazham", "జామ", "अमरूद",
    ],
  },
  "Pomegranate": {
    category: "fruit",
    synonyms: [
      "anar", "anaar", "pomegranate", "dalimb",
      "mathulai", "danimma", "अनार",
    ],
  },
  "Lemon": {
    category: "fruit",
    synonyms: [
      "nimbu", "nimboo", "lemon", "lime", "nimbi",
      "elumichai", "nimmakaya", "नींबू",
    ],
  },
  "Pineapple": {
    category: "fruit",
    synonyms: [
      "ananas", "pineapple", "pine apple", "अनानास",
    ],
  },
  "Coconut": {
    category: "fruit",
    synonyms: [
      "nariyal", "naariyal", "coconut", "green coconut", "tender coconut",
      "thengai", "kobbari", "नारियल",
    ],
  },
  "Litchi": {
    category: "fruit",
    synonyms: [
      "litchi", "lychee", "leechi", "lichu", "लीची",
    ],
  },
  "Plum": {
    category: "fruit",
    synonyms: [
      "aloo bukhara", "alubukhar", "plum", "बेर",
    ],
  },
  "Jackfruit": {
    category: "fruit",
    synonyms: [
      "kathal", "jackfruit", "jack fruit", "katahal",
      "panasa", "कटहल",
    ],
  },
  "Custard Apple": {
    category: "fruit",
    synonyms: [
      "sitaphal", "sharifa", "custard apple", "sugar apple",
      "seetha pazham", "सीताफल",
    ],
  },

  // ── DAIRY ──────────────────────────────────────────────────────────────────
  "Milk": {
    category: "dairy",
    synonyms: [
      "doodh", "dudh", "milk", "fresh milk", "cow milk", "buffalo milk",
      "pal", "palu", "दूध",
    ],
  },
  "Curd": {
    category: "dairy",
    synonyms: [
      "dahi", "dahee", "curd", "yogurt", "yoghurt", "set curd",
      "thick curd", "thayir", "perugu", "दही",
    ],
  },
  "Butter": {
    category: "dairy",
    synonyms: [
      "makhan", "makkhan", "butter", "white butter", "yellow butter",
      "vennai", "venna", "मक्खन",
    ],
  },
  "Ghee": {
    category: "dairy",
    synonyms: [
      "ghee", "desi ghee", "clarified butter", "ghi",
      "neyyi", "नेय", "घी",
    ],
  },
  "Paneer": {
    category: "dairy",
    synonyms: [
      "paneer", "panner", "cottage cheese", "fresh cheese",
      "chenna", "பனீர்", "पनीर",
    ],
  },
  "Cheese": {
    category: "dairy",
    synonyms: [
      "cheese", "processed cheese", "block cheese", "slice cheese",
    ],
  },
  "Buttermilk": {
    category: "dairy",
    synonyms: [
      "chaas", "chhas", "buttermilk", "lassi", "mattha",
      "mor", "majjiga", "छाछ",
    ],
  },
  "Cream": {
    category: "dairy",
    synonyms: [
      "malai", "cream", "fresh cream", "whipping cream",
      "cream milk", "मलाई",
    ],
  },
  "Khoya": {
    category: "dairy",
    synonyms: [
      "khoya", "khoa", "mawa", "mava", "solidified milk",
      "खोया", "मावा",
    ],
  },

  // ── SEEDS / GRAINS / PULSES ─────────────────────────────────────────────────
  "Wheat": {
    category: "seeds",
    synonyms: [
      "gehun", "gehu", "wheat", "wheat grain", "atta",
      "godhumai", "godhuma", "गेहूं",
    ],
  },
  "Rice": {
    category: "seeds",
    synonyms: [
      "chawal", "chaawal", "rice", "paddy", "basmati", "sona masoori",
      "arisi", "biyyam", "चावल",
    ],
  },
  "Mustard Seeds": {
    category: "seeds",
    synonyms: [
      "sarson", "sarson ke beej", "mustard", "mustard seeds",
      "kadugu", "rai", "avalu", "सरसों",
    ],
  },
  "Soybean": {
    category: "seeds",
    synonyms: [
      "soybean", "soya bean", "soyabean", "soya",
      "सोयाबीन",
    ],
  },
  "Groundnut": {
    category: "seeds",
    synonyms: [
      "moongfali", "mungfali", "groundnut", "peanut", "peanuts",
      "verkadalai", "pallilu", "मूंगफली",
    ],
  },
  "Lentils": {
    category: "seeds",
    synonyms: [
      "masoor", "masur", "masoor dal", "lentils", "red lentil",
      "mysore dal", "मसूर",
    ],
  },
  "Chickpea": {
    category: "seeds",
    synonyms: [
      "chana", "chole", "chickpea", "garbanzo", "kabuli chana",
      "kala chana", "channa", "kondakadalai", "senagalu", "चना",
    ],
  },
  "Moong Dal": {
    category: "seeds",
    synonyms: [
      "moong", "moong dal", "mung", "mung dal", "green gram",
      "moong bean", "pesara pappu", "पेसर", "मूंग",
    ],
  },
  "Urad Dal": {
    category: "seeds",
    synonyms: [
      "urad", "urad dal", "urad daal", "black gram", "black lentil",
      "minumulu", "ulundu", "उड़द",
    ],
  },
  "Arhar Dal": {
    category: "seeds",
    synonyms: [
      "arhar", "arhar dal", "toor dal", "tur dal", "red gram",
      "pigeon pea", "kandipappu", "thuvaram paruppu", "अरहर",
    ],
  },
  "Bajra": {
    category: "seeds",
    synonyms: [
      "bajra", "bajri", "pearl millet", "millet",
      "cumbu", "sajja", "बाजरा",
    ],
  },
  "Jowar": {
    category: "seeds",
    synonyms: [
      "jowar", "jwari", "sorghum", "great millet",
      "cholam", "jonna", "ज्वार",
    ],
  },
  "Maize": {
    category: "seeds",
    synonyms: [
      "makka", "maize", "corn grain", "dry corn", "makkai",
      "மக்காச்சோளம்", "మొక్కజొన్న", "मक्का",
    ],
  },
  "Sesame": {
    category: "seeds",
    synonyms: [
      "til", "teel", "sesame", "sesame seeds", "gingelly",
      "ellu", "nuvvulu", "तिल",
    ],
  },
  "Sunflower Seeds": {
    category: "seeds",
    synonyms: [
      "surajmukhi", "sunflower", "sunflower seeds", "surajmukhi beej",
      "सूरजमुखी",
    ],
  },
  "Cotton": {
    category: "seeds",
    synonyms: [
      "kapas", "cotton", "raw cotton", "cotton seeds",
      "paruthi", "patti", "कपास",
    ],
  },
  "Sugarcane": {
    category: "seeds",
    synonyms: [
      "ganna", "ganne", "sugarcane", "sugar cane",
      "karumbu", "cheruku", "गन्ना",
    ],
  },
};

// ── Build a flat reverse-lookup table at module load time ─────────────────────
// Maps every synonym (lowercased, trimmed) → { canonical, category }
const _lookup = new Map();

for (const [canonical, { category, synonyms }] of Object.entries(SYNONYM_MAP)) {
  // Register the canonical name itself
  _lookup.set(canonical.toLowerCase(), { canonical, category });
  for (const syn of synonyms) {
    _lookup.set(syn.toLowerCase().trim(), { canonical, category });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise input: lowercase, collapse spaces, strip punctuation */
function normalise(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0900-\u097F\u0A00-\u0A7F\u0B00-\u0B7F\u0C00-\u0C7F\u0C80-\u0CFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Levenshtein distance ───────────────────────────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * fuzzyMatch — prefix/containment first, then Levenshtein for typos.
 * Tolerance: ≤2 edits for words ≥6 chars, ≤1 edit for words ≥4 chars.
 */
function fuzzyMatch(query) {
  const q = normalise(query);

  // 1. Prefix / containment match (fast path)
  for (const [key, val] of _lookup.entries()) {
    if (key.startsWith(q) || q.startsWith(key)) {
      return { ...val, confidence: "fuzzy" };
    }
  }
  for (const [key, val] of _lookup.entries()) {
    if (key.length >= 3 && q.includes(key)) {
      return { ...val, confidence: "fuzzy" };
    }
  }

  // 2. Levenshtein typo correction
  if (q.length >= 4) {
    const maxEdits = q.length >= 6 ? 2 : 1;
    let bestMatch = null;
    let bestDist  = Infinity;
    for (const [key, val] of _lookup.entries()) {
      if (key.length < 3) continue;
      // Avoid matching single-word queries against multi-word keys
      if (q.split(" ").length === 1 && key.split(" ").length > 1) continue;
      const dist = levenshtein(q, key);
      if (dist <= maxEdits && dist < bestDist) {
        bestDist  = dist;
        bestMatch = { ...val, confidence: "fuzzy" };
      }
    }
    if (bestMatch) return bestMatch;
  }

  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * resolveCategory(inputName)
 *
 * @param  {string} inputName  – anything the farmer types
 * @returns {{ canonical: string, category: string, confidence: string }}
 *
 * confidence levels:
 *   "exact"    – input matched canonical name exactly
 *   "synonym"  – input matched a known synonym
 *   "fuzzy"    – partial / prefix match
 *   "default"  – no match found; category falls back to "vegetable"
 */
function resolveCategory(inputName) {
  if (!inputName || typeof inputName !== "string") {
    return { canonical: inputName || "", category: "vegetable", confidence: "default" };
  }

  const norm = normalise(inputName);

  // 1. Exact or synonym match
  const hit = _lookup.get(norm);
  if (hit) {
    const confidence = hit.canonical.toLowerCase() === norm ? "exact" : "synonym";
    return { ...hit, confidence };
  }

  // 2. Fuzzy match
  const fuzzy = fuzzyMatch(norm);
  if (fuzzy) return fuzzy;

  // 3. Default
  return { canonical: inputName, category: "vegetable", confidence: "default" };
}

/**
 * getAllSynonyms()
 * Returns the entire synonym map (used by the client for autocomplete hints).
 */
function getAllSynonyms() {
  const result = {};
  for (const [canonical, { category, synonyms }] of Object.entries(SYNONYM_MAP)) {
    result[canonical] = { category, synonyms };
  }
  return result;
}

module.exports = { resolveCategory, getAllSynonyms, SYNONYM_MAP };
