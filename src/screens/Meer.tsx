import { Link } from 'react-router-dom';
import { CalendarArrowDown, CalendarX, Library, PartyPopper, ChevronRight, ClipboardList, Mail, Settings, type LucideIcon } from 'lucide-react';
import { api } from '../api';
import { ProfielKaart } from '../components/instellingen/ProfielKaart';
import { PaginaKop } from '../components/ui/PaginaKop';
import { useLaden, vergeetGeladen } from '../hooks/useLaden';
import { useInstellingen } from '../lib/instellingen';
import { useOngelezen } from '../lib/ongelezen';
import { vakantieRegel } from '../lib/vakanties';
import '../components/instellingen/instellingen.css';

/** Eén regel in Meer: icoontje in een gevuld vakje, naam, eventueel een rood getal, pijltje. */
function MeerRij({ naar, icoon: Icoon, naam, teller }: { naar: string; icoon: LucideIcon; naam: string; teller?: number }) {
  return (
    <Link to={naar} className="instelrij meerrij">
      <span className="meerrij__icoon" aria-hidden="true">
        <Icoon size={18} strokeWidth={2.2} />
      </span>
      <span className="meerrij__naam">{naam}</span>
      {!!teller && (
        <span className="teller" aria-label={`${teller} ongelezen`}>
          {teller}
        </span>
      )}
      <ChevronRight size={18} strokeWidth={2} color="var(--tekst-secundair)" aria-hidden="true" />
    </Link>
  );
}

/** Tab Meer: je profiel, en de onderdelen die niet in de tabbalk passen. Instellingen altijd onderaan. */
export function Meer() {
  const profiel = useLaden(() => api.profiel(), []);
  const ongelezen = useOngelezen();
  const { regio } = useInstellingen();
  const vakantie = vakantieRegel(regio);

  return (
    <div className="pagina pagina--instellingen">
      <PaginaKop titel="Meer" />
      <ProfielKaart
        profiel={profiel.data?.data}
        onKiesKind={async (id) => {
          await api.kiesKind(id);
          vergeetGeladen();
          await profiel.vernieuw();
        }}
      />

      <section className="kaart">
        <MeerRij naar="/meer/berichten" icoon={Mail} naam="Berichten" teller={ongelezen} />
        <MeerRij naar="/meer/opdrachten" icoon={ClipboardList} naam="Opdrachten" />
        <MeerRij naar="/meer/activiteiten" icoon={PartyPopper} naam="Activiteiten" />
        <MeerRij naar="/meer/leermiddelen" icoon={Library} naam="Leermiddelen" />
        <MeerRij naar="/meer/afwezigheid" icoon={CalendarX} naam="Afwezigheid" />
        <MeerRij naar="/meer/rooster-exporteren" icoon={CalendarArrowDown} naam="Rooster exporteren" />
      </section>

      <section className="kaart">
        <MeerRij naar="/instellingen" icoon={Settings} naam="Instellingen" />
      </section>

      {/* Een klein extraatje: aftellen naar de volgende schoolvakantie (regio kies je in Instellingen). */}
      {vakantie && <p className="meer__vakantie">{vakantie}</p>}
    </div>
  );
}
