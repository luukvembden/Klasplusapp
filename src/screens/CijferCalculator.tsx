import { useState } from 'react';
import { Invoerrij } from '../components/les/Invoerrij';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { useCijfers } from '../hooks/useCijfers';
import { formatCijfer, isOnvoldoende, perVak, somEnWeging } from '../lib/cijfers';
import { metHoofdletter } from '../lib/tekst';
import '../components/cijfers/cijfers.css';
import '../components/les/les.css';
import '../components/instellingen/instellingen.css';
import '../components/ui/ui.css';

/** "7,0" of "7.0" → 7. Null bij iets wat geen getal is. */
const parse = (s: string): number | null => {
  const n = Number.parseFloat((s ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/** Een uitkomst: een getal met een label, of alleen een korte uitleg (bij foute invoer of een randgeval). */
interface Uitkomst {
  label?: string;
  waarde?: number;
  uitleg?: string;
}

/** De uitkomst als laatste regel in de kaart, met het getal groot in de accentkleur. */
function UitkomstRij({ uitkomst }: { uitkomst: Uitkomst }) {
  return (
    <div className="calc-uitkomst" aria-live="polite">
      {uitkomst.label && uitkomst.waarde !== undefined && (
        <div className="calc-uitkomst__rij">
          <span>{uitkomst.label}</span>
          <span className={`calc-uitkomst__getal${isOnvoldoende(uitkomst.waarde) ? ' calc-uitkomst__getal--laag' : ''}`}>
            {formatCijfer(uitkomst.waarde)}
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
  const [stel, setStel] = useState<Uitkomst | null>(null);

  const [doel, setDoel] = useState('');
  const [doelWeging, setDoelWeging] = useState('');
  const [nodig, setNodig] = useState<Uitkomst | null>(null);

  const kop = (
    <>
      <TerugLink naar="/cijfers" label="Cijfers" />
      <PaginaKop titel="Rekenhulp" sub={sub} />
    </>
  );

  if (!cijfers) {
    return (
      <div className="pagina pagina--met-terug">
        {kop}
        <p className="melding">Bezig met laden…</p>
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

  const kiesVak = (code: string) => {
    setVakCode(code);
    setStel(null);
    setNodig(null);
  };

  /** Stel dat ik dit haal: het gemiddelde met het nieuwe cijfer erbij. */
  const rekenStel = () => {
    const c = parse(nieuw);
    const w = parse(nieuwWeging || '1');
    if (c === null || c < 1 || c > 10) return setStel({ uitleg: 'Vul een cijfer van 1 tot en met 10 in.' });
    if (w === null || w <= 0) return setStel({ uitleg: 'De weging moet meer dan 0 zijn.' });
    setStel({ label: 'Nieuw gemiddelde', waarde: (som + c * w) / (W + w) });
  };

  /** Mijn doel: het laagste cijfer waarmee je je doelgemiddelde haalt. */
  const rekenNodig = () => {
    const d = parse(doel);
    const w = parse(doelWeging || '1');
    if (d === null || d < 1 || d > 10) return setNodig({ uitleg: 'Kies een doel van 1 tot en met 10.' });
    if (w === null || w <= 0) return setNodig({ uitleg: 'De weging moet meer dan 0 zijn.' });
    const x = (d * (W + w) - som) / w;
    const minimaal = Math.ceil(x * 10) / 10;
    if (x <= 1) setNodig({ uitleg: 'Geen zorgen: dit doel haal je met elk cijfer.' });
    else if (minimaal > 10) setNodig({ uitleg: `Met één toets lukt dit niet; daarvoor zou je een ${formatCijfer(x)} nodig hebben.` });
    else setNodig({ label: 'Minimaal nodig', waarde: minimaal });
  };

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
              onChange={(e) => kiesVak(e.target.value)}
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
              placeholder="1×"
              value={nieuwWeging}
              onChange={(e) => setNieuwWeging(e.target.value)}
            />
          </Invoerrij>
          {stel && <UitkomstRij uitkomst={stel} />}
        </section>
        <button type="button" className="knop-primair calc-knop" onClick={rekenStel}>
          Reken uit
        </button>
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
              placeholder="1×"
              value={doelWeging}
              onChange={(e) => setDoelWeging(e.target.value)}
            />
          </Invoerrij>
          {nodig && <UitkomstRij uitkomst={nodig} />}
        </section>
        <button type="button" className="knop-primair calc-knop" onClick={rekenNodig}>
          Reken uit
        </button>
      </Sectie>
    </div>
  );
}
