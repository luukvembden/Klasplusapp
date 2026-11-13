import { useState } from 'react';
import { Link } from 'react-router-dom';
import { VakRij } from '../components/cijfers/VakRij';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { TerugLink } from '../components/ui/TerugLink';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useCijfers } from '../hooks/useCijfers';
import { perVak } from '../lib/cijfers';
import { isExamenjaar } from '../lib/examen';
import '../components/ui/ui.css';
import '../components/agenda/agenda.css';
import '../components/cijfers/cijfers.css';
import { LaadRijen } from '../components/ui/Laden';

export function Gemiddeldes() {
  const { cijfers, profiel, resultaat, sub, fout, vernieuw } = useCijfers();
  // In het examenjaar (5 havo, 6 vwo) is er geen overgang maar een eindexamen.
  const examen = isExamenjaar(profiel?.klas);
  const [openVak, setOpenVak] = useState<string | null>(null);

  return (
    <div className="scherm">
      {/* De titel blijft staan; alleen de lijst eronder veeg je omlaag om te vernieuwen, net als bij Cijfers. */}
      <div className="pagina pagina--met-terug gemiddeldes__kop gemiddeldes__kop--met-knop">
        <TerugLink naar="/cijfers" label="Cijfers" />
        {/* Rechtsboven, in dezelfde knop als "Gemiddeldes" bij Cijfers. */}
        <Link
          to={examen ? '/cijfers/examen' : '/cijfers/overgang'}
          className="agendakop__vandaag agendakop__knoplink gemiddeldes__knop"
        >
          {examen ? 'Examen' : 'Overgang'}
        </Link>
        <PaginaKop sub={sub} titel="Gemiddeldes" />
        <OfflineRegel resultaat={resultaat} />
      </div>

      <div className="scherm__lijst">
        <VegenOmTeVernieuwen onVernieuw={vernieuw}>
          <div className="pagina pagina--onder-kop">
            <section className="kaart kaart--vakken" aria-busy={!cijfers}>
              {!cijfers && !fout && <LaadRijen rijen={6} />}
              {fout && <p className="melding">{fout}</p>}
              {cijfers &&
                perVak(cijfers).map((o) => (
                  <VakRij
                    key={o.vak.code}
                    overzicht={o}
                    open={openVak === o.vak.code}
                    onWissel={() => setOpenVak(openVak === o.vak.code ? null : o.vak.code)}
                  />
                ))}
            </section>
          </div>
        </VegenOmTeVernieuwen>
      </div>
    </div>
  );
}
