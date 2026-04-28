// Tipos compartilhados — placeholders. Os tipos definitivos virão do schema
// quando rodarmos a migration (próximo PR).

export type UserRole = "parent" | "school_admin" | "platform_admin";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  cep: string | null;
  city: string;
  state: string;
}

export interface School {
  id: string;
  name: string;
  city: string;
  state: string;
  procon_validated: boolean;
}

export interface ListItem {
  id: string;
  canonical_name: string;
  category: string;
  estimated_price: number | null;
}
