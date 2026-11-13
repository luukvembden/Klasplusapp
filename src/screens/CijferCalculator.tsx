import { useState } from 'react';
import { Invoerrij } from '../components/les/Invoerrij';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { VasteKop } from '../components/ui/VasteKop';
import { useCijfers } from '../hooks/useCijfers';
import { formatCijfer, isOnvoldoende, perVak, somEnWeging } from '../lib/cijfers';
import { metHoofdletter } from '../lib/tekst';
import '../components/cijfers/cijfers.css';
import '../components/les/les.css';
import '../components/instellingen/instellingen.css';
import '../components/ui/ui.css';
import { LaadKaart } from '../components/ui/Laden';

/** "7,0" of "7.0" → 7. Null bij iets wat geen getal is. */
const parse = (s: string): number | null => {
  const n = Number.parseFloat((s ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/**
 * Een uitkomst: een label met een getal (of een streepje zolang er nog niets is ingevuld), of alleen een
 * korte uitleg (bij foute invoer of een randgeval).
 */
interface Uitkomst {
  label?: string;
  waarde?: number | null;
  uitleg?: string;
}

/** De uitkomst als laatste regel in de kaart, met het getal groot in de accentkleur. */
function UitkomstRij({ uitkomst }: { uitkomst: Uitkomst }) {
  return (
    <div className="calc-uitkomst" aria-live="polite">
      {uitkomst.label && uitkomst.waarde !== undefined && (
        <div className="calc-uitkomst__rij">
          <span>{uitkomst.label}</span>
          <span
            className={`calc-uitkomst__getal${
              uitkomst.waarde !== null && isOnvoldoende(uitkomst.waarde) ? ' calc-uitkomst__getal--laag' : ''
            }`}
          >
            {uitkomst.waarde === null ? '-' : formatCijfer(uitkomst.waarde)}
          </span>
        </div>
      )}
      {uitkomst.uitleg && <p className="calc-uitkomst__uitleg">{uitkomst.uitleg}</p>}
    </div>
  );
}

/**
 * Cijfercalculator: kies een vak, kijk wat een nieuw cijfer met je gemiddelde doet,
 * of reken uit wat je nodig hebt voor je doel. Alles blijft in de app; er gaat niets naar Magister.
 */
export function CijferCalculator() {
  const { cijfers, sub } = useCijfers();
  const vakken = cijfers ? perVak(cijfers) : [];

  const [vakCode, setVakCode] = useState('');
  const vak = vakken.find((v) => v.vak.code === vakCode) ?? vakken[0];

  const [nieuw, setNieuw] = useState('');
  const [nieuwWeging, setNieuwWeging] = useState('');

  const [doel, setDoel] = useState('');
  const [doelWeging, setDoelWeging] = useState('');

  const kop = (
    <VasteKop>
      <TerugLink naar="/cijfers" label="Cijfers" />
      <PaginaKop titel="Cijfercalculator" sub={sub} />
    </VasteKop>
  );

  if (!cijfers) {
    return (
      <div className="pagina pagina--met-terug">
        {kop}
        <LaadKaart rijen={3} />
      </div>
    );
  }
  if (vakken.length === 0) {
    return (
      <div className="pagina pagina--met-terug">
        {kop}
        <p className="melding">Nog geen cijfers om mee te rekenen.</p>
      </div>
    );
  }

  const { som, weging: W } = vak ? somEnWeging(vak.cijfers) : { som: 0, weging: 0 };
  const huidig = W > 0 ? som / W : null;

  // De uitkomsten rekenen meteen mee terwijl je typt, maar pas als beide velden zijn ingevuld (ook de
  // weging); tot die tijd staat er een streepje.

  /** Stel dat ik dit haal: het gemiddelde met het nieuwe cijfer erbij. */
  const stel = ((): Uitkomst => {
    if (!nieuw.trim() || !nieuwWeging.trim()) return { label: 'Nieuw gemiddelde', waarde: null };
    const c = parse(nieuw);
    const w = parse(nieuwWeging);
    if (c === null || c < 1 || c > 10) return { uitleg: 'Vul een cijfer van 1 tot en met 10 in.' };
    if (w === null || w <= 0) return { uitleg: 'De weging moet meer dan 0 zijn.' };
    return { label: 'Nieuw gemiddelde', waarde: (som + c * w) / (W + w) };
  })();

  /** Mijn doel: het laagste cijfer waarmee je je doelgemiddelde haalt. */
  const nodig = ((): Uitkomst => {
    if (!doel.trim() || !doelWeging.trim()) return { label: 'Minimaal nodig', waarde: null };
    const d = parse(doel);
    const w = parse(doelWeging);
    if (d === null || d < 1 || d > 10) return { uitleg: 'Kies een doel van 1 tot en met 10.' };
    if (w === null || w <= 0) return { uitleg: 'De weging moet meer dan 0 zijn.' };
    const x = (d * (W + w) - som) / w;
    const minimaal = Math.ceil(x * 10) / 10;
    if (x <= 1) return { uitleg: 'Geen zorgen: dit doel haal je met elk cijfer.' };
    if (minimaal > 10) return { uitleg: `Met één toets lukt dit niet; daarvoor zou je een ${formatCijfer(x)} nodig hebben.` };
    return { label: 'Minimaal nodig', waarde: minimaal };
  })();

  return (
    <div className="pagina pagina--met-terug">
      {kop}

      <Sectie titel="Vak">
        <section className="kaart">
          <Invoerrij label="Vak" voor="calc-vak">
            <select
              id="calc-vak"
              className="invoerrij__veld invoerrij__keuze"
              value={vak?.vak.code ?? ''}
              onChange={(e) => setVakCode(e.target.value)}
            >
              {vakken.map((v) => (
                <option key={v.vak.code} value={v.vak.code}>
                  {metHoofdletter(v.vak.naam)}
                </option>
              ))}
            </select>
          </Invoerrij>
          <div className="instelrij instelrij--vast">
            <span>Nu gemiddeld</span>
            <span className="instelrij__waarde">{huidig === null ? '—' : formatCijfer(huidig)}</span>
          </div>
        </section>
      </Sectie>

      <Sectie titel="Stel, ik haal een…">
        <section className="kaart">
          <Invoerrij label="Cijfer" voor="calc-nieuw">
            <input
              id="calc-nieuw"
              className="invoerrij__veld"
              inputMode="decimal"
              placeholder="bijv. 6,5"
              value={nieuw}
              onChange={(e) => setNieuw(e.target.value)}
            />
          </Invoerrij>
          <Invoerrij label="Telt mee" voor="calc-nieuw-weging">
            <input
              id="calc-nieuw-weging"
              className="invoerrij__veld"
              inputMode="decimal"
              placeholder="bijv. 2"
              value={nieuwWeging}
              onChange={(e) => setNieuwWeging(e.target.value)}
            />
          </Invoerrij>
          <UitkomstRij uitkomst={stel} />
        </section>
      </Sectie>

      <Sectie titel="Mijn doel">
        <section className="kaart">
          <Invoerrij label="Doelgemiddelde" voor="calc-doel">
            <input
              id="calc-doel"
              className="invoerrij__veld"
              inputMode="decimal"
              placeholder="bijv. 7,0"
              value={doel}
              onChange={(e) => setDoel(e.target.value)}
            />
          </Invoerrij>
          <Invoerrij label="Volgende toets telt" voor="calc-doel-weging">
            <input
              id="calc-doel-weging"
              className="invoerrij__veld"
              inputMode="decimal"
              placeholder="bijv. 2"
              value={doelWeging}
              onChange={(e) => setDoelWeging(e.target.value)}
            />
          </Invoerrij>
          <UitkomstRij uitkomst={nodig} />
        </section>
      </Sectie>
    </div>
  );
}
