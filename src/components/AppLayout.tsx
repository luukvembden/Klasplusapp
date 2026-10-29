import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Routes, useLocation, useNavigate, type Location } from 'react-router-dom';
import { LaagZichtbaar, LagenContext } from '../lib/laag';
import { paginaRoutes, TABS } from '../paginaRoutes';
import { TabBar } from './TabBar';

/** Eén pagina in de stapel, met de plek in de browsergeschiedenis waar hij hoort. */
interface Laag {
  idx: number;
  location: Location;
}

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
  if (bovenste?.location.key !== location.key) {
    const idx = (window.history.state?.idx as number | undefined) ?? 0;
    stapel.current = TABS.has(location.pathname)
      ? [{ idx, location }]
      : [...stapel.current.filter((l) => l.idx < idx), { idx, location }];
  }
  const lagen = stapel.current;

  // Telt per pagina hoe vaak hij bovenop kwam; zo ververst een pagina waar je naar terugkeert.
  const tellers = useRef(new Map<string, number>());
  const vorigeBoven = useRef<string | null>(null);
  const bovenSleutel = lagen[lagen.length - 1].location.key;
  if (vorigeBoven.current !== bovenSleutel) {
    vorigeBoven.current = bovenSleutel;
    tellers.current.set(bovenSleutel, (tellers.current.get(bovenSleutel) ?? 0) + 1);
    for (const sleutel of tellers.current.keys()) {
      if (!lagen.some((l) => l.location.key === sleutel)) tellers.current.delete(sleutel);
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
  }, [location.key, lagen.length]);

  const terug = schuifTerug(lagenRef, bovenRef, onderRef, () => navigate(-1));

  useVegenTerug({
    lagenRef,
    bovenRef,
    onderRef,
    actief: !isTab,
    heeftOnder,
    terug,
  });

  return (
    <LagenContext.Provider value={{ terug: () => (heeftOnder ? (terug(), true) : false) }}>
      <div className="app">
        <main ref={lagenRef} className={`app__inhoud app__lagen${inschuiven ? ' app__lagen--schuift' : ''}`}>
          {lagen.map((laag, i) => {
            const boven = i === lagen.length - 1;
            const onder = i === lagen.length - 2;
            return (
              <div
                key={laag.location.key}
                ref={boven ? bovenRef : onder ? onderRef : undefined}
                className={`laag ${boven ? 'laag--boven' : onder ? 'laag--onder' : 'laag--weg'}${boven && inschuiven ? ' laag--nieuw' : ''}`}
                inert={!boven}
                aria-hidden={boven ? undefined : true}
              >
                <LaagZichtbaar.Provider value={tellers.current.get(laag.location.key) ?? 0}>
                  <Routes location={laag.location}>{paginaRoutes}</Routes>
                </LaagZichtbaar.Provider>
              </div>
            );
          })}
        </main>
        <TabBar />
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
