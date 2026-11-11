import { Navigate, Route } from 'react-router-dom';
import { Agenda } from './screens/Agenda';
import { Afwezigheid } from './screens/Afwezigheid';
import { AfwezigheidMelden } from './screens/AfwezigheidMelden';
import { NieuweMelding } from './screens/NieuweMelding';
import { Cijfers } from './screens/Cijfers';
import { Gemiddeldes } from './screens/Gemiddeldes';
import { CijferCalculator } from './screens/CijferCalculator';
import { Overgang } from './screens/Overgang';
import { Huiswerk } from './screens/Huiswerk';
import { Instellingen } from './screens/Instellingen';
import { Meer } from './screens/Meer';
import { Berichten } from './screens/Berichten';
import { BerichtScherm } from './screens/BerichtScherm';
import { NieuwBericht } from './screens/NieuwBericht';
import { Opdrachten } from './screens/Opdrachten';
import { OpdrachtScherm } from './screens/OpdrachtScherm';
import { AgendaExport } from './screens/AgendaExport';
import { Activiteiten } from './screens/Activiteiten';
import { ActiviteitScherm } from './screens/ActiviteitScherm';
import { Les } from './screens/Les';
import { LesInhoud } from './screens/LesInhoud';
import { Privacy } from './screens/Privacy';
import { AfspraakBewerken, NieuweAfspraak } from './screens/NieuweAfspraak';

/** De vier tabbladen. Een tab openen begint een nieuwe stapel pagina's. */
export const TABS = new Set(['/', '/huiswerk', '/cijfers', '/meer']);

/** Alle schermen binnen de app (met tabbalk). AppLayout toont ze in lagen, zodat terugvegen de vorige laat zien. */
export const paginaRoutes = (
  <>
    <Route index element={<Agenda />} />
    <Route path="agenda/nieuw" element={<NieuweAfspraak />} />
    <Route path="agenda/:id" element={<Les />} />
    <Route path="agenda/:id/bewerken" element={<AfspraakBewerken />} />
    <Route path="agenda/:id/inhoud" element={<LesInhoud van="les" />} />
    <Route path="huiswerk" element={<Huiswerk />} />
    <Route path="huiswerk/:id" element={<LesInhoud van="huiswerk" />} />
    <Route path="cijfers" element={<Cijfers />} />
    <Route path="cijfers/gemiddeldes" element={<Gemiddeldes />} />
    <Route path="cijfers/calculator" element={<CijferCalculator />} />
    <Route path="cijfers/overgang" element={<Overgang />} />
        <Route path="meer" element={<Meer />} />
    <Route path="meer/berichten" element={<Berichten />} />
    <Route path="meer/berichten/nieuw" element={<NieuwBericht />} />
    <Route path="meer/berichten/:id" element={<BerichtScherm />} />
    <Route path="meer/opdrachten" element={<Opdrachten />} />
    <Route path="meer/opdrachten/:id" element={<OpdrachtScherm />} />
    <Route path="meer/rooster-exporteren" element={<AgendaExport />} />
    <Route path="meer/activiteiten" element={<Activiteiten />} />
    <Route path="meer/activiteiten/:id" element={<ActiviteitScherm />} />
    <Route path="meer/afwezigheid" element={<Afwezigheid />} />
    <Route path="meer/afwezigheid/melden" element={<AfwezigheidMelden />} />
    <Route path="meer/afwezigheid/melden/nieuw" element={<NieuweMelding />} />
    <Route path="meer/privacy" element={<Privacy van="meer" />} />
    <Route path="instellingen" element={<Instellingen />} />
    <Route path="instellingen/privacy" element={<Privacy />} />
    {/* Oude adressen (van voor Afwezigheid onder Meer kwam). */}
    <Route path="afwezigheid/*" element={<Navigate to="/meer/afwezigheid" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </>
);
