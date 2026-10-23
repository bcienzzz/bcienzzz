// Caricamento dei dati della zona, lato server.
// Se Supabase è configurato legge da lì, altrimenti usa la copia salvata in src/data/.

import "server-only";
import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { ZONES } from "@/config/zones";
import type { Dataset } from "@/lib/mimit/build";
import { perInterfaccia, type DatiZona, type PrezzoUI } from "@/lib/stazioni";
import copiaLocale from "@/data/snapshot.json";

export async function getDatiZona(zonaId: string): Promise<DatiZona> {
  "use cache";
  cacheLife("hours");

  const z = ZONES.find((x) => x.id === zonaId);
  if (!z) throw new Error(`Zona sconosciuta: ${zonaId}`);
  const zona = { id: z.id, nome: z.nome, centro: z.centro, zoom: z.zoom };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) return { zona, ...(await daSupabase(url, key, zonaId)), fonte: "supabase" };

  const ds = copiaLocale as unknown as Dataset;
  return {
    zona,
    dataEstrazione: ds.dataEstrazione,
    fonte: "copia locale",
    distributori: ds.distributori.filter((d) => d.zone.includes(zonaId)).map(perInterfaccia),
  };
}

type RigaPrezzo = {
  carburante: string;
  famiglia: PrezzoUI["famiglia"];
  base: boolean;
  self: boolean;
  prezzo: number;
  comunicato_il: string;
  vecchio: boolean;
  sospetto: boolean;
};

async function daSupabase(url: string, key: string, zonaId: string) {
  const db = createClient(url, key, { auth: { persistSession: false } });
  const [{ data: distributori, error }, { data: ultima, error: errImp }] = await Promise.all([
    db
      .from("distributori")
      .select("id, bandiera, nome, indirizzo, comune, lat, lon, coordinate, prezzi(*)")
      .contains("zone", [zonaId])
      .eq("attivo", true),
    db.from("importazioni").select("data_estrazione").order("eseguita_il", { ascending: false }).limit(1),
  ]);
  if (error) throw new Error(`Supabase: ${error.message}`);
  if (errImp) throw new Error(`Supabase: ${errImp.message}`);

  return {
    dataEstrazione: ultima?.[0]?.data_estrazione ?? "",
    distributori: (distributori ?? []).map((d) =>
      perInterfaccia({
        ...d,
        prezzi: (d.prezzi as RigaPrezzo[]).map((p) => ({
          carburante: p.carburante,
          famiglia: p.famiglia,
          base: p.base,
          self: p.self,
          prezzo: Number(p.prezzo),
          comunicatoIl: p.comunicato_il,
          vecchio: p.vecchio,
          sospetto: p.sospetto,
        })),
      }),
    ),
  };
}
