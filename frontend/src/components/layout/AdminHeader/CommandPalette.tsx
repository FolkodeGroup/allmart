//src/components/layout/AdminHeader/CommandPalette.tsx
import { useState, useEffect, useRef } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null); // 2. Crea la referencia

  // Teclado para cerrar el palette con Esc
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [onClose]);

  // Teclado para el input (opcional, por ejemplo navegación ↑↓)
  const handleInputKeyDown = (_e: React.KeyboardEvent<HTMLInputElement>) => {
    // Podés agregar navegación por resultados aquí
  };

  if (!open) return null;

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );
  const products = filtered.filter((item) => item.type === "product");
  const orders = filtered.filter((item) => item.type === "order");
  const users = filtered.filter((item) => item.type === "user");

  return (
    <div
      className="overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="palette"
        role="presentation"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        onKeyDown={() => {}}
      >
        <input
          className="input"
          ref={inputRef}
          placeholder="Buscar productos, pedidos o usuarios..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />

        <div className="results">
          {products.length > 0 && (
            <>
              <div className="groupTitle">Productos</div>
              {products.map((item) => (
                <Link
                  key={`product-${item.id}`}
                  to={`/producto/${item.slug}`}
                  className="result"
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}

          {orders.length > 0 && (
            <>
              <div className="groupTitle">Pedidos</div>
              {orders.map((item) => (
                <Link
                  key={`order-${item.id}`}
                  to={`/admin/pedidos/${item.id}`}
                  className="result"
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}

          {users.length > 0 && (
            <>
              <div className="groupTitle">Usuarios</div>
              {users.map((item) => (
                <Link
                  key={`user-${item.id}`}
                  to={`/admin/users/${item.id}`}
                  className="result"
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
