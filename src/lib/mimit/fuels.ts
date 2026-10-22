// Raggruppa i tanti nomi di carburante del MIMIT ("Blue Diesel", "HiQ Perform+"...)
// nelle 4 famiglie usate dai filtri dell'app.

export const FAMIGLIE = ["benzina", "gasolio", "gpl", "metano"] as const;
export type Famiglia = (typeof FAMIGLIE)[number] | "altro";

export const NOME_FAMIGLIA: Record<Famiglia, string> = {
  benzina: "Benzina",
  gasolio: "Gasolio",
  gpl: "GPL",
  metano: "Metano",
  altro: "Altro",
};

/** Nome MIMIT del carburante "base" di ogni famiglia (quello confrontato nella lista). */
const BASE: Record<string, Famiglia> = {
  Benzina: "benzina",
  Gasolio: "gasolio",
  GPL: "gpl",
  Metano: "metano",
};

/** Intervallo di prezzo plausibile (€/litro, €/kg per il metano). Fuori = prezzo sospetto. */
export const PREZZO_PLAUSIBILE: Record<Famiglia, [number, number]> = {
  benzina: [0.9, 3.5],
  gasolio: [0.9, 3.5],
  gpl: [0.4, 1.6],
  metano: [0.7, 3.5],
  altro: [0.3, 5],
};

export function classificaCarburante(nome: string): { famiglia: Famiglia; base: boolean } {
  if (BASE[nome]) return { famiglia: BASE[nome], base: true };
  const n = nome.toLowerCase();
  if (n === "gpl") return { famiglia: "gpl", base: false };
  // L-GNC = metano liquido erogato come metano per auto. Il GNL è per i camion.
  if (n.includes("metano") || n === "l-gnc") return { famiglia: "metano", base: false };
  if (/gasolio|diesel|hvo/.test(n)) return { famiglia: "gasolio", base: false };
  if (/benzina|super|perform|v-power|verde|ottani/.test(n)) return { famiglia: "benzina", base: false };
  return { famiglia: "altro", base: false };
}
