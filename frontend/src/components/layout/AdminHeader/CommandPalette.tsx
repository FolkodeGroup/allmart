import { useState } from "react";
import { Link } from "react-router-dom";
import "./commandPalette.css";
import type { SearchItem } from "../../../types";

type Props = {
  open: boolean;
  onClose: () => void;
  items: SearchItem[];
};

export function CommandPalette({ open, onClose, items }: Props) {
  const [query, setQuery] = useState("");

  if (!open) return null;

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );
  const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Escape") {
    onClose();
  }
};

  return (
  <div className="overlay" onClick={onClose}
  onKeyDown={handleKeyDown}
  role="button"             // Indica que es interactivo
  tabIndex={0}              // Permite que se seleccione con la tecla Tab
  aria-label="Cerrar paleta de comandos">
    <div
      className="palette"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        className="input"
        placeholder="Buscar productos, pedidos o usuarios..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="results">
        {filtered.map((item) => {
          let url = "";

          switch (item.type) {
            case "product":
              url = `/producto/${item.slug}`;
              break;

            case "order":
              url = `/admin/pedidos/${item.id}`;
              break;

            case "user":
              url = `/admin/users/${item.id}`;
              break;
          }

          return (
            <Link
              key={`${item.type}-${item.id}`}
              to={url}
              className="result"
              onClick={onClose}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  </div>
);
}