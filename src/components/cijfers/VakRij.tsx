import { formatCijfer, isOnvoldoende, toonCijfer, type VakOverzicht } from '../../lib/cijfers';
import './cijfers.css';

const kleur = (n: number | null) => (isOnvoldoende(n) ? ' onvoldoende' : '');

interface Props {
  overzicht: VakOverzicht;
  open: boolean;
  onWissel: () => void;
}

/** Vak met gewogen gemiddelde en losse cijfers; uitklapbaar naar de toetsen met weging. */
export function VakRij({ overzicht, open, onWissel }: Props) {
  const { vak, cijfers, gemiddelde } = overzicht;
  const toetsenId = `toetsen-${vak.code}`;

  return (
    <div className="vakrij">
      <button type="button" className="vakrij__knop" aria-expanded={open} aria-controls={toetsenId} onClick={onWissel}>
        <div className="vakrij__links">
          <span className="vakrij__vak">{vak.naam}</span>
          <div className="vakrij__chips">
            {cijfers.map((c) => (
              <span key={c.id} className={`chip${kleur(c.waarde)}`}>
                {toonCijfer(c)}
              </span>
            ))}
          </div>
        </div>
        <div className="vakrij__rechts">
          <span className={`vakrij__gemiddelde${kleur(gemiddelde)}`}>
            {gemiddelde === null ? '–' : formatCijfer(gemiddelde)}
          </span>
          <span className="cijfer__klein">gemiddeld</span>
        </div>
      </button>

      {open && (
        <div id={toetsenId} className="vakrij__toetsen">
          {cijfers.map((c) => (
            <div key={c.id} className="toetsrij">
              <span>
                {c.omschrijving}{' '}
                <span className="toetsrij__weging">
                  · {c.teltMee ? `weging ${c.weging}` : 'telt niet mee'}
                </span>
              </span>
              <span className={`toetsrij__cijfer${kleur(c.waarde)}`}>{toonCijfer(c)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
