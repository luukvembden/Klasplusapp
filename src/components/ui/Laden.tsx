import './ui.css';

/**
 * Wat je ziet zolang er nog niets binnen is: een paar grijze balkjes op de plek waar zo de rijen komen.
 * Overal hetzelfde, zodat laden overal hetzelfde voelt. `LaadRijen` staat binnen een bestaande kaart,
 * `LaadKaart` is zelf een kaart.
 */
export function LaadRijen({ rijen = 4 }: { rijen?: number }) {
  return (
    <div className="laadrijen" role="status" aria-label="Bezig met laden">
      {Array.from({ length: rijen }, (_, i) => (
        <div key={i} className="laadrij" aria-hidden="true">
          <span className="laadbalk laadbalk--breed" style={{ width: `${[62, 48, 70, 55, 66][i % 5]}%` }} />
          <span className="laadbalk laadbalk--smal" style={{ width: `${[38, 52, 30, 44, 35][i % 5]}%` }} />
        </div>
      ))}
    </div>
  );
}

export function LaadKaart({ rijen = 4 }: { rijen?: number }) {
  return (
    <section className="kaart">
      <LaadRijen rijen={rijen} />
    </section>
  );
}
