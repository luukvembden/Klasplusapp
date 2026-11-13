import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CircleAlert, CircleCheck, Settings, TriangleAlert } from 'lucide-react';
import { LaadKaart } from '../components/ui/Laden';
import { OfflineRegel } from '../components/ui/OfflineRegel';
import { PaginaKop } from '../components/ui/PaginaKop';
import { Sectie } from '../components/ui/Sectie';
import { TerugLink } from '../components/ui/TerugLink';
import { VasteKop } from '../components/ui/VasteKop';
import { useCijfers } from '../hooks/useCijfers';
import { formatCijfer, perVak } from '../lib/cijfers';
import { berekenSlagen, isExamenjaar, leesKeuzes } from '../lib/examen';
import '../components/agenda/agenda.css';
import '../components/cijfers/cijfers.css';
import '../components/ui/ui.css';

/**
 * Examencheck: in het examenjaar op de plek van de overgangscheck: per vak je SE en wat je op het centraal
 * examen nodig hebt, en of je met deze cijfers slaagt volgens de slaag-zakregeling.
 */
export function Examencheck() {
  const { cijfers, profiel, resultaat, fout } = useCijfers();
  const uitslag = useMemo(() => (cijfers ? berekenSlagen(perVak(cijfers), leesKeuzes()) : null), [cijfers]);

  // Niet in het examenjaar: dan hoort hier de overgangscheck.
  if (profiel && !isExamenjaar(profiel.klas)) return <Navigate to="/cijfers/overgang" replace />;

  const Icoon = uitslag?.stand === 'goed' ? CircleCheck : uitslag?.stand === 'letop' ? TriangleAlert : CircleAlert;

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar="/cijfers" label="Cijfers" />
        <Link to="/cijfers/examen/vakken" className="agendakop__vandaag gemiddeldes__knop tandwielknop" aria-label="Mijn vakken">
          <Settings size={20} strokeWidth={2.2} aria-hidden="true" />
        </Link>
        <PaginaKop sub="Met je SE-cijfers van nu" titel="Examencheck" />
      </VasteKop>
      <OfflineRegel resultaat={resultaat} />
      {fout && <p className="melding">{fout}</p>}
      {!cijfers && !fout && <LaadKaart rijen={6} />}

      {uitslag && uitslag.vakken.length === 0 && !uitslag.combi && (
        <p className="melding">Nog geen cijfers om mee te rekenen.</p>
      )}

      {uitslag && (uitslag.vakken.length > 0 || uitslag.combi) && (
        <>
          <section
            className={`kaart overgang__uitslag${
              uitslag.stand === 'niet' ? ' overgang__uitslag--niet' : uitslag.stand === 'letop' ? ' overgang__uitslag--letop' : ''
            }`}
            role="status"
          >
            <div className="overgang__kop">
              <Icoon size={24} strokeWidth={2.4} aria-hidden="true" />
              <span>{uitslag.kop}</span>
            </div>
            {uitslag.tekst.length === 1 ? (
              <p className="overgang__tekst">{uitslag.tekst[0]}</p>
            ) : (
              <ul className="overgang__redenen">
                {uitslag.tekst.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </section>

          {uitslag.vakken.length > 0 && (
            <section className="kaart slaag__ce">
              <div className="slaag__ce-rij">
                <span>Gemiddeld nodig op je centraal examens</span>
                <span className="slaag__ce-getal">5,5</span>
              </div>
              {uitslag.minimumGemiddelde !== null && uitslag.minimumGemiddelde < 5.5 && (
                <p className="slaag__ce-uitleg">
                  Haal je overal precies het minimum hieronder, dan kom je gemiddeld op{' '}
                  {formatCijfer(uitslag.minimumGemiddelde)}. Dat is te laag: je hebt de 5,5 nodig.
                </p>
              )}
            </section>
          )}

          <Sectie
            titel="Per vak"
            nawoord={
              <p className="instellingen__let-op">
                CE nodig: wat je minimaal moet halen voor een 6 als eindcijfer. Klas+ rekent met je cijfers van dit
                schooljaar als SE; telt je school ook eerdere SE-cijfers mee, dan wijkt het af. Het examenreglement van
                je school is leidend.
              </p>
            }
          >
            <section className="kaart">
              <div className="slaag__koppen" aria-hidden="true">
                <span>Vak</span>
                <span>SE</span>
                <span>CE nodig</span>
              </div>
              {uitslag.vakken.map((v) => {
                const laag = v.ceNodig === null || v.ceNodig > 5.5;
                return (
                  <div key={v.code} className={`slaag__vak${laag ? ' slaag__vak--laag' : ''}`}>
                    <span className="slaag__naam">{v.naam}</span>
                    <span className="slaag__se">{formatCijfer(v.se)}</span>
                    <span className="slaag__nodig">{v.ceNodig === null ? 'te hoog' : formatCijfer(v.ceNodig)}</span>
                  </div>
                );
              })}
              {uitslag.combi && (
                <div className="slaag__vak">
                  <span className="slaag__naam">
                    Combinatiecijfer
                    <small>{uitslag.combi.delen.join(', ')}</small>
                  </span>
                  <span className="slaag__se">{formatCijfer(uitslag.combi.se)}</span>
                  <span className="slaag__nodig slaag__nodig--klaar">geen CE</span>
                </div>
              )}
            </section>
          </Sectie>
        </>
      )}
    </div>
  );
}
