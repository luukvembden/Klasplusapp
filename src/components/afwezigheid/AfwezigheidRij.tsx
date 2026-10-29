import type { Afwezigheid } from '../../api';
import { dagTitel } from '../../lib/datum';
import '../huiswerk/huiswerk.css';
import '../agenda/agenda.css';

/**
 * Eén afwezigheid: vak, en daaronder dag en lesuur. Rechts de reden, groen als hij geoorloofd is
 * en rood als hij dat niet is. Alleen om te bekijken; er valt niets aan te tikken.
 */
export function AfwezigheidRij({ afwezigheid: a }: { afwezigheid: Afwezigheid }) {
  const wanneer = [dagTitel(new Date(a.start)), a.lesuur ? `${a.lesuur}e uur` : null].filter(Boolean).join(' · ');

  return (
    <div className="huiswerkrij">
      <div className="huiswerkrij__tekst">
        <span className="huiswerkrij__vak">{a.vak}</span>
        <span className="huiswerkrij__inhoud">{wanneer}</span>
      </div>
      <div className="huiswerkrij__rechts">
        <span className={`leslabel ${a.geoorloofd ? 'leslabel--geoorloofd' : 'leslabel--ongeoorloofd'}`}>
          {a.reden}
          <span className="visueel-verborgen">{a.geoorloofd ? ', geoorloofd' : ', niet geoorloofd'}</span>
        </span>
      </div>
    </div>
  );
}
