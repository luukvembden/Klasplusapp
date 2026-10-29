import { Navigate, Route } from 'react-router-dom';
import { Agenda } from './screens/Agenda';
import { Afwezigheid } from './screens/Afwezigheid';
import { AfwezigheidMelden } from './screens/AfwezigheidMelden';
import { NieuweMelding } from './screens/NieuweMelding';
import { Cijfers } from './screens/Cijfers';
import { Gemiddeldes } from './screens/Gemiddeldes';
import { Huiswerk } from './screens/Huiswerk';
import { Instellingen } from './screens/Instellingen';
import { Les } from './screens/Les';
import { LesInhoud } from './screens/LesInhoud';
import { Privacy } from './screens/Privacy';
import { AfspraakBewerken, NieuweAfspraak } from './screens/NieuweAfspraak';

/** De vijf tabbladen. Een tab openen begint een nieuwe stapel pagina's. */
export const TABS = new Set(['/', '/huiswerk', '/cijfers', '/afwezigheid', '/instellingen']);

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
    <Route path="afwezigheid" element={<Afwezigheid />} />
    <Route path="afwezigheid/melden" element={<AfwezigheidMelden />} />
    <Route path="afwezigheid/melden/nieuw" element={<NieuweMelding />} />
    <Route path="instellingen" element={<Instellingen />} />
    <Route path="instellingen/privacy" element={<Privacy />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </>
);
