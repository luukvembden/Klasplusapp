import { PaginaKop } from '../components/ui/PaginaKop';
import { TerugLink } from '../components/ui/TerugLink';
import '../components/instellingen/instellingen.css';

export function Privacy() {
  return (
    <div className="pagina pagina--met-terug">
      <TerugLink naar="/instellingen" label="Instellingen" />
      <PaginaKop titel="Privacy" />

      <section className="kaart privacy">
        <h2>Wat is Klas+?</h2>
        <p>
          Een onofficiële app die je rooster en cijfers rustig laat zien. Deze app is onafhankelijk ontwikkeld en is
          niet gemaakt door of verbonden met jouw school of Schoolmaster B.V. (de leverancier van Magister).
        </p>

        <h2>Inloggen</h2>
        <p>
          Je logt in op de officiële en beveiligde inlogpagina van je school. Klas+ ziet en bewaart je wachtwoord
          nooit. De app krijgt na het inloggen alleen een unieke toegangssleutel (token) waarmee de app jouw
          schoolgegevens mag inladen.
        </p>

        <h2>Voor ouders</h2>
        <p>
          Log je in met een ouderaccount, dan zie je het rooster, huiswerk, cijfers en afwezigheid van je kind, net
          zoals de school dat voor ouders toestaat. Heb je meer kinderen, dan wissel je bovenaan bij Instellingen.
          Persoonlijke afspraken van je kind blijven verborgen, en alleen je kind zelf kan huiswerk afvinken. Je ziet
          wel of het huiswerk is afgerond. Staat de school het toe, dan kun je je kind ook afwezig melden; die melding
          gaat rechtstreeks naar school.
        </p>

        <h2>Waar staan je gegevens?</h2>
        <p>
          Uitsluitend op dit toestel. Er is geen server van Klas+; jouw gegevens worden rechtstreeks van je school
          opgehaald en direct lokaal opgeslagen. Er worden absoluut geen gegevens doorgestuurd, verkocht, of gebruikt
          voor reclame of statistieken.
        </p>

        <h2>Uitloggen</h2>
        <p>
          Zodra je uitlogt, worden de toegangssleutel en alle opgeslagen gegevens direct en permanent van dit toestel
          gewist.
        </p>
      </section>
    </div>
  );
}
