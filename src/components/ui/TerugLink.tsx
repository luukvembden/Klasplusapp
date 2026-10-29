import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './ui.css';

/**
 * Terugknop. Kwam je via de app hier, dan ga je echt terug (en blijft bijvoorbeeld de gekozen
 * dag in de agenda staan); anders naar `naar`.
 */
export function TerugLink({ naar, label }: { naar: string; label: string }) {
  const navigate = useNavigate();
  const kanTerug = (window.history.state?.idx ?? 0) > 0;

  return (
    <Link
      to={naar}
      className="terug"
      onClick={(e) => {
        if (!kanTerug) return;
        e.preventDefault();
        navigate(-1);
      }}
    >
      <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </Link>
  );
}
