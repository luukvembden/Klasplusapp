import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type MeldingInvoer, type MeldOpties } from '../api';
import { Invoerrij, opMoment } from '../components/les/Invoerrij';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { useLaden } from '../hooks/useLaden';
import { beginVanDag, naarInvoer, plusDagen, vanInvoer } from '../lib/datum';
import { meldbareDagen } from '../lib/meldingen';
import { wanneer } from './AfwezigheidMelden';
import '../components/instellingen/instellingen.css';
import '../components/les/les.css';
import '../components/afwezigheid/afwezigheid.css';

/** Afwezig melden, in dezelfde opbouw als een nieuwe afspraak. Wat er mag, bepaalt de school. */
export function NieuweMelding() {
  const opties = useLaden(() => api.meldOpties(), []);

  if (!opties.data?.kanMelden) {
    return (
      <div className="pagina pagina--met-terug">
        <TerugLink naar="/afwezigheid/melden" label="Meldingen" />
        <p className="melding">{opties.fout ?? (opties.laden && !opties.data ? 'Bezig met laden…' : 'Afwezig melden kan niet voor dit account.')}</p>
      </div>
    );
  }
  return <MeldFormulier opties={opties.data} />;
}

function MeldFormulier({ opties }: { opties: MeldOpties }) {
  const navigate = useNavigate();
  const profiel = useLaden(() => api.profiel(), []);
  const vandaag = naarInvoer(beginVanDag(new Date()));
  // Bij de oude manier van de school: alleen vandaag of morgen, nooit in het weekend.
  const dagen = opties.alleenVandaagOfMorgen ? meldbareDagen().map(naarInvoer) : null;
  const eerste = dagen ? dagen[0] : vandaag;
  const laatste = dagen ? dagen[dagen.length - 1] : undefined;

  const [redenCode, setRedenCode] = useState('');
  const [heleDag, setHeleDag] = useState(true);
  const [beginDatum, setBeginDatum] = useState(eerste ?? vandaag);
  const [eindDatum, setEindDatum] = useState(eerste ?? vandaag);
  const [beginTijd, setBeginTijd] = useState('08:30');
  const [eindTijd, setEindTijd] = useState('12:00');
  const [opmerking, setOpmerking] = useState('');
  const [bevestigen, setBevestigen] = useState<MeldingInvoer | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const ouder = profiel.data?.data.ouder;
  const naam = ouder ? (ouder.kinderen.find((k) => k.id === ouder.gekozen)?.naam.split(' ')[0] ?? 'je kind') : 'jezelf';
  const reden = opties.redenen.find((r) => r.code === redenCode) ?? null;

  /** Elke wijziging haalt een foutmelding of open vraag weg. */
  const wijzig =
    <T,>(zet: (w: T) => void) =>
    (waarde: T) => {
      zet(waarde);
      setFout(null);
      setBevestigen(null);
    };

  const kiesBegin = wijzig((waarde: string) => {
    setBeginDatum(waarde);
    // Einde mag niet vóór het begin liggen.
    if (waarde && eindDatum < waarde) setEindDatum(waarde);
  });

  const controleer = () => {
    if (opties.redenen.length > 0 && !reden) return setFout('Kies een reden.');
    if (reden?.toelichtingVerplicht && !opmerking.trim()) return setFout('Bij deze reden hoort een toelichting.');
    if (!vanInvoer(beginDatum) || !vanInvoer(eindDatum)) return setFout('Kies een begin- en einddatum.');
    if (dagen && (!dagen.includes(beginDatum) || !dagen.includes(eindDatum))) {
      return setFout('Je school laat alleen melden voor vandaag of morgen, en niet in het weekend.');
    }
    const start = heleDag ? vanInvoer(beginDatum)! : opMoment(beginDatum, beginTijd);
    // Een hele dag loopt tot het begin van de dag na de einddatum.
    const einde = heleDag ? plusDagen(vanInvoer(eindDatum)!, 1) : opMoment(eindDatum, eindTijd);
    if (einde <= start) return setFout('Het einde moet na het begin liggen.');
    setFout(null);
    setBevestigen({ reden, heleDag, start: start.toISOString(), einde: einde.toISOString(), opmerking: opmerking.trim() });
  };

  const versturen = async (melding: MeldingInvoer) => {
    setBezig(true);
    setFout(null);
    try {
      await api.meldAfwezig(melding);
    } catch (e) {
      setBezig(false);
      setBevestigen(null);
      return setFout(
        navigator.onLine
          ? `Melden is niet gelukt. (${e instanceof Error ? e.message : String(e)})`
          : 'Je bent offline. Afwezig melden kan alleen met internet.',
      );
    }
    const gelukt = `${ouder ? naam : 'Je'} ${ouder ? 'is' : 'bent'} afwezig gemeld.`;
    navigate('/afwezigheid/melden', { replace: true, state: { gelukt } });
  };

  // Bij de oude manier kan het op zaterdag helemaal niet.
  if (dagen && dagen.length === 0) {
    return (
      <div className="pagina pagina--met-terug">
        <TerugLink naar="/afwezigheid/melden" label="Meldingen" />
        <PaginaKop titel="Afwezigheid melden" />
        <p className="melding">In het weekend kun je niet afwezig melden. Vanaf zondag kan het weer voor maandag.</p>
      </div>
    );
  }

  return (
    <div className="pagina pagina--met-terug">
      <TerugLink naar="/afwezigheid/melden" label="Meldingen" />
      <PaginaKop titel="Afwezigheid melden" />

      {opties.redenen.length > 0 && (
        <section className="kaart">
          <Invoerrij label="Reden" voor="reden">
            <select
              id="reden"
              className="invoerrij__veld invoerrij__keuze"
              value={redenCode}
              onChange={(e) => wijzig(setRedenCode)(e.target.value)}
            >
              <option value="" disabled>
                Kies een reden
              </option>
              {opties.redenen.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.naam}
                </option>
              ))}
            </select>
          </Invoerrij>
        </section>
      )}

      <Sectie titel="Wanneer">
        <section className="kaart">
          {/* Bij de oude manier meldt de school altijd een hele dag. */}
          {!opties.alleenVandaagOfMorgen && (
            <label className="instelrij">
              <span>Hele dag</span>
              <input
                type="checkbox"
                role="switch"
                checked={heleDag}
                onChange={(e) => wijzig(setHeleDag)(e.target.checked)}
              />
            </label>
          )}
          <Invoerrij label="Begin" voor="begindatum">
            <span className="invoerrij__velden">
              <input
                id="begindatum"
                type="date"
                className="invoerrij__veld"
                value={beginDatum}
                min={eerste}
                max={laatste}
                onChange={(e) => kiesBegin(e.target.value)}
              />
              {!heleDag && (
                <input
                  type="time"
                  aria-label="Begintijd"
                  className="invoerrij__veld invoerrij__tijd"
                  value={beginTijd}
                  onChange={(e) => wijzig(setBeginTijd)(e.target.value)}
                />
              )}
            </span>
          </Invoerrij>
          <Invoerrij label="Einde" voor="einddatum">
            <span className="invoerrij__velden">
              <input
                id="einddatum"
                type="date"
                className="invoerrij__veld"
                value={eindDatum}
                min={beginDatum}
                max={laatste}
                onChange={(e) => wijzig(setEindDatum)(e.target.value)}
              />
              {!heleDag && (
                <input
                  type="time"
                  aria-label="Eindtijd"
                  className="invoerrij__veld invoerrij__tijd"
                  value={eindTijd}
                  onChange={(e) => wijzig(setEindTijd)(e.target.value)}
                />
              )}
            </span>
          </Invoerrij>
        </section>
      </Sectie>

      <Sectie titel="Details">
        <section className="kaart">
          <textarea
            className="invoer-beschrijving"
            aria-label="Toelichting"
            placeholder={reden?.toelichtingVerplicht ? 'Toelichting voor school (verplicht)' : 'Toelichting voor school (optioneel)'}
            rows={4}
            maxLength={255}
            value={opmerking}
            onChange={(e) => wijzig(setOpmerking)(e.target.value)}
          />
        </section>
      </Sectie>

      {fout && (
        <p className="formulier-fout" role="alert">
          {fout}
        </p>
      )}

      {bevestigen ? (
        <section className="kaart bevestiging">
          <p>
            Wil je <strong>{naam}</strong> afwezig melden
            {bevestigen.reden ? ` (${bevestigen.reden.naam.toLowerCase()})` : ''} voor{' '}
            {wanneer(bevestigen).toLowerCase()}? De melding gaat direct naar school.
          </p>
          <div className="bevestiging__knoppen">
            <button type="button" className="knop-secundair" onClick={() => setBevestigen(null)} disabled={bezig}>
              Terug
            </button>
            <button type="button" className="knop-primair" onClick={() => versturen(bevestigen)} disabled={bezig}>
              {bezig ? 'Versturen…' : 'Ja, versturen'}
            </button>
          </div>
        </section>
      ) : (
        <button type="button" className="knop-primair" onClick={controleer}>
          Afwezig melden
        </button>
      )}
    </div>
  );
}
