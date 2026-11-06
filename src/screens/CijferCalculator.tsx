import { useState } from 'react';
import { Invoerrij } from '../components/les/Invoerrij';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { useCijfers } from '../hooks/useCijfers';
import { formatCijfer, perVak, somEnWeging } from '../lib/cijfers';
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

/**
 * Cijfercalculator in drie stukken: vak kiezen, "Wat ga ik staan?" en "Wat moet ik halen?".
 * Alles blijft in de app; er gaat niets naar Magister.
 */
export function CijferCalculator() {
  const { cijfers, sub } = useCijfers();
  const vakken = cijfers ? perVak(cijfers) : [];

  const [vakCode, setVakCode] = useState('');
  const vak = vakken.find((v) => v.vak.code === vakCode) ?? vakken[0];

  const [nieuw, setNieuw] = useState('');
  const [nieuwWeging, setNieuwWeging] = useState('');
  const [staan, setStaan] = useState<string | null>(null);

  const [doel, setDoel] = useState('');
  const [doelWeging, setDoelWeging] = useState('');
  const [halen, setHalen] = useState<string | null>(null);

  const kop = (
    <>
      <TerugLink naar="/cijfers" label="Cijfers" />
      <PaginaKop titel="Calculator" sub={sub} />
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
    setStaan(null);
    setHalen(null);
  };

  /** Wat ga ik staan? Huidig gemiddelde plus het nieuwe cijfer met zijn weging. */
  const berekenStaan = () => {
    const c = parse(nieuw);
    const w = parse(nieuwWeging || '1');
    if (c === null || c < 1 || c > 10) return setStaan('Vul een cijfer tussen 1 en 10 in.');
    if (w === null || w <= 0) return setStaan('Vul een weging groter dan 0 in.');
    setStaan(`Dan sta je een ${formatCijfer((som + c * w) / (W + w))}.`);
  };

  /** Wat moet ik halen? Het cijfer dat je nodig hebt voor het gewenste gemiddelde. */
  const berekenHalen = () => {
    const d = parse(doel);
    const w = parse(doelWeging || '1');
    if (d === null || d < 1 || d > 10) return setHalen('Een gemiddelde ligt tussen 1 en 10.');
    if (w === null || w <= 0) return setHalen('Vul een weging groter dan 0 in.');
    const x = (d * (W + w) - som) / w;
    const nodig = Math.ceil(x * 10) / 10;
    if (x <= 1) setHalen('Dat haal je sowieso, zelfs met een 1.');
    else if (nodig > 10) setHalen(`Niet haalbaar: je zou een ${formatCijfer(x)} nodig hebben.`);
    else setHalen(`Je moet minstens een ${formatCijfer(nodig)} halen.`);
  };

  return (
    <div className="pagina pagina--met-terug">
      {kop}

      <Sectie titel="Kies een vak">
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
            <span>Huidig gemiddelde</span>
            <span className="instelrij__waarde">{huidig === null ? '—' : formatCijfer(huidig)}</span>
          </div>
        </section>
      </Sectie>

      <Sectie titel="Wat ga ik staan?">
        <section className="kaart">
          <Invoerrij label="Nieuw cijfer" voor="calc-nieuw">
            <input
              id="calc-nieuw"
              className="invoerrij__veld"
              inputMode="decimal"
              placeholder="Bijv. 6,5"
              value={nieuw}
              onChange={(e) => setNieuw(e.target.value)}
            />
          </Invoerrij>
          <Invoerrij label="Weging" voor="calc-nieuw-weging">
            <input
              id="calc-nieuw-weging"
              className="invoerrij__veld"
              inputMode="decimal"
              placeholder="1"
              value={nieuwWeging}
              onChange={(e) => setNieuwWeging(e.target.value)}
            />
          </Invoerrij>
        </section>
        <button type="button" className="knop-primair calc-knop" onClick={berekenStaan}>
          Bereken
        </button>
        {staan && <p className="calc-uitkomst">{staan}</p>}
      </Sectie>

      <Sectie titel="Wat moet ik halen?">
        <section className="kaart">
          <Invoerrij label="Ik wil staan" voor="calc-doel">
            <input
              id="calc-doel"
              className="invoerrij__veld"
              inputMode="decimal"
              placeholder="Bijv. 7,0"
              value={doel}
              onChange={(e) => setDoel(e.target.value)}
            />
          </Invoerrij>
          <Invoerrij label="Weging" voor="calc-doel-weging">
            <input
              id="calc-doel-weging"
              className="invoerrij__veld"
              inputMode="decimal"
              placeholder="1"
              value={doelWeging}
              onChange={(e) => setDoelWeging(e.target.value)}
            />
          </Invoerrij>
        </section>
        <button type="button" className="knop-primair calc-knop" onClick={berekenHalen}>
          Bereken
        </button>
        {halen && <p className="calc-uitkomst">{halen}</p>}
      </Sectie>
    </div>
  );
}
