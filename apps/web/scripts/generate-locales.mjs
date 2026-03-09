import fs from 'node:fs';
import path from 'node:path';

const CWD = process.cwd();
const ROOT = fs.existsSync(path.join(CWD, 'app'))
  ? CWD
  : path.resolve(CWD, 'apps/web');
const LOCALE_DIR = path.join(ROOT, 'locale');
const EN_PATH = path.join(LOCALE_DIR, 'en.json');
const MM_PATH = path.join(LOCALE_DIR, 'mm.json');
const TARGET_DIRS = [path.join(ROOT, 'app'), path.join(ROOT, 'components')];
const TARGET_EXTS = new Set(['.ts', '.tsx']);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }
    const ext = path.extname(entry.name);
    if (TARGET_EXTS.has(ext)) files.push(full);
  }
  return files;
}

function normalizeSpace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function isClassToken(token) {
  return /^(?:[a-z]+:)?(?:[a-z]+(?:-[a-z0-9/[\].%]+)+|[a-z]+)$/.test(token);
}

function isProbablyUiText(text) {
  if (!text) return false;
  const value = normalizeSpace(text);
  if (!value) return false;
  if (value.length < 2) return false;
  if (value.length > 90) return false;
  if (/[\u1000-\u109F]/.test(value)) return false;
  if (value.includes('${')) return false;
  if (value.includes('&&') || value.includes('||') || value.includes('=>')) return false;
  if (/[?:]/.test(value) && (value.includes(' ? ') || value.includes(' : ') || value.startsWith(') :'))) return false;
  if (/[{}[\];=><]/.test(value)) return false;
  if (/^[()|:&.,\s-]+$/.test(value)) return false;
  if (/^\d+(?:[.\s-]+\d+)+$/.test(value)) return false;
  if (
    /^[MLHVCSQTAZmlhvcsqtaz0-9 .,-]+$/.test(value) &&
    /\d/.test(value) &&
    /[MLHVCSQTAZmlhvcsqtaz]/.test(value)
  ) {
    return false;
  }
  if (/\b(?:const|return|function|import|export|await|className|useState|apiFetch)\b/.test(value)) return false;
  if (/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD|ALL|PENDING|APPROVED|REJECTED|FREE|PREMIUM)$/.test(value)) return false;
  if (/^M[0-9 .-]+$/.test(value)) return false;
  if (/private,\s*no-store/i.test(value)) return false;
  if (/^(use client|video\/\*|image\/jpeg,image\/png|nodownload noplaybackrate|tab-pill tab-pill-active)$/i.test(value)) return false;
  if (value.split(/\s+/).length >= 2 && value.split(/\s+/).every(isClassToken)) return false;
  if (/^[a-z]+(?:-[a-z0-9]+)+(?:\s+[a-z]+(?:-[a-z0-9]+)+)*$/i.test(value)) return false;
  if (/^[\[{(<].*[\]})>]$/.test(value)) return false;
  if (/^(?:bg|text|border|px|py|mt|mb|mx|my|w|h|min|max|grid|flex|rounded|shadow|dark):?/i.test(value)) return false;
  if (/(?:^|\s)(?:bg-|text-|border-|px-|py-|mt-|mb-|mx-|my-|w-|h-|min-|max-|rounded-|shadow-|flex|grid|items-|justify-|absolute|relative|fixed|inset-|z-|font-|dark:|hover:|focus:|sm:|lg:|xl:|divide-|container\b)/.test(value)) return false;
  if (/^(https?:\/\/|\/api\/|\/admin\/|\/videos\/)/i.test(value)) return false;
  if (/^[a-z0-9_./:-]+$/i.test(value) && !/^[A-Z][a-z]+$/.test(value) && !/^[A-Z]+$/.test(value)) return false;
  if (/^[0-9]+$/.test(value)) return false;
  if (value.includes('className=')) return false;
  return true;
}

function extractTexts(code) {
  const values = new Set();

  const jsxTextRegex = />\s*([^<>{}\n][^<>]{0,200}?)\s*</g;
  let m;
  while ((m = jsxTextRegex.exec(code))) {
    const candidate = normalizeSpace(m[1]);
    if (isProbablyUiText(candidate)) values.add(candidate);
  }

  const attrRegex = /\b(?:placeholder|title|aria-label|alt)=['"`]([^'"`]{1,200})['"`]/g;
  while ((m = attrRegex.exec(code))) {
    const candidate = normalizeSpace(m[1]);
    if (isProbablyUiText(candidate)) values.add(candidate);
  }

  const codeStringRegex = /['"`]([^'"`\n]{2,200})['"`]/g;
  while ((m = codeStringRegex.exec(code))) {
    const candidate = normalizeSpace(m[1]);
    if (isProbablyUiText(candidate)) values.add(candidate);
  }

  return values;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function nextKey(index) {
  return `auto_${String(index).padStart(4, '0')}`;
}

const mmSeed = {
  'Login': 'အကောင့်ဝင်ရန်',
  'Register': 'စာရင်းသွင်းရန်',
  'Sign in': 'အကောင့်ဝင်ရန်',
  'Signing in...': 'ဝင်နေသည်...',
  'Create Account': 'အကောင့်ဖွင့်ရန်',
  'Create account': 'အကောင့်ဖွင့်ရန်',
  'Creating account...': 'အကောင့်ဖွင့်နေသည်...',
  'Home': 'ပင်မ',
  'Browse': 'ကြည့်ရှုရန်',
  'Gallary': 'ဓာတ်ပုံများ',
  'Account': 'အကောင့်',
  'Categories': 'အမျိုးအစားများ',
  'Search': 'ရှာဖွေရန်',
  'Search movies, series, or keywords': 'ရုပ်ရှင်၊ စီးရီး သို့မဟုတ် keyword များကို ရှာပါ',
  'Latest': 'အသစ်ဆုံး',
  'Popular': 'လူကြိုက်များ',
  'Favourite': 'အကြိုက်များ',
  'Favourite videos': 'အကြိုက်ဆုံး ဗီဒီယိုများ',
  'No favourite videos yet.': 'အကြိုက်ဆုံး ဗီဒီယို မရှိသေးပါ။',
  'Sign in to add favourites': 'အကြိုက်ဆုံး ထည့်ရန် အကောင့်ဝင်ပါ။',
  'Failed to update favourite': 'အကြိုက်ဆုံး ပြင်ဆင်ခြင်း မအောင်မြင်ပါ။',
  'Failed to load favourites': 'အကြိုက်ဆုံးများ တင်ယူရာတွင် မအောင်မြင်ပါ။',
  'Loading more…': 'တင်နေသည်…',
  'No videos found.': 'ဗီဒီယို မတွေ့ပါ။',
  'No images yet.': 'ဓာတ်ပုံ မရှိသေးပါ။',
  'Upload images': 'ဓာတ်ပုံများ တင်ရန်',
  'Images (one or multiple)': 'ဓာတ်ပုံ (တစ်ပုံ သို့မဟုတ် အများပုံ)',
  'Please choose image files': 'ဓာတ်ပုံဖိုင်ကို ရွေးချယ်ပါ။',
  'Failed to load gallery': 'ဓာတ်ပုံများ တင်ယူရာတွင် မအောင်မြင်ပါ။',
  'End of results': 'ရလဒ်အဆုံး',
  'Sign out': 'အကောင့်ထွက်ရန်',
  'Logout': 'အကောင့်ထွက်ရန်',
  'Premium only': 'Premium သာ',
  'Loading video...': 'ဗီဒီယို တင်နေသည်...',
  'Unable to play this video. Check your access or try again.': 'ဗီဒီယို မဖွင့်နိုင်ပါ။ access ကိုစစ်ဆေးပါ သို့မဟုတ် ထပ်စမ်းကြည့်ပါ။',
};

const files = TARGET_DIRS.flatMap((dir) => walk(dir));
const extracted = new Set();
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  for (const text of extractTexts(code)) extracted.add(text);
}

const enCurrent = readJson(EN_PATH);
const mmCurrent = readJson(MM_PATH);

const enValueToKey = new Map(Object.entries(enCurrent).map(([k, v]) => [String(v), k]));
let maxIndex = Object.keys(enCurrent)
  .map((k) => /^auto_(\d+)$/.exec(k))
  .filter(Boolean)
  .map((m) => Number(m[1]))
  .reduce((max, n) => Math.max(max, n), 0);

const sortedTexts = Array.from(extracted).sort((a, b) => a.localeCompare(b));
const enNext = {};
const mmNext = {};

for (const text of sortedTexts) {
  let key = enValueToKey.get(text);
  if (!key) {
    maxIndex += 1;
    key = nextKey(maxIndex);
  }
  enNext[key] = text;

  const existing = mmCurrent[key];
  if (typeof existing === 'string' && existing.trim()) {
    mmNext[key] = existing;
  } else if (mmSeed[text]) {
    mmNext[key] = mmSeed[text];
  } else {
    mmNext[key] = text;
  }
}

fs.writeFileSync(EN_PATH, JSON.stringify(enNext, null, 2) + '\n');
fs.writeFileSync(MM_PATH, JSON.stringify(mmNext, null, 2) + '\n');

console.log(`Generated locales with ${sortedTexts.length} entries.`);
