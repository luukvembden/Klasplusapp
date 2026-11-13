import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useLagen } from '../../lib/laag';
import './ui.css';

/**
 * Terugknop. Gaat altijd naar de pagina die ernaast staat (`naar`, met `label`), niet per se naar waar je
 * vandaan kwam: na een omweg via een tandwiel ga je bij "Cijfers" ook echt naar Cijfers. Ligt die pagina
 * al onder de huidige, dan schuift de bovenste pagina weg en staat hij er nog precies zoals je hem achterliet.
 * `echt`: voor een knop die gewoon "Terug" heet, wel de vorige pagina uit de geschiedenis.
 */
export function TerugLink({ naar, label, echt = false }: { naar: string; label: string; echt?: boolean }) {
  const navigate = useNavigate();
  const lagen = useLagen();
  const kanTerug = (window.history.state?.idx ?? 0) > 0;

  return (
    <Link
      to={naar}
      className="terug"
      onClick={(e) => {
        e.preventDefault();
        if (echt && kanTerug) {
          if (!lagen?.terug()) navigate(-1);
        } else if (lagen) lagen.naar(naar);
        else navigate(naar, { replace: true });
      }}
    >
      <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </Link>
  );
}
