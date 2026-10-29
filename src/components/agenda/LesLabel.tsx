import { Check } from 'lucide-react';
import type { Label } from '../../api';
import './agenda.css';

const teksten: Record<Label, string> = {
  huiswerk: 'Huiswerk',
  proefwerk: 'Proefwerk',
  tentamen: 'Tentamen',
  so: 'SO',
  mondeling: 'Mondeling',
  informatie: 'Info',
  ingeschreven: 'Ingeschreven',
  eigen: 'Persoonlijk',
  kwt: 'KWT',
  vervalt: 'Vervallen',
};

/** Huiswerk is grijs zolang het open staat en wordt groen (met vinkje) als je het hebt afgerond. */
export function LesLabel({ label, afgerond = false }: { label: Label; afgerond?: boolean }) {
  const klaar = label === 'huiswerk' && afgerond;
  return (
    <span className={`leslabel leslabel--${label}${klaar ? ' leslabel--afgerond' : ''}`}>
      {klaar && <Check size={12} strokeWidth={3} aria-hidden="true" />}
      {teksten[label]}
      {klaar && <span className="visueel-verborgen">, afgerond</span>}
    </span>
  );
}
