// De docent typt huiswerk als HTML. Wij tonen het als gewone tekst: veilig (geen scripts of
// opmaak van buiten) en rustig in onze eigen stijl. Links blijven aanklikbaar.

const BLOKKEN = new Set(['P', 'DIV', 'BR', 'LI', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4', 'TR', 'TABLE']);

/** HTML → tekst met regeleinden; lijstjes krijgen een bolletje, links hun adres erachter. */
export function htmlNaarTekst(html: string): string {
  // DOMParser voert geen scripts uit en laadt geen afbeeldingen.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let uit = '';

  const loop = (knoop: Node) => {
    if (knoop.nodeType === Node.TEXT_NODE) {
      uit += (knoop.textContent ?? '').replace(/\s+/g, ' ');
      return;
    }
    if (!(knoop instanceof Element)) return;
    const naam = knoop.tagName;
    if (naam === 'BR') {
      uit += '\n';
      return;
    }
    if (naam === 'LI') uit += '\n• ';
    else if (BLOKKEN.has(naam)) uit += '\n';
    knoop.childNodes.forEach(loop);
    if (naam === 'A') {
      const href = knoop.getAttribute('href') ?? '';
      if (/^https?:\/\//.test(href) && !(knoop.textContent ?? '').includes(href)) uit += ` (${href})`;
    }
    if (BLOKKEN.has(naam) && naam !== 'LI') uit += '\n';
  };
  doc.body.childNodes.forEach(loop);

  return uit
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** "aardrijkskunde" → "Aardrijkskunde" */
export function metHoofdletter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Splitst tekst in stukken gewone tekst en links. */
export function metLinks(tekst: string): { tekst: string; link?: string }[] {
  return tekst
    .split(/(https?:\/\/[^\s)]+)/g)
    .filter(Boolean)
    .map((stuk) => (/^https?:\/\//.test(stuk) ? { tekst: stuk, link: stuk } : { tekst: stuk }));
}

/** Opent een link buiten de app: in de telefoon-app in de systeembrowser, anders in een nieuw tabblad. */
export function openExtern(url: string) {
  const browser = window.cordova?.InAppBrowser;
  if (browser) browser.open(url, '_system', '');
  else window.open(url, '_blank', 'noopener');
}
