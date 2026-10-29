import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';

/** Scherm met scrollende inhoud en de vaste tabbalk onderin. */
export function AppLayout() {
  return (
    <div className="app">
      <main className="app__inhoud">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
