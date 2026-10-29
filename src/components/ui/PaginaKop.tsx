import './ui.css';

export function PaginaKop({ titel, sub }: { titel: string; sub?: string }) {
  return (
    <div className="paginakop">
      {sub && <span className="paginakop__sub">{sub}</span>}
      <h1 className="paginakop__titel">{titel}</h1>
    </div>
  );
}
