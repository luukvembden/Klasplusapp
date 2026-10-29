import { Capacitor } from '@capacitor/core';
import { demoApi } from './demoApi';
import { liveApi } from './live/liveApi';
import { metOfflineCache } from './offlineCache';
import type { SchoolApi } from './SchoolApi';

// De enige plek waar gekozen wordt waar de gegevens vandaan komen.
// In de telefoon-app: de echte koppeling. In de browser kan dat niet (CORS en redirect,
// zie docs/inloggen-onderzoek.md), dus daar blijft de demo draaien.
export const isDemo = !Capacitor.isNativePlatform();

export const api: SchoolApi = metOfflineCache(isDemo ? demoApi : liveApi);

export { InloggenAfgebroken, SESSIE_VERLOPEN, type SchoolApi } from './SchoolApi';
export type * from './types';
