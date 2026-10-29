import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useLagen } from '../../lib/laag';
import './ui.css';

/**
 * Terugknop. Kwam je via de app hier, dan ga je echt terug (en blijft bijvoorbeeld de gekozen
 * dag in de agenda staan), met de pagina die naar rechts wegschuift; anders naar `naar`.
 * Van links naar rechts vegen doet hetzelfde (zie AppLayout).
 */
export function TerugLink({ naar, label }: { naar: string; label: string }) {
  const navigate = useNavigate();
  const lagen = useLagen();
  const kanTerug = (window.history.state?.idx ?? 0) > 0;

  return (
    <Link
      to={naar}
      className="terug"
      onClick={(e) => {
        if (!kanTerug) return;
        e.preventDefault();
        if (!lagen?.terug()) navigate(-1);
      }}
    >
      <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </Link>
  );
}
