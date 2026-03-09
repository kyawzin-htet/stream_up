import type { Request } from 'express';

export type ApiLanguage = 'en' | 'mm';

const MM_MAP: Record<string, string> = {
  'Request failed': 'တောင်းဆိုမှု မအောင်မြင်ပါ။',
  'Database request failed': 'Database တောင်းဆိုမှု မအောင်မြင်ပါ။',
  'Database is unavailable. Start PostgreSQL and verify DATABASE_URL, then retry.': 'Database မရရှိနိုင်ပါ။ PostgreSQL ကိုစတင်ပြီး DATABASE_URL ကိုစစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။',
  'Database schema is outdated. Run Prisma migrations and restart the API.': 'Database schema ဟောင်းနေသည်။ Prisma migrations လုပ်ပြီး API ကို restart လုပ်ပါ။',
  'Unique constraint failed.': 'ထပ်တူကျသည့် ဒေတာ ရှိနေပါသည်။',
  'Invalid credentials': 'အကောင့်အချက်အလက် မမှန်ကန်ပါ။',
  'Email already registered': 'ဤအီးမေးလ်ဖြင့် စာရင်းသွင်းထားပြီးဖြစ်သည်။',
  'User not found': 'အသုံးပြုသူ မတွေ့ပါ။',
  'Plan not found': 'Plan မတွေ့ပါ။',
  'Request not found': 'တောင်းဆိုချက် မတွေ့ပါ။',
  'Video not found': 'ဗီဒီယို မတွေ့ပါ။',
  'Parent comment not found': 'မိခင် comment မတွေ့ပါ။',
  'Replies can only be one level deep': 'Reply ကို အဆင့်တစ်ဆင့်သာ ထည့်နိုင်ပါသည်။',
  'Parent comment does not match video': 'Parent comment သည် ဗီဒီယိုနှင့် မကိုက်ညီပါ။',
  'Comment is empty': 'Comment အလွတ်မဖြစ်ရပါ။',
  'Missing video': 'ဗီဒီယို မပါရှိပါ။',
  'Missing file': 'ဖိုင် မပါရှိပါ။',
  'Image not found': 'ဓာတ်ပုံ မတွေ့ပါ။',
  'Missing plan': 'Plan မပါရှိပါ။',
  'Only JPG/PNG uploads are allowed': 'JPG/PNG ဖိုင်သာ တင်နိုင်ပါသည်။',
  'Only image uploads are allowed': 'ဓာတ်ပုံဖိုင်သာ တင်နိုင်ပါသည်။',
  'Only video uploads are allowed': 'ဗီဒီယိုဖိုင်သာ တင်နိုင်ပါသည်။',
  'Authentication required': 'အကောင့်ဝင်ရန် လိုအပ်သည်။',
  'Premium membership required': 'Premium membership လိုအပ်သည်။',
  'Failed to stream video': 'ဗီဒီယို stream မလုပ်နိုင်ပါ။',
  'Failed to stream preview': 'Preview stream မလုပ်နိုင်ပါ။',
  'Failed to stream GIF preview': 'GIF preview stream မလုပ်နိုင်ပါ။',
  'GIF preview not available': 'GIF preview မရနိုင်ပါ။',
  'Failed to prepare video file': 'ဗီဒီယိုဖိုင် ပြင်ဆင်ရာတွင် မအောင်မြင်ပါ။',
  'Video processing failed. Ensure ffmpeg/ffprobe are installed.': 'ဗီဒီယို processing မအောင်မြင်ပါ။ ffmpeg/ffprobe ထည့်သွင်းထားကြောင်း စစ်ဆေးပါ။',
};

function resolveFromHeader(value?: string | null): ApiLanguage {
  if (!value) return 'en';
  const lower = value.toLowerCase();
  if (lower.includes('mm') || lower.includes('my')) return 'mm';
  return 'en';
}

export function resolveLanguage(request?: Request | null): ApiLanguage {
  if (!request) return 'en';
  const explicit = request.headers['x-lang'];
  if (typeof explicit === 'string') return resolveFromHeader(explicit);
  if (Array.isArray(explicit) && explicit[0]) return resolveFromHeader(explicit[0]);
  const accept = request.headers['accept-language'];
  if (typeof accept === 'string') return resolveFromHeader(accept);
  if (Array.isArray(accept) && accept[0]) return resolveFromHeader(accept[0]);
  return 'en';
}

function localizeSingle(message: string, language: ApiLanguage) {
  if (language === 'en') return message;
  if (MM_MAP[message]) return MM_MAP[message];

  if (message.includes('must be an email')) return 'Email ပုံစံမှန်ကန်ရပါမည်။';
  if (message.includes('must be longer than or equal to')) return 'စာသားအရှည် မလုံလောက်ပါ။';
  if (message.includes('should not be empty')) return 'အလွတ်မဖြစ်ရပါ။';
  if (message.includes('must be a string')) return 'စာသားအမျိုးအစား ဖြစ်ရပါမည်။';
  if (message.includes('must be a boolean')) return 'boolean တန်ဖိုး ဖြစ်ရပါမည်။';

  return message;
}

export function localizeMessage(message: unknown, language: ApiLanguage): unknown {
  if (typeof message === 'string') {
    return localizeSingle(message, language);
  }
  if (Array.isArray(message)) {
    return message.map((item) => localizeMessage(item, language));
  }
  if (message && typeof message === 'object') {
    const clone: Record<string, unknown> = { ...(message as Record<string, unknown>) };
    if ('message' in clone) {
      clone.message = localizeMessage(clone.message, language);
    }
    if ('error' in clone && typeof clone.error === 'string') {
      clone.error = localizeSingle(clone.error, language);
    }
    return clone;
  }
  return message;
}
