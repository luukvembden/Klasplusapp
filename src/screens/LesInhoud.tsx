import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AfgerondSchakelaar } from '../components/les/AfgerondSchakelaar';
import { GegevenRij } from '../components/les/GegevenRij';
import { BijlagenLijst } from '../components/meer/BijlagenLijst';
import { TekstMetLinks } from '../components/les/TekstMetLinks';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { soortVan, useAfspraak } from '../hooks/useAfspraak';
import { dagTitel, datumEnTijd, tijdvak } from '../lib/datum';
import { metHoofdletter } from '../lib/tekst';
import { leerplanVoor } from '../lib/leerplan';
import '../components/les/les.css';
import '../components/agenda/agenda.css';
import '../components/leren/leren.css';

/** Bij deze soorten kun je leren plannen. */
const TOETSEN = ['proefwerk', 'tentamen', 'so', 'mondeling'] as const;

const terugNaar = {
  les: (id: string) => ({ naar: `/agenda/${encodeURIComponent(id)}`, label: 'Les' }),
  huiswerk: () => ({ naar: '/huiswerk', label: 'Huiswerk' }),
};

/** De volledige tekst die de docent typte, met wanneer die is gemaakt en voor het laatst aangepast. */
export function LesInhoud({ van }: { van: keyof typeof terugNaar }) {
  const { id = '' } = useParams();
  const { afspraak: a, tekst, fout, data } = useAfspraak(id);
  const terug = terugNaar[van](id);
  const [gewijzigd, setGewijzigd] = useState<boolean | null>(null);
  const afgerond = gewijzigd ?? a?.afgerond ?? false;

  const isToets = !!a && TOETSEN.some((l) => a.labels.includes(l)) && new Date(a.start).getTime() > Date.now();

  return (
    <div className="pagina pagina--met-terug lesinhoud--met-knop">
      <TerugLink naar={terug.naar} label={terug.label} />
      {isToets && (
        <Link
          to={`/leren/${encodeURIComponent(a.id)}`}
          className="agendakop__vandaag agendakop__knoplink lesinhoud__knop"
        >
          {leerplanVoor(a.id) ? 'Leerplan' : 'Plan leren'}
        </Link>
      )}
      <PaginaKop
        sub={a ? `${metHoofdletter(a.vak ?? a.omschrijving)} · ${dagTitel(new Date(a.start))}` : ' '}
        titel={a ? soortVan(a) : ' '}
      />
      <OfflineRegel resultaat={data} />
      {fout && <p className="melding">{fout}</p>}

      {a && (
        <section className="kaart lestekst">
          {tekst ? <TekstMetLinks tekst={tekst} /> : 'De docent heeft hier niets bij gezet.'}
        </section>
      )}

      {/* Afgerond altijd direct onder de tekst; bijlagen daaronder. */}
      {a && <AfgerondSchakelaar id={a.id} afgerond={afgerond} onWijzig={setGewijzigd} />}

      {a && a.bijlagen.length > 0 && (
        <Sectie titel={a.bijlagen.length === 1 ? 'Bijlage' : 'Bijlagen'}>
          <BijlagenLijst bijlagen={a.bijlagen} />
        </Sectie>
      )}

      {a && (
        <Sectie titel="Details">
          <section className="kaart">
            <GegevenRij label="Aangemaakt" waarde={a.aangemaaktOp ? datumEnTijd(a.aangemaaktOp) : 'Onbekend'} />
            <GegevenRij label="Laatst gewijzigd" waarde={a.gewijzigdOp ? datumEnTijd(a.gewijzigdOp) : 'Onbekend'} />
            <GegevenRij label={a.docenten.length > 1 ? 'Docenten' : 'Docent'} waarde={a.docenten.join(', ')} />
            <GegevenRij label="Les" waarde={`${a.lesuur ? `${a.lesuur}e uur · ` : ''}${tijdvak(a.start, a.einde)}`} />
          </section>
        </Sectie>
      )}
    </div>
  );
}
