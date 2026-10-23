// Importazione giornaliera dei dati MIMIT.
//
// Uso:
//   npm run import                         scarica i file dal MIMIT (serve un IP italiano)
//   npm run import -- --anagrafica a.csv --prezzi p.csv   usa file già scaricati
//   aggiungi --supabase per caricare il risultato sul database
//   aggiungi --snapshot per aggiornare src/data/snapshot.json, la copia dei dati usata
//   dall'app quando Supabase non è configurato
//
// Scrive sempre data/distributori.json (usato anche in locale dall'app) e data/scarti.json.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { DEFAULT_ZONE_ID, IMPORT_PROVINCES } from "@/config/zones";
import { buildDataset, type Dataset } from "@/lib/mimit/build";
import { parseAnagrafica, parsePrezzi } from "@/lib/mimit/parse";
import { caricaSuSupabase } from "./lib/supabase-upload";

const MIMIT_BASE = "https://www.mimit.gov.it/images/exportCSV";
const URL_ANAGRAFICA = `${MIMIT_BASE}/anagrafica_impianti_attivi.csv`;
const URL_PREZZI = `${MIMIT_BASE}/prezzo_alle_8.csv`;
const TIMEOUT_MS = 90_000;

async function leggi(fonte: string): Promise<string> {
  if (!/^https?:\/\//.test(fonte)) return readFile(fonte, "utf8");
  console.log(`Scarico ${fonte} ...`);
  try {
    const res = await fetch(fonte, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`risposta HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    throw new Error(
      `Impossibile scaricare ${fonte}: ${(e as Error).message}.\n` +
        "Il sito del MIMIT risponde solo a connessioni dall'Italia: esegui lo script da un computer/server italiano " +
        "oppure scarica i file a mano e usa --anagrafica e --prezzi.",
    );
  }
}

function stampaReport(ds: Dataset): void {
  const r = ds.report;
  console.log(`\nPrezzi aggiornati al: ${ds.dataEstrazione} (estrazione MIMIT)`);
  console.log(`Province: ${ds.province.join(", ")}`);
  console.log(`Impianti nel file: ${r.impiantiLetti} — nelle province scelte: ${r.impiantiNelleProvince}`);
  console.log(`Righe scartate: anagrafica ${r.righeAnagraficaScartate}, prezzi ${r.righePrezziScartate}`);
  console.log(`Prezzi abbinati: ${r.prezziAbbinati} (vecchi: ${r.prezziVecchi}, sospetti: ${r.prezziSospetti})`);
  console.log(`Distributori senza prezzi: ${r.senzaPrezzi}`);
  console.log("Coordinate:", r.coordinate);
  console.log("Distributori per zona:", r.perZona);

  const zona = ds.distributori.filter((d) => d.zone.includes(DEFAULT_ZONE_ID));
  const comuni = new Map<string, number>();
  for (const d of zona) comuni.set(d.comune, (comuni.get(d.comune) ?? 0) + 1);
  console.log(`\nZona ${DEFAULT_ZONE_ID}, comuni:`, Object.fromEntries([...comuni].sort((a, b) => b[1] - a[1])));

  const dubbi = ds.distributori.filter((d) => d.coordinate !== "ok");
  if (dubbi.length) {
    console.log("\nDistributori con coordinate da controllare:");
    for (const d of dubbi) {
      console.log(`  [${d.coordinate}] ${d.id} ${d.bandiera} — ${d.indirizzo}, ${d.comune} (${d.provincia}) → ${d.lat}, ${d.lon}`);
    }
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      anagrafica: { type: "string", default: URL_ANAGRAFICA },
      prezzi: { type: "string", default: URL_PREZZI },
      out: { type: "string", default: "data" },
      supabase: { type: "boolean", default: false },
      snapshot: { type: "boolean", default: false },
    },
  });

  const [testoAnagrafica, testoPrezzi] = await Promise.all([leggi(values.anagrafica!), leggi(values.prezzi!)]);
  const anagrafica = parseAnagrafica(testoAnagrafica);
  const prezzi = parsePrezzi(testoPrezzi);
  if (anagrafica.dataEstrazione !== prezzi.dataEstrazione) {
    console.warn(`Attenzione: date di estrazione diverse (anagrafica ${anagrafica.dataEstrazione}, prezzi ${prezzi.dataEstrazione}).`);
  }

  const dataset = buildDataset(anagrafica, prezzi, IMPORT_PROVINCES);
  if (dataset.distributori.length === 0) throw new Error("Nessun distributore trovato nelle province scelte: interrompo.");

  await mkdir(values.out!, { recursive: true });
  await writeFile(`${values.out}/distributori.json`, JSON.stringify(dataset));
  await writeFile(
    `${values.out}/scarti.json`,
    JSON.stringify({ anagrafica: anagrafica.scarti, prezzi: prezzi.scarti }, null, 2),
  );
  stampaReport(dataset);
  console.log(`\nScritto ${values.out}/distributori.json`);

  if (values.snapshot) {
    const soloZone = { ...dataset, distributori: dataset.distributori.filter((d) => d.zone.length > 0) };
    await writeFile("src/data/snapshot.json", JSON.stringify(soloZone) + "\n");
    console.log(`Scritto src/data/snapshot.json (${soloZone.distributori.length} distributori nelle zone)`);
  }

  if (values.supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Per --supabase servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
    await caricaSuSupabase(dataset, url, key);
    console.log("Dati caricati su Supabase.");
  }
}

main().catch((e) => {
  console.error(`\nERRORE: ${(e as Error).message}`);
  process.exit(1);
});
