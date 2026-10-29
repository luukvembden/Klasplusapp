import { useEffect, useReducer } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { api, SESSIE_VERLOPEN } from '../api';

/** Stuurt naar het inlogscherm zolang er geen sessie is, ook als de sessie onderweg verloopt. */
export function VereistSessie() {
  const [, opnieuw] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    window.addEventListener(SESSIE_VERLOPEN, opnieuw);
    return () => window.removeEventListener(SESSIE_VERLOPEN, opnieuw);
  }, []);

  return api.heeftSessie() ? <Outlet /> : <Navigate to="/inloggen" replace />;
}
