import { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { dagEnMaand, dagNaam, datumInZin, naarInvoer, vanInvoer, weekNummer, zelfdeDag } from '../../lib/datum';
import './agenda.css';

interface Props {
  dag: Date;
  onKies: (dag: Date) => void;
  onVandaag: () => void;
}

/**
 * Kop van de Agenda: grote titel met datum en week eronder, rechts de knoppen.
 * Op vandaag heet de titel "Vandaag"; op een andere dag de weekdag, met een knop terug naar vandaag.
 */
export function AgendaKop({ dag, onKies, onVandaag }: Props) {
  const datumVeld = useRef<HTMLInputElement>(null);
  const isVandaag = zelfdeDag(dag, new Date());

  const openKiezer = () => {
    const veld = datumVeld.current;
    if (!veld) return;
    try {
      veld.showPicker();
    } catch {
      veld.focus();
    }
  };

  return (
    <header className="agendakop">
      <div className="agendakop__tekst">
        <h1 className="agendakop__titel">{isVandaag ? 'Vandaag' : dagNaam(dag)}</h1>
        <span className="agendakop__sub">
          {isVandaag ? datumInZin(dag) : dagEnMaand(dag)} · week {weekNummer(dag)}
        </span>
      </div>

      <div className="agendakop__knoppen">
        {!isVandaag && (
          <button type="button" className="agendakop__vandaag" onClick={onVandaag}>
            Vandaag
          </button>
        )}
        {/*
          Het onzichtbare datumveld ligt precies over het icoon. Een iPhone opent een datumkiezer alleen
          als je er zelf op tikt, niet via een script; zo landt de tik direct op het veld.
        */}
        <div className="agendakop__kiezer">
          <span className="agendakop__icoon" aria-hidden="true">
            <Calendar size={22} strokeWidth={2} />
          </span>
          <input
            ref={datumVeld}
            type="date"
            className="agendakop__datumveld"
            aria-label="Kies datum"
            onClick={openKiezer}
            value={naarInvoer(dag)}
            onChange={(e) => {
              const gekozen = vanInvoer(e.target.value);
              if (gekozen) onKies(gekozen);
            }}
          />
        </div>
      </div>
    </header>
  );
}
