// De eigen Android-plugin voor de ochtendmelding (android/app/src/main/java/nl/klasplus/app/OchtendPlugin.java).
// Op het tijdstip haalt Android eerst het rooster van vandaag op; lukt dat niet op tijd, dan komt de
// melding met de tekst die we hier meegeven.
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface OchtendPlan {
  schoolUrl: string;
  leerlingId: number;
  /** Ouderaccount: eigen afspraken van het kind niet meetellen. */
  ouder: boolean;
  dagen: { op: number; titel: string; tekst: string }[];
}

interface OchtendPlugin {
  plan(plan: OchtendPlan): Promise<void>;
  wis(): Promise<void>;
  batterij(): Promise<{ onbeperkt: boolean }>;
  vraagBatterij(): Promise<void>;
}

export const Ochtend = registerPlugin<OchtendPlugin>('Ochtend');

export const isAndroid = Capacitor.getPlatform() === 'android';
