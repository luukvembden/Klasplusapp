import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { version } from '../../package.json';
import { api } from '../api';
import { MeldingenKiezer } from '../components/instellingen/MeldingenKiezer';
import { AgendaIndelingKiezer, AgendaWeergaveKiezer, KleurKiezer, ThemaKiezer } from '../components/instellingen/ThemaKiezer';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { vergeetGeladen } from '../hooks/useLaden';
import { wisEigenAfspraken } from '../lib/eigenAfspraken';
import { herstelInstellingen } from '../lib/instellingen';
import { kanNotificaties, wisNotificaties } from '../lib/notificaties';
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
    await wisNotificaties();
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
        <AgendaIndelingKiezer />
        <AgendaWeergaveKiezer />
      </Sectie>

      <Sectie
        titel="Meldingen"
        nawoord={
          <p className="instellingen__let-op">
            {kanNotificaties
              ? 'Klas+ kijkt zelf of er iets nieuws is: als je de app opent, en af en toe op de achtergrond. Hoe vaak dat mag, bepaalt je telefoon. Veeg je Klas+ helemaal weg, dan komen er geen meldingen tot je de app weer opent. Huiswerkherinneringen staan wel vast ingepland.'
              : 'Meldingen werken alleen in de app op je telefoon, niet in de demo in de browser.'}
          </p>
        }
      >
        <MeldingenKiezer />
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
