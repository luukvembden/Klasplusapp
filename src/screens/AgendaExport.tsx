import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { api } from '../api';
import { Invoerrij } from '../components/les/Invoerrij';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { VasteKop } from '../components/ui/VasteKop';
import { beginVanDag, maandagVan, naarInvoer, plusDagen, vanInvoer } from '../lib/datum';
import { bestandsnaam, maakIcs, openIcs } from '../lib/ics';
import { useInstellingen } from '../lib/instellingen';
import '../components/les/les.css';
import '../components/ui/ui.css';
import '../components/instellingen/instellingen.css';
import '../components/meer/meer.css';

/** Langer dan dit geeft de school niet in één keer; ook genoeg voor een agenda. */
const MAX_DAGEN = 92;

const vandaag = () => beginVanDag(new Date());

/** Snelle keuzes voor de periode; van en tot zijn allebei inclusief. */
const SNEL: { naam: string; periode: () => [Date, Date] }[] = [
  { naam: 'Deze week', periode: () => [maandagVan(vandaag()), plusDagen(maandagVan(vandaag()), 6)] },
  { naam: 'Volgende week', periode: () => [plusDagen(maandagVan(vandaag()), 7), plusDagen(maandagVan(vandaag()), 13)] },
  { naam: '4 weken', periode: () => [vandaag(), plusDagen(vandaag(), 27)] },
];

/**
 * Rooster exporteren: kies een periode, en Klas+ maakt een .ics-bestand dat je in Apple Agenda (of een
 * andere agenda-app) kunt zetten. Titel, lokaal als locatie en de tekst van de docent als notitie.
 */
export function AgendaExport() {
  const { agenda } = useInstellingen();
  const [van, setVan] = useState(() => naarInvoer(maandagVan(vandaag())));
  const [tot, setTot] = useState(() => naarInvoer(plusDagen(maandagVan(vandaag()), 6)));
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const begin = vanInvoer(van);
  const einde = vanInvoer(tot);
  const dagen = begin && einde ? Math.round((einde.getTime() - begin.getTime()) / 86_400_000) + 1 : 0;
  const probleem = !begin || !einde
    ? 'Kies een begin- en einddatum.'
    : dagen < 1
      ? 'De einddatum ligt vóór de begindatum.'
      : dagen > MAX_DAGEN
        ? 'Kies een periode van hoogstens drie maanden.'
        : null;

  const kies = ([a, b]: [Date, Date]) => {
    setVan(naarInvoer(a));
    setTot(naarInvoer(b));
    setMelding(null);
    setFout(null);
  };

  const exporteer = async () => {
    if (!begin || !einde || probleem) return;
    setBezig(true);
    setMelding(null);
    setFout(null);
    try {
      const resultaat = await api.afspraken(begin, plusDagen(einde, 1));
      const { tekst, aantal } = maakIcs(resultaat.data, agenda === 'modern');
      if (aantal === 0) {
        setMelding('Er staat niets in je rooster in deze periode.');
        return;
      }
      await openIcs(tekst, bestandsnaam(begin, einde));
      const staan = aantal === 1 ? '1 afspraak staat' : `${aantal} afspraken staan`;
      const platform = Capacitor.getPlatform();
      setMelding(
        platform === 'ios'
          ? `${staan} in het bestand. Kies in het voorbeeld "Voeg alles toe" om ze in Agenda te zetten.`
          : platform === 'android'
            ? `${staan} in het bestand. Kies je agenda-app en bevestig het toevoegen.`
            : `${staan} in het gedownloade bestand. Open het om ze in je agenda te zetten.`,
      );
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'Exporteren is niet gelukt.');
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar="/meer" label="Meer" />
        <PaginaKop sub="Naar Apple Agenda of een andere agenda-app" titel="Rooster exporteren" />
      </VasteKop>

      <div className="export__snel" role="group" aria-label="Snel kiezen">
        {SNEL.map((s) => (
          <button key={s.naam} type="button" className="export__chip" onClick={() => kies(s.periode())}>
            {s.naam}
          </button>
        ))}
      </div>

      <Sectie titel="Periode">
        <section className="kaart">
          <Invoerrij label="Van" voor="export-van">
            <input
              id="export-van"
              type="date"
              className="invoerrij__veld"
              value={van}
              onChange={(e) => {
                setVan(e.target.value);
                setMelding(null);
              }}
            />
          </Invoerrij>
          <Invoerrij label="Tot en met" voor="export-tot">
            <input
              id="export-tot"
              type="date"
              className="invoerrij__veld"
              value={tot}
              onChange={(e) => {
                setTot(e.target.value);
                setMelding(null);
              }}
            />
          </Invoerrij>
        </section>
      </Sectie>

      <Sectie titel="Wat er meegaat">
        <section className="kaart export__uitleg">
          <p>
            <b>Titel</b> zoals in je Agenda, <b>lokaal</b> als locatie en de <b>tekst van de docent</b> (huiswerk,
            informatie) als notitie. Vervallen uren gaan niet mee.
          </p>
        </section>
      </Sectie>

      <p className="export__let-op">
        Let op: dit is een momentopname. Verandert je rooster daarna (een uur vervalt, ander lokaal, andere
        docent), dan past je agenda zich niet aan. Kijk voor het actuele rooster altijd in Klas+.
      </p>

      {probleem && begin && einde && <p className="melding">{probleem}</p>}
      {fout && <p className="melding">{fout}</p>}
      {melding && <p className="export__klaar">{melding}</p>}

      <button type="button" className="knop-primair" onClick={exporteer} disabled={bezig || !!probleem}>
        {bezig ? 'Bezig…' : 'Exporteren'}
      </button>
    </div>
  );
}
