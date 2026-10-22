// Lettura dei file open data MIMIT (formato verificato sui file del 21/10/2026).
//
// Struttura di entrambi i file:
//   riga 1: "Estrazione del AAAA-MM-GG"
//   riga 2: intestazione delle colonne, separate da "|"
//   righe successive: dati, separati da "|"
//
// Il file NON è un CSV "standard": le virgolette non racchiudono i campi
// (a volte ce n'è una sola, es. `"IP SERVICES S.R.L.`) e alcuni gestori
// hanno scritto il carattere "|" dentro il nome, rompendo le colonne.

export const ANAGRAFICA_COLUMNS = [
  "idImpianto",
  "Gestore",
  "Bandiera",
  "Tipo Impianto",
  "Nome Impianto",
  "Indirizzo",
  "Comune",
  "Provincia",
  "Latitudine",
  "Longitudine",
] as const;

export const PREZZI_COLUMNS = ["idImpianto", "descCarburante", "prezzo", "isSelf", "dtComu"] as const;

/** Testo spurio che alcuni gestori inseriscono nei campi e che contiene un "|". */
const KNOWN_JUNK = / \| gestori\.prezzibenzina\.it/g;

export class MimitFormatError extends Error {
  constructor(message: string) {
    super(`Formato del file MIMIT non riconosciuto: ${message}`);
    this.name = "MimitFormatError";
  }
}

export type Impianto = {
  id: number;
  gestore: string;
  bandiera: string;
  tipo: string;
  nome: string;
  indirizzo: string;
  comune: string;
  provincia: string;
  lat: number | null;
  lon: number | null;
};

export type Prezzo = {
  idImpianto: number;
  carburante: string;
  prezzo: number;
  self: boolean;
  /** Data e ora (ISO, con fuso) in cui il gestore ha comunicato il prezzo. */
  comunicatoIl: string;
};

export type Scarto = { riga: number; motivo: string; testo: string };

export type Parsed<T> = {
  /** Data di estrazione dichiarata nella prima riga (AAAA-MM-GG). */
  dataEstrazione: string;
  righe: T[];
  scarti: Scarto[];
};

/** Pulisce un campo: tab e spazi multipli diventano uno spazio, via le virgolette ai bordi. */
export function pulisci(campo: string): string {
  return campo
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^"+|"+$/g, "")
    .trim();
}

function splitLines(text: string): string[] {
  return text.replace(/^﻿/, "").split(/\r?\n/);
}

function leggiIntestazione(lines: string[], attese: readonly string[], nomeFile: string): string {
  const m = /^Estrazione del (\d{4}-\d{2}-\d{2})\s*$/.exec(lines[0] ?? "");
  if (!m) throw new MimitFormatError(`${nomeFile}: prima riga inattesa "${(lines[0] ?? "").slice(0, 60)}"`);
  const colonne = (lines[1] ?? "").split("|").map((c) => c.trim());
  if (colonne.join("|") !== attese.join("|")) {
    throw new MimitFormatError(
      `${nomeFile}: colonne inattese.\n  trovate: ${colonne.join(" | ")}\n  attese:  ${attese.join(" | ")}`,
    );
  }
  return m[1];
}

function numero(s: string): number | null {
  if (s === "") return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function parseAnagrafica(text: string): Parsed<Impianto> {
  const lines = splitLines(text);
  const dataEstrazione = leggiIntestazione(lines, ANAGRAFICA_COLUMNS, "anagrafica_impianti_attivi.csv");
  const righe: Impianto[] = [];
  const scarti: Scarto[] = [];

  for (let i = 2; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trim() === "") continue;
    const campi = raw.replace(KNOWN_JUNK, "").split("|");
    if (campi.length !== ANAGRAFICA_COLUMNS.length) {
      scarti.push({ riga: i + 1, motivo: `${campi.length} colonne invece di ${ANAGRAFICA_COLUMNS.length}`, testo: raw });
      continue;
    }
    const [id, gestore, bandiera, tipo, nome, indirizzo, comune, provincia, lat, lon] = campi.map(pulisci);
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      scarti.push({ riga: i + 1, motivo: "idImpianto non valido", testo: raw });
      continue;
    }
    righe.push({
      id: idNum,
      gestore,
      bandiera,
      tipo,
      nome,
      indirizzo,
      comune: comune.toUpperCase(),
      provincia: provincia.toUpperCase(),
      lat: numero(lat),
      lon: numero(lon),
    });
  }
  return { dataEstrazione, righe, scarti };
}

/** Converte "GG/MM/AAAA HH:MM:SS" (ora italiana) in ISO con il fuso corretto. */
export function dataItalianaToISO(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const [, gg, mm, aaaa, hh, mi, ss] = m;
  const comeUTC = Date.UTC(+aaaa, +mm - 1, +gg, +hh, +mi, +ss);
  // Scostamento di Roma da UTC in quel momento (+1 inverno, +2 estate).
  const stima = offsetRomaMinuti(comeUTC);
  const offsetMin = offsetRomaMinuti(comeUTC - stima * 60 * 1000);
  if (Number.isNaN(comeUTC)) return null;
  const segno = offsetMin >= 0 ? "+" : "-";
  const oh = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, "0");
  const om = String(Math.abs(offsetMin) % 60).padStart(2, "0");
  return `${aaaa}-${mm}-${gg}T${hh}:${mi}:${ss}${segno}${oh}:${om}`;
}

function offsetRomaMinuti(utcMs: number): number {
  const parti = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(utcMs));
  const p = Object.fromEntries(parti.map((x) => [x.type, x.value]));
  const localeComeUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return Math.round((localeComeUTC - Math.floor(utcMs / 60000) * 60000) / 60000);
}

export function parsePrezzi(text: string): Parsed<Prezzo> {
  const lines = splitLines(text);
  const dataEstrazione = leggiIntestazione(lines, PREZZI_COLUMNS, "prezzo_alle_8.csv");
  const righe: Prezzo[] = [];
  const scarti: Scarto[] = [];

  for (let i = 2; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.trim() === "") continue;
    const campi = raw.split("|").map(pulisci);
    if (campi.length !== PREZZI_COLUMNS.length) {
      scarti.push({ riga: i + 1, motivo: `${campi.length} colonne invece di ${PREZZI_COLUMNS.length}`, testo: raw });
      continue;
    }
    const [id, carburante, prezzo, isSelf, dtComu] = campi;
    const idNum = Number(id);
    const prezzoNum = numero(prezzo);
    const comunicatoIl = dataItalianaToISO(dtComu);
    if (!Number.isInteger(idNum) || prezzoNum === null || (isSelf !== "0" && isSelf !== "1") || !comunicatoIl || !carburante) {
      scarti.push({ riga: i + 1, motivo: "valori non validi", testo: raw });
      continue;
    }
    righe.push({ idImpianto: idNum, carburante, prezzo: prezzoNum, self: isSelf === "1", comunicatoIl });
  }
  return { dataEstrazione, righe, scarti };
}
