import type { Request } from 'express';
export type ApiLanguage = 'en' | 'mm';
export declare function resolveLanguage(request?: Request | null): ApiLanguage;
export declare function localizeMessage(message: unknown, language: ApiLanguage): unknown;
