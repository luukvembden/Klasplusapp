import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Routes, useLocation, useNavigate, type Location } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LaagZichtbaar, LagenContext } from '../lib/laag';
import { paginaRoutes, TABS } from '../paginaRoutes';
import { TabBar } from './TabBar';

/** Eén pagina in de stapel, met de plek in de browsergeschiedenis waar hij hoort. */
interface Laag {
  idx: number;
  location: Location;
}

/**
 * Wie een pagina is. Alleen `key` is niet genoeg: komt een adres van buitenaf binnen (een link, of het
 * eerste adres bij opstarten), dan heet elke pagina "default".
 */
const sleutelVan = (l: Location) => `${l.key}|${l.pathname}${l.search}`;

/** Zo lang duurt het wegschuiven of terugveren (ms). */
const DUUR = 240;

/** In een invoerveld (tekst selecteren, cursor verplaatsen) telt vegen niet. */
const inInvoer = (doel: EventTarget | null) =>
  doel instanceof Element && !!doel.closest('input, textarea, select, [contenteditable="true"]');

/**
 * Scherm met de pagina's en de vaste tabbalk onderin.
 * Open je vanuit een pagina een volgende (een les vanuit de agenda), dan blijft de vorige onzichtbaar
 * onder de nieuwe staan. Van links naar rechts vegen schuift de bovenste dan met je vinger mee weg,
 * zodat de vorige eronder tevoorschijn komt, precies zoals je hem achterliet.
 */
export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const stapel = useRef<Laag[]>([]);

  // De stapel bijwerken zodra het adres verandert. Een tab begint opnieuw; een terugstap valt eraf.
  const bovenste = stapel.current[stapel.current.length - 1];
  if (!bovenste || sleutelVan(bovenste.location) !== sleutelVan(location)) {
    const idx = (window.history.state?.idx as number | undefined) ?? 0;
    stapel.current = TABS.has(location.pathname)
      ? [{ idx, location }]
      : [...stapel.current.filter((l) => l.idx < idx), { idx, location }];
  }
  const lagen = stapel.current;

  // Telt per pagina hoe vaak hij bovenop kwam; zo ververst een pagina waar je naar terugkeert.
  const tellers = useRef(new Map<string, number>());
  const vorigeBoven = useRef<string | null>(null);
  const bovenSleutel = sleutelVan(lagen[lagen.length - 1].location);
  if (vorigeBoven.current !== bovenSleutel) {
    vorigeBoven.current = bovenSleutel;
    tellers.current.set(bovenSleutel, (tellers.current.get(bovenSleutel) ?? 0) + 1);
    for (const sleutel of tellers.current.keys()) {
      if (!lagen.some((l) => sleutelVan(l.location) === sleutel)) tellers.current.delete(sleutel);
    }
  }

  const lagenRef = useRef<HTMLElement>(null);
  const bovenRef = useRef<HTMLDivElement>(null);
  const onderRef = useRef<HTMLDivElement>(null);
  const heeftOnder = lagen.length > 1;
  const isTab = TABS.has(location.pathname);

  // Nieuwe pagina bovenop: van rechts naar binnen schuiven.
  const [inschuiven, setInschuiven] = useState(false);
  const vorigeAantal = useRef(lagen.length);
  useLayoutEffect(() => {
    const erbij = lagen.length > vorigeAantal.current;
    vorigeAantal.current = lagen.length;
    if (!erbij) return;
    setInschuiven(true);
    const klaar = setTimeout(() => setInschuiven(false), DUUR + 40);
    return () => clearTimeout(klaar);
  }, [bovenSleutel, lagen.length]);

  const terug = schuifTerug(lagenRef, bovenRef, onderRef, () => navigate(-1));

  /**
   * Tik op de tab waar je al in zit terwijl je dieper zit (zoals Gemiddeldes onder Cijfers): de bovenste
   * pagina schuift naar rechts weg en de hoofdpagina van de tab komt eronder tevoorschijn, ook als je
   * meerdere pagina's diep zat. Geeft false als dat hier niet kan; dan doet de tab gewoon zijn eigen ding.
   */
  const bezig = useRef(false);
  const naarTab = (pad: string) => {
    if (lagen.length < 2 || lagen[0].location.pathname !== pad) return false;
    if (bezig.current) return true;
    const stappen = lagen[0].idx - lagen[lagen.length - 1].idx;
    const doos = lagenRef.current;
    const boven = bovenRef.current;
    const wortel = doos?.firstElementChild as HTMLElement | null;
    if (!doos || !boven || !wortel || wortel === boven || stappen >= 0) {
      navigate(stappen < 0 ? stappen : -1);
      return true;
    }
    bezig.current = true;
    wortel.classList.add('laag--doel');
    doos.classList.add('app__lagen--vegen', 'app__lagen--wortel');
    zet(boven, wortel, boven.clientWidth, DUUR);
    setTimeout(() => {
      doos.classList.remove('app__lagen--vegen', 'app__lagen--wortel');
      wortel.classList.remove('laag--doel');
      wortel.style.transform = '';
      wortel.style.transition = '';
      bezig.current = false;
      navigate(stappen);
    }, DUUR);
    return true;
  };

  /**
   * Terug naar de pagina waar de terugknop naar wijst (de pagina die erbij hoort), niet per se de vorige in
   * de geschiedenis. Ligt die pagina al onder de huidige, dan schuift alles erboven weg; anders komt hij in
   * de plaats van de huidige pagina.
   */
  const naarPad = (pad: string) => {
    const zelfde = (a: string) => {
      try {
        return decodeURIComponent(a) === decodeURIComponent(pad);
      } catch {
        return a === pad;
      }
    };
    const i = lagen.slice(0, -1).map((l) => l.location.pathname).findLastIndex(zelfde);
    if (i === lagen.length - 2) terug();
    else if (i === 0 && naarTab(pad)) return;
    else if (i >= 0) navigate(lagen[i].idx - lagen[lagen.length - 1].idx);
    else navigate(pad, { replace: true });
  };

  /**
   * Android: de terugknop van de telefoon doet hetzelfde als de terugknop linksboven (naar de pagina die
   * ernaast staat). Op een andere tab ga je terug naar de Agenda; op de Agenda gaat de app naar de achtergrond.
   */
  const pad = useRef(location.pathname);
  pad.current = location.pathname;
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    const luisteraar = App.addListener('backButton', () => {
      const terugLink = document.querySelector<HTMLAnchorElement>('.laag--boven a.terug');
      if (terugLink) terugLink.click();
      else if (pad.current !== '/') navigate('/');
      else void App.minimizeApp();
    });
    return () => {
      void luisteraar.then((l) => l.remove());
    };
  }, [navigate]);

  useVegenTerug({
    lagenRef,
    bovenRef,
    onderRef,
    actief: !isTab,
    heeftOnder,
    terug,
  });

  return (
    <LagenContext.Provider value={{ terug: () => (heeftOnder ? (terug(), true) : false), naar: naarPad }}>
      <div className="app">
        <main ref={lagenRef} className={`app__inhoud app__lagen${inschuiven ? ' app__lagen--schuift' : ''}`}>
          {lagen.map((laag, i) => {
            const boven = i === lagen.length - 1;
            const onder = i === lagen.length - 2;
            return (
              <div
                key={sleutelVan(laag.location)}
                ref={boven ? bovenRef : onder ? onderRef : undefined}
                className={`laag ${boven ? 'laag--boven' : onder ? 'laag--onder' : 'laag--weg'}${boven && inschuiven ? ' laag--nieuw' : ''}`}
                inert={!boven}
                aria-hidden={boven ? undefined : true}
              >
                <LaagZichtbaar.Provider value={tellers.current.get(sleutelVan(laag.location)) ?? 0}>
                  <Routes location={laag.location}>{paginaRoutes}</Routes>
                </LaagZichtbaar.Provider>
              </div>
            );
          })}
        </main>
        <TabBar naarTab={naarTab} />
      </div>
    </LagenContext.Provider>
  );
}

/** Schuift de bovenste pagina naar rechts weg en voert daarna `klaar` uit (teruggaan). */
function schuifTerug(
  lagenRef: RefObject<HTMLElement | null>,
  bovenRef: RefObject<HTMLDivElement | null>,
  onderRef: RefObject<HTMLDivElement | null>,
  klaar: () => void,
) {
  return () => {
    const boven = bovenRef.current;
    const onder = onderRef.current;
    if (!boven || !onder) return klaar();
    lagenRef.current?.classList.add('app__lagen--vegen');
    zet(boven, onder, boven.clientWidth, DUUR);
    setTimeout(() => {
      lagenRef.current?.classList.remove('app__lagen--vegen');
      onder.style.transform = '';
      onder.style.transition = '';
      klaar();
    }, DUUR);
  };
}

/** Bovenste pagina `dx` pixels naar rechts; de onderste schuift een stukje mee, zoals in iOS. */
function zet(boven: HTMLElement, onder: HTMLElement, dx: number, duur = 0) {
  const breedte = boven.clientWidth || 1;
  const voortgang = Math.min(Math.max(dx / breedte, 0), 1);
  const overgang = duur ? `transform ${duur}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : 'none';
  boven.style.transition = overgang;
  onder.style.transition = overgang;
  boven.style.transform = `translateX(${dx}px)`;
  onder.style.transform = `translateX(${(voortgang - 1) * 28}%)`;
}

function useVegenTerug({
  lagenRef,
  bovenRef,
  onderRef,
  actief,
  heeftOnder,
  terug,
}: {
  lagenRef: RefObject<HTMLElement | null>;
  bovenRef: RefObject<HTMLDivElement | null>;
  onderRef: RefObject<HTMLDivElement | null>;
  actief: boolean;
  heeftOnder: boolean;
  terug: () => void;
}) {
  const terugRef = useRef(terug);
  terugRef.current = terug;

  useEffect(() => {
    const lagen = lagenRef.current;
    if (!lagen || !actief) return;

    let start: { x: number; y: number; t: number } | null = null;
    /** null: nog niet besloten; true: zijwaarts vegen; false: gewoon scrollen. */
    let zijwaarts: boolean | null = null;
    let dx = 0;

    const begin = (e: TouchEvent) => {
      const t = e.touches[0];
      start = e.touches.length === 1 && !inInvoer(e.target) ? { x: t.clientX, y: t.clientY, t: e.timeStamp } : null;
      zijwaarts = null;
      dx = 0;
    };

    const beweeg = (e: TouchEvent) => {
      if (!start) return;
      const t = e.touches[0];
      const x = t.clientX - start.x;
      const y = t.clientY - start.y;
      if (zijwaarts === null) {
        if (Math.abs(x) < 10 && Math.abs(y) < 10) return;
        zijwaarts = x > 0 && Math.abs(x) > Math.abs(y) * 1.2;
        if (zijwaarts && heeftOnder) lagen.classList.add('app__lagen--vegen');
      }
      if (!zijwaarts) return;
      // Niet tegelijk de pagina laten scrollen.
      e.preventDefault();
      dx = Math.max(x, 0);
      if (heeftOnder && bovenRef.current && onderRef.current) zet(bovenRef.current, onderRef.current, dx);
    };

    const eind = (e: TouchEvent) => {
      if (!start || !zijwaarts) {
        start = null;
        return;
      }
      const snelheid = dx / Math.max(e.timeStamp - start.t, 1);
      start = null;
      const boven = bovenRef.current;
      const onder = onderRef.current;
      const ver = boven ? dx > boven.clientWidth * 0.33 : false;
      const doorgaan = ver || (dx > 30 && snelheid > 0.5);

      if (!heeftOnder || !boven || !onder) {
        // Geen pagina eronder (bijvoorbeeld direct geopend): gewoon de terugknop gebruiken.
        if (doorgaan) boven?.querySelector<HTMLAnchorElement>('a.terug')?.click();
        return;
      }
      if (doorgaan) {
        terugRef.current();
        return;
      }
      // Niet ver genoeg: terugveren.
      zet(boven, onder, 0, DUUR);
      setTimeout(() => {
        lagen.classList.remove('app__lagen--vegen');
        for (const el of [boven, onder]) {
          el.style.transform = '';
          el.style.transition = '';
        }
      }, DUUR);
    };

    lagen.addEventListener('touchstart', begin, { passive: true });
    lagen.addEventListener('touchmove', beweeg, { passive: false });
    lagen.addEventListener('touchend', eind, { passive: true });
    lagen.addEventListener('touchcancel', eind, { passive: true });
    return () => {
      lagen.removeEventListener('touchstart', begin);
      lagen.removeEventListener('touchmove', beweeg);
      lagen.removeEventListener('touchend', eind);
      lagen.removeEventListener('touchcancel', eind);
    };
  }, [lagenRef, bovenRef, onderRef, actief, heeftOnder]);
}
