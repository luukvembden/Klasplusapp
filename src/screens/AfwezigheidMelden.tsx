import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api, type Melding } from '../api';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { useLaden } from '../hooks/useLaden';
import { dagTitel, korteDatumTijd, plusDagen, tijd, tijdvak, zelfdeDag } from '../lib/datum';
import '../components/huiswerk/huiswerk.css';
import '../components/instellingen/instellingen.css';
import '../components/les/les.css';
import '../components/afwezigheid/afwezigheid.css';

/** "Donderdag 29 oktober · 10:00 – 11:30", "… t/m …" bij meer hele dagen, of "vanaf …" zonder einde. */
export function wanneer(m: { heleDag: boolean; start: string; einde: string | null }): string {
  const start = new Date(m.start);
  if (!m.einde) return `Vanaf ${dagTitel(start).toLowerCase()}${m.heleDag ? '' : ` ${tijd(start)}`}`;
  const einde = new Date(m.einde);
  if (!m.heleDag) {
    return zelfdeDag(start, einde)
      ? `${dagTitel(start)} · ${tijdvak(m.start, m.einde)}`
      : `${dagTitel(start)} ${tijd(start)} t/m ${dagTitel(einde).toLowerCase()} ${tijd(einde)}`;
  }
  const laatste = plusDagen(einde, -1);
  return !zelfdeDag(laatste, start)
    ? `${dagTitel(start)} t/m ${dagTitel(laatste).toLowerCase()}`
    : dagTitel(start);
}

function MeldingRij({ melding: m }: { melding: Melding }) {
  return (
    <div className="huiswerkrij">
      <div className="huiswerkrij__tekst">
        <span className="huiswerkrij__vak">{m.reden}</span>
        <span className="huiswerkrij__inhoud">{wanneer(m)}</span>
        {m.opmerking && <span className="huiswerkrij__inhoud">{m.opmerking}</span>}
        {m.gemeldOp && <span className="huiswerkrij__inhoud">Gemeld op {korteDatumTijd(m.gemeldOp)}</span>}
      </div>
    </div>
  );
}

/**
 * Tussenpagina: bovenaan de knop om afwezig te melden, daaronder wat er al gemeld is.
 * Mag dit account niet zelf melden (zoals een leerling), dan alleen de meldingen.
 */
export function AfwezigheidMelden() {
  const { state } = useLocation() as { state?: { gelukt?: string } };
  const opties = useLaden(() => api.meldOpties(), []);
  const meldingen = useLaden(() => api.meldingen(), []);
  const lijst = meldingen.data?.data ?? [];
  const vanSchool = opties.data?.meldingenVanSchool ?? true;

  return (
    <div className="pagina pagina--met-terug">
      <TerugLink naar="/afwezigheid" label="Afwezigheid" />
      <PaginaKop titel="Meldingen" />

      {state?.gelukt && (
        <p className="melding melding--gelukt" role="status">
          {state.gelukt}
        </p>
      )}

      {opties.data?.kanMelden && (
        <Link to="/afwezigheid/melden/nieuw" className="knop-primair afwezigheid__knop">
          Afwezigheid melden
          <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      )}

      <Sectie
        titel="Eerder gemeld"
        nawoord={
          <p className="instellingen__let-op">
            {vanSchool
              ? 'Alle meldingen die de school heeft, ook die via de officiële app of website.'
              : 'Je school geeft geen lijst van meldingen terug. Hier staan alleen de meldingen die je via Klas+ op deze telefoon deed.'}
          </p>
        }
      >
        <section className="kaart" aria-busy={meldingen.laden}>
          {meldingen.fout && <p className="melding">{meldingen.fout}</p>}
          {meldingen.data && lijst.length === 0 && <p className="melding">Er is nog niets gemeld.</p>}
          {lijst.map((m) => (
            <MeldingRij key={m.id} melding={m} />
          ))}
        </section>
      </Sectie>
    </div>
  );
}
