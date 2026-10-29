import { metLinks, openExtern } from '../../lib/tekst';

/** Tekst waarin webadressen aanklikbaar zijn; ze openen buiten de app. */
export function TekstMetLinks({ tekst }: { tekst: string }) {
  return (
    <>
      {metLinks(tekst).map((stuk, i) =>
        stuk.link ? (
          <a
            key={i}
            href={stuk.link}
            onClick={(e) => {
              e.preventDefault();
              openExtern(stuk.link!);
            }}
          >
            {stuk.tekst}
          </a>
        ) : (
          <span key={i}>{stuk.tekst}</span>
        ),
      )}
    </>
  );
}
