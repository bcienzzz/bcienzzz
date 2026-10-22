// Carica su Supabase il dataset prodotto dall'importazione.

import { createClient } from "@supabase/supabase-js";
import type { Dataset } from "@/lib/mimit/build";

const BLOCCO = 500;

export async function caricaSuSupabase(dataset: Dataset, url: string, serviceKey: string): Promise<void> {
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const data = dataset.dataEstrazione;

  const distributori = dataset.distributori.map((d) => ({
    id: d.id,
    gestore: d.gestore,
    bandiera: d.bandiera,
    tipo: d.tipo,
    nome: d.nome,
    indirizzo: d.indirizzo,
    comune: d.comune,
    provincia: d.provincia,
    lat: d.lat,
    lon: d.lon,
    coordinate: d.coordinate,
    zone: d.zone,
    attivo: true,
    data_estrazione: data,
  }));
  const prezzi = dataset.distributori.flatMap((d) =>
    d.prezzi.map((p) => ({
      distributore_id: d.id,
      carburante: p.carburante,
      famiglia: p.famiglia,
      base: p.base,
      self: p.self,
      prezzo: p.prezzo,
      comunicato_il: p.comunicatoIl,
      vecchio: p.vecchio,
      sospetto: p.sospetto,
      data_estrazione: data,
    })),
  );

  for (let i = 0; i < distributori.length; i += BLOCCO) {
    const { error } = await db.from("distributori").upsert(distributori.slice(i, i + BLOCCO));
    if (error) throw new Error(`Supabase (distributori): ${error.message}`);
  }
  for (let i = 0; i < prezzi.length; i += BLOCCO) {
    const { error } = await db.from("prezzi").upsert(prezzi.slice(i, i + BLOCCO));
    if (error) throw new Error(`Supabase (prezzi): ${error.message}`);
  }

  // Pulizia: ciò che non compare più nel file MIMIT di oggi.
  const ids = distributori.map((d) => d.id);
  for (let i = 0; i < ids.length; i += BLOCCO) {
    const { error } = await db
      .from("prezzi")
      .delete()
      .in("distributore_id", ids.slice(i, i + BLOCCO))
      .lt("data_estrazione", data);
    if (error) throw new Error(`Supabase (pulizia prezzi): ${error.message}`);
  }
  const { error: errDisattiva } = await db
    .from("distributori")
    .update({ attivo: false })
    .in("provincia", dataset.province)
    .lt("data_estrazione", data);
  if (errDisattiva) throw new Error(`Supabase (distributori non più attivi): ${errDisattiva.message}`);

  const { error: errLog } = await db
    .from("importazioni")
    .insert({ data_estrazione: data, province: dataset.province, report: dataset.report });
  if (errLog) throw new Error(`Supabase (registro importazioni): ${errLog.message}`);
}
