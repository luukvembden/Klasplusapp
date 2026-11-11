import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Label } from '../api';
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

const TOETSEN: Label[] = ['proefwerk', 'tentamen', 'so', 'mondeling'];

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

  // Bij een toets plan je leren, bij huiswerk plan je wanneer je het maakt. Alleen als het nog moet komen.
  const komt = !!a && new Date(a.start).getTime() > Date.now();
  const isToets = komt && TOETSEN.some((l) => a!.labels.includes(l));
  const isHuiswerk = komt && !isToets && a!.labels.includes('huiswerk');

  return (
    <div className="pagina pagina--met-terug lesinhoud--met-knop">
      <TerugLink naar={terug.naar} label={terug.label} />
      {(isToets || isHuiswerk) && a && (
        <Link
          to={`/leren/${encodeURIComponent(a.id)}`}
          className="agendakop__vandaag agendakop__knoplink lesinhoud__knop"
        >
          {isToets ? (leerplanVoor(a.id) ? 'Leerplan' : 'Plan leren') : leerplanVoor(a.id) ? 'Planning' : 'Inplannen'}
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
