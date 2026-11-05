import { useState } from 'react';
import { X } from 'lucide-react';
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

/** "7,0" of "7.0" → 7. Null bij iets wat geen getal is. */
const parse = (s: string): number | null => {
  const n = Number.parseFloat((s ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/** Een verzonnen cijfer dat de leerling toevoegt om het effect te zien. Wordt nergens bewaard. */
interface Proef {
  id: number;
  cijfer: string;
  weging: string;
}

/**
 * Cijfercalculator: welk cijfer je nog moet halen voor een gewenst gemiddelde, en wat proefcijfers
 * doen met je gemiddelde. Alles alleen in de app; er gaat niets naar Magister.
 */
export function CijferCalculator() {
  const { cijfers, sub } = useCijfers();
  const vakken = cijfers ? perVak(cijfers) : [];

  const [vakCode, setVakCode] = useState('');
  const vak = vakken.find((v) => v.vak.code === vakCode) ?? vakken[0];

  const [doel, setDoel] = useState('7,0');
  const [weging, setWeging] = useState('1');

  const [proef, setProef] = useState<Proef[]>([]);
  const [volgnr, setVolgnr] = useState(1);

  if (!cijfers) {
    return (
      <div className="pagina pagina--met-terug">
        <TerugLink naar="/cijfers" label="Cijfers" />
        <PaginaKop titel="Calculator" sub={sub} />
        <p className="melding">Bezig met laden…</p>
      </div>
    );
  }

  const { som, weging: W } = vak ? somEnWeging(vak.cijfers) : { som: 0, weging: 0 };
  const huidig = W > 0 ? som / W : null;

  // Benodigd cijfer voor het gewenste gemiddelde, met de weging van de volgende toets.
  const doelN = parse(doel);
  const wN = parse(weging);
  let benodigd = 'Vul een gewenst gemiddelde in.';
  if (doelN !== null && (doelN < 1 || doelN > 10)) {
    benodigd = 'Een gemiddelde ligt tussen 1 en 10.';
  } else if (doelN !== null && wN !== null && wN > 0) {
    const x = (doelN * (W + wN) - som) / wN;
    const nodig = Math.ceil(x * 10) / 10;
    if (x <= 1) benodigd = 'Dat haal je sowieso — zelfs met een 1.';
    else if (nodig > 10) benodigd = `Niet haalbaar met deze toets; je zou een ${formatCijfer(x)} nodig hebben.`;
    else benodigd = `Je moet minstens een ${formatCijfer(nodig)} halen.`;
  }

  // Gemiddelde met de proefcijfers erbij.
  const geldig = proef
    .map((p) => ({ c: parse(p.cijfer), w: parse(p.weging) }))
    .filter((p): p is { c: number; w: number } => p.c !== null && p.c >= 1 && p.c <= 10 && p.w !== null && p.w > 0);
  const extraSom = geldig.reduce((a, p) => a + p.c * p.w, 0);
  const extraW = geldig.reduce((a, p) => a + p.w, 0);
  const metProef = W + extraW > 0 ? (som + extraSom) / (W + extraW) : null;

  const voegToe = () => {
    setProef([...proef, { id: volgnr, cijfer: '', weging: '1' }]);
    setVolgnr(volgnr + 1);
  };

  if (vakken.length === 0) {
    return (
      <div className="pagina pagina--met-terug">
        <TerugLink naar="/cijfers" label="Cijfers" />
        <PaginaKop titel="Calculator" sub={sub} />
        <p className="melding">Nog geen cijfers om mee te rekenen.</p>
      </div>
    );
  }

  return (
    <div className="pagina pagina--met-terug">
      <TerugLink naar="/cijfers" label="Cijfers" />
      <PaginaKop titel="Calculator" sub={sub} />

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
          <span>Huidig gemiddelde</span>
          <span className="instelrij__waarde">{huidig === null ? '—' : formatCijfer(huidig)}</span>
        </div>
      </section>

      <Sectie
        titel="Benodigd cijfer"
        nawoord={<p className="instellingen__let-op">Welk cijfer je op je volgende toets nog moet halen.</p>}
      >
        <section className="kaart">
          <Invoerrij label="Gewenst gemiddelde" voor="calc-doel">
            <input
              id="calc-doel"
              className="invoerrij__veld"
              inputMode="decimal"
              placeholder="7,0"
              value={doel}
              onChange={(e) => setDoel(e.target.value)}
            />
          </Invoerrij>
          <Invoerrij label="Weging volgende toets" voor="calc-weging">
            <input
              id="calc-weging"
              className="invoerrij__veld"
              inputMode="numeric"
              placeholder="1"
              value={weging}
              onChange={(e) => setWeging(e.target.value)}
            />
          </Invoerrij>
        </section>
        <p className="calc-uitkomst">{benodigd}</p>
      </Sectie>

      <Sectie
        titel="Proefcijfers"
        nawoord={
          <p className="instellingen__let-op">
            Verzonnen cijfers om te zien wat ze met je gemiddelde doen. Ze worden niet in Magister opgeslagen.
          </p>
        }
      >
        <section className="kaart">
          {proef.length === 0 && <p className="melding">Nog geen proefcijfers. Voeg er een toe.</p>}
          {proef.map((p) => (
            <div key={p.id} className="proefrij">
              <input
                className="invoerrij__veld proefrij__cijfer"
                inputMode="decimal"
                placeholder="Cijfer"
                aria-label="Cijfer"
                value={p.cijfer}
                onChange={(e) => setProef(proef.map((x) => (x.id === p.id ? { ...x, cijfer: e.target.value } : x)))}
              />
              <input
                className="invoerrij__veld proefrij__weging"
                inputMode="numeric"
                placeholder="Weging"
                aria-label="Weging"
                value={p.weging}
                onChange={(e) => setProef(proef.map((x) => (x.id === p.id ? { ...x, weging: e.target.value } : x)))}
              />
              <button
                type="button"
                className="proefrij__weg"
                aria-label="Proefcijfer verwijderen"
                onClick={() => setProef(proef.filter((x) => x.id !== p.id))}
              >
                <X size={18} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" className="proef-toevoegen" onClick={voegToe}>
            + Proefcijfer toevoegen
          </button>
        </section>
        {metProef !== null && (
          <div className="kaart calc-metproef">
            <span>Gemiddelde met proefcijfers</span>
            <span className="calc-metproef__waarde">{formatCijfer(metProef)}</span>
          </div>
        )}
      </Sectie>
    </div>
  );
}
