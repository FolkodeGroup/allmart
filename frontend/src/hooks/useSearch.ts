// src/hooks/useSearch.ts

import { useMemo } from "react";
import type { ProductSearch, OrderSearch, UserSearch, SearchItem } from "../types";

export function useSearch(
  products: ProductSearch[],
  orders: OrderSearch[],
  users: UserSearch[]
): SearchItem[] {
  const searchIndex: SearchItem[] = useMemo(() => {
    return [
      ...products.map((p) => ({
        id: p.id,
        label: p.name,
        type: "product" as const,
        slug: p.slug,
      })),

      ...orders.map((o) => ({
        id: o.id,
        label: `Pedido ${o.id}`,
        type: "order" as const,
      })),

      ...users.map((u) => ({
        id: u.id,
        label: `${u.firstName} ${u.lastName}`,
        subtitle: u.email,
        type: "user" as const,
      })),
    ];
  }, [products, orders, users]);

  return searchIndex;
}