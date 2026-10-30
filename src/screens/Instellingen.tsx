import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { version } from '../../package.json';
import { api } from '../api';
import { ProfielKaart } from '../components/instellingen/ProfielKaart';
import { AgendaWeergaveKiezer, KleurKiezer, ThemaKiezer } from '../components/instellingen/ThemaKiezer';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { useLaden } from '../hooks/useLaden';
import { wisEigenAfspraken } from '../lib/eigenAfspraken';
import { herstelInstellingen } from '../lib/instellingen';
import { wisAlles } from '../lib/opslag';
import '../components/instellingen/instellingen.css';

export function Instellingen() {
  const navigate = useNavigate();
  const profiel = useLaden(() => api.profiel(), []);

  const uitloggen = async () => {
    await api.uitloggen();
    // Zoals de privacyverklaring belooft: alles van dit toestel weg, ook de voorkeuren.
    wisEigenAfspraken();
    wisAlles();
    herstelInstellingen();
    navigate('/inloggen', { replace: true });
  };

  return (
    <div className="pagina pagina--instellingen">
      <PaginaKop titel="Instellingen" />
      <ProfielKaart
        profiel={profiel.data?.data}
        onKiesKind={async (id) => {
          await api.kiesKind(id);
          await profiel.vernieuw();
        }}
      />

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
          <div className="instelrij instelrij--vast">
            Versie
            <span className="instelrij__waarde">{version}</span>
          </div>
        </section>
      </Sectie>

      <button type="button" className="uitloggen" onClick={uitloggen}>
        Uitloggen
      </button>

      <p className="instellingen__copyright">© 2026 Luuk van Embden</p>
    </div>
  );
}
