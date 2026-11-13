import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Forward, Reply } from "lucide-react";
import { api } from "../api";
import { BijlagenLijst } from "../components/meer/BijlagenLijst";
import { TekstMetLinks } from "../components/les/TekstMetLinks";
import { OfflineRegel } from "../components/ui/OfflineRegel";
import { Sectie } from "../components/ui/Sectie";
import { TerugLink } from "../components/ui/TerugLink";
import { VasteKop } from "../components/ui/VasteKop";
import { useLaden } from "../hooks/useLaden";
import { datumEnTijd } from "../lib/datum";
import { antwoordConcept, doorstuurConcept } from "../lib/berichten";
import { verversOngelezen } from "../lib/ongelezen";
import { htmlNaarTekst } from "../lib/tekst";
import "../components/les/les.css";
import "../components/meer/meer.css";

/** Eén bericht: onderwerp, afzender en datum, de tekst, ontvangers en bijlagen. */
export function BerichtScherm() {
  const { id = "" } = useParams();
  const geladen = useLaden(() => api.bericht(id), [id]);
  const b = geladen.data?.data;
  const tekst = b?.inhoudHtml ? htmlNaarTekst(b.inhoudHtml) : "";
  const navigate = useNavigate();
  // Uit Verzonden: dan ben jij de afzender, en is beantwoorden niet zinvol.
  const uitVerzonden = !!(useLocation().state as { verzonden?: boolean } | null)
    ?.verzonden;

  // Openen = gelezen, ook in de officiële app. Eén keer per bericht.
  const gemarkeerd = useRef<string | null>(null);
  useEffect(() => {
    if (!b || b.gelezen || gemarkeerd.current === b.id || geladen.data?.offline)
      return;
    gemarkeerd.current = b.id;
    api
      .markeerGelezen(b.id)
      .then(verversOngelezen)
      .catch(() => {
        // Lukt het niet, dan blijft het bericht ongelezen; geen melding nodig.
      });
  }, [b, geladen.data?.offline]);

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink naar="/meer/berichten" label="Berichten" />
      </VasteKop>
      <OfflineRegel resultaat={geladen.data} />
      {geladen.fout && <p className="melding">{geladen.fout}</p>}

      {b && (
        <>
          <div className="berichtkop">
            <h1 className="berichtkop__onderwerp">{b.onderwerp}</h1>
            <span className="berichtkop__meta">
              <strong>{b.afzender}</strong> · {datumEnTijd(b.verzondenOp)}
            </span>
            {b.ontvangers.length > 0 && (
              <span className="berichtkop__meta">
                Aan: {b.ontvangers.join(", ")}
              </span>
            )}
          </div>

          <section className="kaart lestekst">
            {tekst ? (
              <TekstMetLinks tekst={tekst} />
            ) : (
              "Dit bericht heeft geen tekst."
            )}
          </section>

          {b.bijlagen.length > 0 && (
            <Sectie titel={b.bijlagen.length === 1 ? "Bijlage" : "Bijlagen"}>
              <BijlagenLijst bijlagen={b.bijlagen} />
            </Sectie>
          )}

          <div className="berichtknoppen">
            {!uitVerzonden && (
              <button
                type="button"
                className="knop-primair"
                onClick={() =>
                  navigate("/meer/berichten/nieuw", {
                    state: antwoordConcept(b),
                  })
                }
              >
                <Reply size={19} strokeWidth={2.3} aria-hidden="true" />
                Beantwoorden
              </button>
            )}
            <button
              type="button"
              className="knop-secundair"
              onClick={() =>
                navigate("/meer/berichten/nieuw", {
                  state: doorstuurConcept(b),
                })
              }
            >
              <Forward size={19} strokeWidth={2.3} aria-hidden="true" />
              Doorsturen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
