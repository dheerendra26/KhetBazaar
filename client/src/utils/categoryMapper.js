/**
 * categoryMapper.js  (client-side)
 * ─────────────────────────────────────────────────────────────────────────────
 * Mirrors the server-side utility so the Upload form can give instant
 * visual feedback (category badge + canonical name suggestion) while the
 * farmer types — no network round-trip needed.
 *
 * resolveCategory(inputName) → { canonical, category, confidence }
 *   confidence: "exact" | "synonym" | "fuzzy" | "default"
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SYNONYM_MAP = {
  // ── VEGETABLES ──────────────────────────────────────────────────────────
  "Potato":         { category: "vegetable", synonyms: ["aloo","alu","allo","allu","aloo sabzi","aaloo","aalo","alloo","alou","aluoo","potato","potatoes","brown potato","white potato","baby potato","sweet potato","batata","urulaikizhangu","bangala dumpa","आलू"] },
  "Tomato":         { category: "vegetable", synonyms: ["tamatar","tamaatar","tamater","tmaatar","tomoto","tamato","tamtar","tomato","tomatoes","red tomato","cherry tomato","country tomato","thakkali","tameta","टमाटर"] },
  "Onion":          { category: "vegetable", synonyms: ["pyaz","pyaaz","pyaj","piyaz","piaz","pyaj","onion","onions","red onion","white onion","small onion","shallot","vengayam","ullipaya","kandha","प्याज"] },
  "Garlic":         { category: "vegetable", synonyms: ["lahsun","lasun","lehsun","lasoon","lahson","garlic","garlic bulb","poondu","vellulli","लहसुन"] },
  "Ginger":         { category: "vegetable", synonyms: ["adrak","adrakh","adarak","adrak","ginger","fresh ginger","inji","allam","अदरक"] },
  "Cauliflower":    { category: "vegetable", synonyms: ["phool gobhi","phool gobi","phoolgobi","phulgobi","ful gobi","cauliflower","gobi","gobhi","फूलगोभी"] },
  "Cabbage":        { category: "vegetable", synonyms: ["patta gobhi","patta gobi","band gobhi","bandgobi","bandh gobi","cabbage","पत्तागोभी"] },
  "Carrot":         { category: "vegetable", synonyms: ["gajar","gaajar","gajjar","carrot","carrots","red carrot","desi carrot","गाजर"] },
  "Spinach":        { category: "vegetable", synonyms: ["palak","paalak","palak saag","spinach","saag","keerai","spinach leaves","पालक"] },
  "Brinjal":        { category: "vegetable", synonyms: ["baingan","baigan","begun","eggplant","brinjal","aubergine","kathirikkai","vankaya","ringna","बैंगन"] },
  "Ladyfinger":     { category: "vegetable", synonyms: ["bhindi","bhendi","bhindee","okra","ladyfinger","lady finger","ladies finger","vendakkai","भिंडी"] },
  "Peas":           { category: "vegetable", synonyms: ["matar","mattar","mutter","mutar","peas","green peas","hara matar","fresh peas","pattani","मटर"] },
  "Capsicum":       { category: "vegetable", synonyms: ["shimla mirch","shimla mirchi","capsicum","bell pepper","green pepper","red pepper","yellow pepper","शिमला मिर्च"] },
  "Green Chilli":   { category: "vegetable", synonyms: ["hari mirch","hari mirchi","mirchi","mircha","mirchee","lal mirch","green chilli","green chili","chilli","chili","mirch","chilly","hari mirch wali","हरी मिर्च","मिर्ची"] },
  "Cucumber":       { category: "vegetable", synonyms: ["kheera","khira","kheere","cucumber","desi cucumber","vellarikkai","dosakaya"] },
  "Pumpkin":        { category: "vegetable", synonyms: ["kaddu","kaddoo","sitaphal","pumpkin","yellow pumpkin","poosanikai","kumbalakaya"] },
  "Bottle Gourd":   { category: "vegetable", synonyms: ["lauki","ghiya","doodhi","bottle gourd","calabash","sorakkai","anapakaya"] },
  "Bitter Gourd":   { category: "vegetable", synonyms: ["karela","karaila","bitter gourd","bitter melon","pavakkai","kakarakaya"] },
  "Radish":         { category: "vegetable", synonyms: ["mooli","muli","radish","white radish","desi radish","mullangi"] },
  "Beetroot":       { category: "vegetable", synonyms: ["chukandar","beetroot","beet","red beet"] },
  "Sweet Corn":     { category: "vegetable", synonyms: ["bhutta","bhutte","makka","corn","sweet corn","corn cob"] },
  "Coriander":      { category: "vegetable", synonyms: ["dhaniya","dhania","dhanya","coriander","cilantro","kothamalli","kothimira"] },
  "Fenugreek":      { category: "vegetable", synonyms: ["methi","methi saag","fenugreek","methi leaves","venthayakeerai","menthi"] },
  "Mushroom":       { category: "vegetable", synonyms: ["mushroom","khumb","khumbi","dhingri","oyster mushroom","button mushroom"] },

  // ── FRUITS ──────────────────────────────────────────────────────────────
  "Mango":          { category: "fruit", synonyms: ["aam","aaam","mango","mangoes","raw mango","alphonso","kesar","dasheri","langra","totapuri","maangai","mamidi"] },
  "Banana":         { category: "fruit", synonyms: ["kela","kele","banana","bananas","plantain","raw banana","green banana","elaichi banana","vazhai pazham","aratipandu"] },
  "Apple":          { category: "fruit", synonyms: ["seb","sev","apple","apples","red apple","green apple","kashmiri apple","shimla apple"] },
  "Grapes":         { category: "fruit", synonyms: ["angur","angoor","grapes","black grapes","green grapes","seedless grapes","draksha"] },
  "Orange":         { category: "fruit", synonyms: ["santra","narangi","orange","oranges","nagpur orange","kamala"] },
  "Papaya":         { category: "fruit", synonyms: ["papita","papaya","raw papaya","green papaya","pappali","boppai"] },
  "Watermelon":     { category: "fruit", synonyms: ["tarbooz","tarbuj","watermelon","water melon","tharboocha","puchakaya"] },
  "Guava":          { category: "fruit", synonyms: ["amrood","amrud","guava","peru","jam","koyya pazham"] },
  "Pomegranate":    { category: "fruit", synonyms: ["anar","anaar","pomegranate","dalimb","mathulai","danimma"] },
  "Lemon":          { category: "fruit", synonyms: ["nimbu","nimboo","lemon","lime","nimbi","elumichai","nimmakaya"] },
  "Pineapple":      { category: "fruit", synonyms: ["ananas","pineapple","pine apple"] },
  "Coconut":        { category: "fruit", synonyms: ["nariyal","naariyal","coconut","green coconut","tender coconut","thengai","kobbari"] },
  "Litchi":         { category: "fruit", synonyms: ["litchi","lychee","leechi","lichu"] },
  "Plum":           { category: "fruit", synonyms: ["aloo bukhara","alubukhar","plum"] },
  "Jackfruit":      { category: "fruit", synonyms: ["kathal","jackfruit","jack fruit","katahal","panasa"] },
  "Custard Apple":  { category: "fruit", synonyms: ["sitaphal","sharifa","custard apple","sugar apple","seetha pazham"] },

  // ── DAIRY ────────────────────────────────────────────────────────────────
  "Milk":           { category: "dairy", synonyms: ["doodh","dudh","milk","fresh milk","cow milk","buffalo milk","pal","palu"] },
  "Curd":           { category: "dairy", synonyms: ["dahi","dahee","curd","yogurt","yoghurt","set curd","thick curd","thayir","perugu"] },
  "Butter":         { category: "dairy", synonyms: ["makhan","makkhan","butter","white butter","yellow butter","vennai","venna"] },
  "Ghee":           { category: "dairy", synonyms: ["ghee","desi ghee","clarified butter","ghi","neyyi"] },
  "Paneer":         { category: "dairy", synonyms: ["paneer","panner","cottage cheese","fresh cheese","chenna"] },
  "Cheese":         { category: "dairy", synonyms: ["cheese","processed cheese","block cheese","slice cheese"] },
  "Buttermilk":     { category: "dairy", synonyms: ["chaas","chhas","buttermilk","lassi","mattha","mor","majjiga"] },
  "Cream":          { category: "dairy", synonyms: ["malai","cream","fresh cream","whipping cream","cream milk"] },
  "Khoya":          { category: "dairy", synonyms: ["khoya","khoa","mawa","mava","solidified milk"] },

  // ── SEEDS / GRAINS / PULSES ───────────────────────────────────────────────
  "Wheat":          { category: "seeds", synonyms: ["gehun","gehu","wheat","wheat grain","atta","godhumai","godhuma"] },
  "Rice":           { category: "seeds", synonyms: ["chawal","chaawal","rice","paddy","basmati","sona masoori","arisi","biyyam"] },
  "Mustard Seeds":  { category: "seeds", synonyms: ["sarson","sarson ke beej","mustard","mustard seeds","kadugu","rai","avalu"] },
  "Soybean":        { category: "seeds", synonyms: ["soybean","soya bean","soyabean","soya"] },
  "Groundnut":      { category: "seeds", synonyms: ["moongfali","mungfali","groundnut","peanut","peanuts","verkadalai","pallilu"] },
  "Lentils":        { category: "seeds", synonyms: ["masoor","masur","masoor dal","lentils","red lentil","mysore dal"] },
  "Chickpea":       { category: "seeds", synonyms: ["chana","chole","chickpea","garbanzo","kabuli chana","kala chana","channa","kondakadalai","senagalu"] },
  "Moong Dal":      { category: "seeds", synonyms: ["moong","moong dal","mung","mung dal","green gram","moong bean","pesara pappu"] },
  "Urad Dal":       { category: "seeds", synonyms: ["urad","urad dal","urad daal","black gram","black lentil","minumulu","ulundu"] },
  "Arhar Dal":      { category: "seeds", synonyms: ["arhar","arhar dal","toor dal","tur dal","red gram","pigeon pea","kandipappu","thuvaram paruppu"] },
  "Bajra":          { category: "seeds", synonyms: ["bajra","bajri","pearl millet","millet","cumbu","sajja"] },
  "Jowar":          { category: "seeds", synonyms: ["jowar","jwari","sorghum","great millet","cholam","jonna"] },
  "Maize":          { category: "seeds", synonyms: ["makka","maize","corn grain","dry corn","makkai"] },
  "Sesame":         { category: "seeds", synonyms: ["til","teel","sesame","sesame seeds","gingelly","ellu","nuvvulu"] },
  "Sunflower Seeds":{ category: "seeds", synonyms: ["surajmukhi","sunflower","sunflower seeds","surajmukhi beej"] },
  "Cotton":         { category: "seeds", synonyms: ["kapas","cotton","raw cotton","cotton seeds","paruthi","patti"] },
  "Sugarcane":      { category: "seeds", synonyms: ["ganna","ganne","sugarcane","sugar cane","karumbu","cheruku"] },
};

// ── Build reverse-lookup map at module load time ──────────────────────────────
const _lookup = new Map();
for (const [canonical, { category, synonyms }] of Object.entries(SYNONYM_MAP)) {
  _lookup.set(canonical.toLowerCase(), { canonical, category });
  for (const syn of synonyms) {
    _lookup.set(syn.toLowerCase().trim(), { canonical, category });
  }
}

function normalise(str) {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

// ── Levenshtein distance (edit distance) ─────────────────────────────────────
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
 * fuzzyMatch — tries prefix/containment first (fast), then Levenshtein (typo-tolerant).
 * Tolerance: up to 2 edits for words ≥6 chars, 1 edit for words ≥4 chars.
 */
function fuzzyMatch(query) {
  const q = normalise(query);

  // 1. Prefix / containment match
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
  // Only run on single-word or short queries to avoid false positives.
  if (q.length >= 4) {
    const maxEdits = q.length >= 6 ? 2 : 1;
    let bestMatch = null;
    let bestDist  = Infinity;
    for (const [key, val] of _lookup.entries()) {
      // Skip very short keys that would match everything
      if (key.length < 3) continue;
      // Skip multi-word keys when query is single-word (avoids "aloo" → "aloo bukhara")
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

/**
 * resolveCategory(inputName)
 * @returns {{ canonical: string, category: "vegetable"|"fruit"|"dairy"|"seeds", confidence: string }}
 */
export function resolveCategory(inputName) {
  if (!inputName || !inputName.trim()) {
    return { canonical: inputName || "", category: "vegetable", confidence: "default" };
  }
  const norm = normalise(inputName);
  const hit  = _lookup.get(norm);
  if (hit) {
    return { ...hit, confidence: hit.canonical.toLowerCase() === norm ? "exact" : "synonym" };
  }
  return fuzzyMatch(norm) || { canonical: inputName, category: "vegetable", confidence: "default" };
}

export const CATEGORY_LABELS = {
  vegetable: { label: "Vegetable",  emoji: "🥬", color: "bg-green-100 text-green-800 border-green-300"  },
  fruit:     { label: "Fruit",      emoji: "🍎", color: "bg-red-100    text-red-800    border-red-300"    },
  dairy:     { label: "Dairy",      emoji: "🥛", color: "bg-blue-100   text-blue-800   border-blue-300"   },
  seeds:     { label: "Seeds/Grain",emoji: "🌾", color: "bg-amber-100  text-amber-800  border-amber-300"  },
};

export default SYNONYM_MAP;
