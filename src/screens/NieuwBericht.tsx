import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { api, type Contact } from "../api";
import { Invoerrij } from "../components/les/Invoerrij";
import { PaginaKop } from "../components/ui/PaginaKop";
import { Sectie } from "../components/ui/Sectie";
import { TerugLink } from "../components/ui/TerugLink";
import { VasteKop } from "../components/ui/VasteKop";
import type { Concept } from "../lib/berichten";
import "../components/les/les.css";
import "../components/meer/meer.css";
import "../components/ui/ui.css";

const soortTekst = {
  docent: "Docent",
  leerling: "Leerling",
  anders: "",
} as const;

/** Ontvangers zoeken terwijl je typt; pas na twee letters, en even wachten zodat niet elke toets een verzoek is. */
function useZoekContacten(term: string) {
  const [gevonden, setGevonden] = useState<Contact[]>([]);
  const [bezig, setBezig] = useState(false);
  useEffect(() => {
    if (term.trim().length < 2) {
      setGevonden([]);
      return;
    }
    let geldig = true;
    setBezig(true);
    const wacht = setTimeout(() => {
      api
        .zoekContacten(term)
        .then((lijst) => geldig && setGevonden(lijst))
        .catch(() => geldig && setGevonden([]))
        .finally(() => geldig && setBezig(false));
    }, 300);
    return () => {
      geldig = false;
      clearTimeout(wacht);
    };
  }, [term]);
  return { gevonden, bezig };
}

/**
 * Nieuw bericht: ontvangers zoeken, onderwerp en tekst, versturen. Daarna terug.
 * Bij beantwoorden of doorsturen staan ontvanger, onderwerp en het oude bericht er al in.
 */
export function NieuwBericht() {
  const navigate = useNavigate();
  const concept = useLocation().state as Concept | null;
  const [aan, setAan] = useState<Contact[]>(concept?.aan ?? []);
  const [zoek, setZoek] = useState(concept?.zoek ?? "");
  const [onderwerp, setOnderwerp] = useState(concept?.onderwerp ?? "");
  const [tekst, setTekst] = useState(concept?.tekst ?? "");
  const tekstVeld = useRef<HTMLTextAreaElement>(null);

  // Antwoorden: meteen typen bovenaan, boven het oude bericht. Doorsturen: eerst een ontvanger kiezen.
  useEffect(() => {
    if (concept?.soort !== "antwoord" || !concept.aan.length) return;
    const veld = tekstVeld.current;
    if (!veld) return;
    veld.focus();
    veld.setSelectionRange(0, 0);
    veld.scrollTop = 0;
  }, [concept]);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);
  const { gevonden, bezig: zoekt } = useZoekContacten(zoek);
  const keuzes = gevonden.filter((c) => !aan.some((a) => a.id === c.id));

  const kies = (c: Contact) => {
    setAan([...aan, c]);
    setZoek("");
  };

  const versturen = async () => {
    if (aan.length === 0) return setFout("Kies minstens één ontvanger.");
    if (!onderwerp.trim()) return setFout("Geef het bericht een onderwerp.");
    if (!tekst.trim()) return setFout("Schrijf eerst iets in het bericht.");
    setBezig(true);
    setFout(null);
    try {
      await api.verstuurBericht({ aan, onderwerp, tekst });
      navigate(-1);
    } catch (e) {
      setBezig(false);
      setFout(
        `Versturen lukte niet. ${e instanceof Error ? e.message : ""}`.trim()
      );
    }
  };

  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        <TerugLink
          naar="/meer/berichten"
          label={concept ? "Bericht" : "Berichten"}
        />
        <PaginaKop
          titel={
            concept?.soort === "antwoord"
              ? "Beantwoorden"
              : concept?.soort === "doorsturen"
              ? "Doorsturen"
              : "Nieuw bericht"
          }
        />
      </VasteKop>

      <Sectie titel="Aan">
        <section className="kaart ontvangers">
          {aan.length > 0 && (
            <div className="ontvangers__gekozen">
              {aan.map((c) => (
                <span key={c.id} className="ontvanger">
                  {c.naam}
                  <button
                    type="button"
                    className="ontvanger__weg"
                    aria-label={`${c.naam} weghalen`}
                    onClick={() => setAan(aan.filter((x) => x.id !== c.id))}
                  >
                    <X size={14} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            id="bericht-aan"
            className="ontvangers__zoek"
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            placeholder={
              aan.length
                ? "Nog iemand toevoegen"
                : "Zoek een docent of leerling"
            }
            aria-label="Ontvanger zoeken"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
          />
          {zoek.trim().length >= 2 && (
            <div
              className="ontvangers__lijst"
              role="listbox"
              aria-label="Gevonden"
            >
              {keuzes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="ontvangers__keuze"
                  role="option"
                  onClick={() => kies(c)}
                >
                  <span className="ontvangers__naam">{c.naam}</span>
                  <span className="ontvangers__extra">
                    {[soortTekst[c.soort], c.extra].filter(Boolean).join(" · ")}
                  </span>
                </button>
              ))}
              {!zoekt && keuzes.length === 0 && (
                <p className="ontvangers__leeg">Niemand gevonden.</p>
              )}
              {zoekt && keuzes.length === 0 && (
                <p className="ontvangers__leeg">Zoeken…</p>
              )}
            </div>
          )}
        </section>
      </Sectie>

      <Sectie titel="Bericht">
        <section className="kaart">
          <Invoerrij label="Onderwerp" voor="bericht-onderwerp">
            <input
              id="bericht-onderwerp"
              className="invoerrij__veld"
              value={onderwerp}
              maxLength={200}
              onChange={(e) => setOnderwerp(e.target.value)}
            />
          </Invoerrij>
        </section>
        <section className="kaart">
          <textarea
            ref={tekstVeld}
            id="bericht-tekst"
            className="invoer-beschrijving bericht-tekst"
            placeholder="Typ je bericht"
            aria-label="Bericht"
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
          />
        </section>
      </Sectie>

      {concept?.hadBijlagen && (
        <p className="bericht-noot">
          De bijlagen van het oorspronkelijke bericht gaan niet mee.
        </p>
      )}
      {fout && <p className="melding">{fout}</p>}

      <button
        type="button"
        className="knop-primair"
        onClick={versturen}
        disabled={bezig}
      >
        {bezig ? "Bezig met versturen…" : "Versturen"}
      </button>
    </div>
  );
}
