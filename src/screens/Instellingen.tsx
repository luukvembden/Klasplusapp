import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { version } from '../../package.json';
import { api } from '../api';
import { AgendaWeergaveKiezer, KleurKiezer, ThemaKiezer } from '../components/instellingen/ThemaKiezer';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { vergeetGeladen } from '../hooks/useLaden';
import { wisEigenAfspraken } from '../lib/eigenAfspraken';
import { herstelInstellingen } from '../lib/instellingen';
import { zetOngelezen } from '../lib/ongelezen';
import { wisAlles } from '../lib/opslag';
import { openExtern } from '../lib/tekst';
import '../components/instellingen/instellingen.css';

/** De broncode van Klas+. */
const GITHUB = 'https://github.com/luukvembden/Klasplusapp';

/** Instellingen, onder Meer. Je naam en het kiezen van een kind staan bovenaan bij Meer. */
export function Instellingen() {
  const navigate = useNavigate();

  const uitloggen = async () => {
    await api.uitloggen();
    // Zoals de privacyverklaring belooft: alles van dit toestel weg, ook de voorkeuren.
    wisEigenAfspraken();
    wisAlles();
    vergeetGeladen();
    herstelInstellingen();
    zetOngelezen(0);
    navigate('/inloggen', { replace: true });
  };

  return (
    <div className="pagina pagina--met-terug pagina--instellingen">
      <TerugLink naar="/meer" label="Meer" />
      <PaginaKop titel="Instellingen" />

      <Sectie titel="Weergave">
        <ThemaKiezer />
      </Sectie>

      <Sectie titel="Kleur">
        <KleurKiezer />
      </Sectie>

      <Sectie titel="Agenda">
        <AgendaWeergaveKiezer />
      </Sectie>

      <Sectie
        titel="Over"
        nawoord={
          <p className="instellingen__let-op">
            Onofficiële app, niet verbonden aan je schoolsysteem of de leverancier ervan. Je gegevens blijven alleen
            op je telefoon.
          </p>
        }
      >
        <section className="kaart">
          <Link to="/instellingen/privacy" className="instelrij">
            Privacyverklaring
            <ChevronRight size={18} strokeWidth={2} color="var(--tekst-secundair)" aria-hidden="true" />
          </Link>
          <button type="button" className="instelrij" onClick={() => openExtern(GITHUB)}>
            Broncode op GitHub
            <ExternalLink size={17} strokeWidth={2} color="var(--tekst-secundair)" aria-hidden="true" />
          </button>
          <div className="instelrij instelrij--vast">
            Versie
            <span className="instelrij__waarde">{version}</span>
          </div>
        </section>
      </Sectie>

      <button type="button" className="uitloggen" onClick={uitloggen}>
        Uitloggen
      </button>

      <p className="instellingen__copyright">© 2026 Klas+</p>
    </div>
  );
}
