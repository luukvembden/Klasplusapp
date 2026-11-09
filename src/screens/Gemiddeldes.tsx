import { useState } from 'react';
import { VakRij } from '../components/cijfers/VakRij';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { TerugLink } from '../components/ui/TerugLink';
import { VegenOmTeVernieuwen } from '../components/ui/VegenOmTeVernieuwen';
import { useCijfers } from '../hooks/useCijfers';
import { perVak } from '../lib/cijfers';
import '../components/ui/ui.css';
import '../components/cijfers/cijfers.css';

export function Gemiddeldes() {
  const { cijfers, resultaat, sub, fout, vernieuw } = useCijfers();
  const [openVak, setOpenVak] = useState<string | null>(null);

  return (
    <div className="scherm">
      {/* De titel blijft staan; alleen de lijst eronder veeg je omlaag om te vernieuwen, net als bij Cijfers. */}
      <div className="pagina pagina--met-terug gemiddeldes__kop">
        <TerugLink naar="/cijfers" label="Cijfers" />
        <PaginaKop sub={sub} titel="Gemiddeldes" />
        <OfflineRegel resultaat={resultaat} />
      </div>

      <div className="scherm__lijst">
        <VegenOmTeVernieuwen onVernieuw={vernieuw}>
          <div className="pagina pagina--onder-kop">
            <section className="kaart kaart--vakken" aria-busy={!cijfers}>
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
