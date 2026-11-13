import { PaginaKop } from '../components/ui/PaginaKop';
import { TerugLink } from '../components/ui/TerugLink';
import { VasteKop } from '../components/ui/VasteKop';
import '../components/instellingen/instellingen.css';

/** Privacy is te openen vanuit Meer en vanuit Instellingen; de terugknop gaat naar waar je vandaan kwam. */
export function Privacy({ van = 'instellingen' }: { van?: 'meer' | 'instellingen' }) {
  return (
    <div className="pagina pagina--met-terug">
      <VasteKop>
        {van === 'meer' ? <TerugLink naar="/meer" label="Meer" /> : <TerugLink naar="/instellingen" label="Instellingen" />}
        <PaginaKop titel="Privacy" />
      </VasteKop>

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
          zoals de school dat voor ouders toestaat. Heb je meer kinderen, dan wissel je bovenaan bij Meer.
          Persoonlijke afspraken van je kind blijven verborgen, en alleen je kind zelf kan huiswerk afvinken. Je ziet
          wel of het huiswerk is afgerond. Staat de school het toe, dan kun je je kind ook afwezig melden; die melding
          gaat rechtstreeks naar school.
        </p>

        <h2>Berichten, opdrachten en activiteiten</h2>
        <p>
          Onder Meer kun je je berichten en opdrachten van school lezen. Als je een bericht opent, wordt het ook bij
          school als gelezen gemarkeerd, net als in de officiële app. Een bericht dat je verstuurt, en een in- of
          uitschrijving voor een activiteit, gaat rechtstreeks naar het schoolsysteem. Een bijlage opent buiten de
          app, in de browser of viewer van je telefoon. Opdrachten inleveren kan niet in Klas+.
        </p>

        <h2>Meldingen</h2>
        <p>
          Zet je meldingen aan, dan kijkt Klas+ zelf of er een nieuw cijfer is of een uur vervalt of wijzigt, en plant
          het huiswerkherinneringen in. Dat gebeurt op je telefoon, als je de app opent en af en toe op de achtergrond.
          Er is geen server die meekijkt of berichten stuurt; de meldingen komen van je eigen telefoon.
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
