// Formattazione di prezzi, date e testi per l'interfaccia (in italiano).

/** 1.789 → "1,789 €" (i prezzi carburante hanno 3 decimali). */
export function euro(prezzo: number): string {
  return `${prezzo.toFixed(3).replace(".", ",")} €`;
}

/** 0.06 → "−6 cent", 0.004 → "−0,4 cent". */
export function differenzaCent(diff: number): string {
  const cent = Math.round(diff * 1000) / 10;
  const segno = cent > 0 ? "+" : cent < 0 ? "−" : "±";
  return `${segno}${Math.abs(cent).toLocaleString("it-IT", { maximumFractionDigits: 1 })} cent`;
}

/** "2026-10-21" → "21 ottobre 2026". */
export function dataLunga(isoData: string): string {
  const [a, m, g] = isoData.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, g)).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Quanto tempo fa, a parole: "25 min fa", "3 ore fa", "ieri", "4 giorni fa". */
export function tempoFa(iso: string, ora: number = Date.now()): string {
  const min = Math.max(0, Math.round((ora - Date.parse(iso)) / 60000));
  if (min < 1) return "adesso";
  if (min < 60) return `${min} min fa`;
  const ore = Math.round(min / 60);
  if (ore < 24) return ore === 1 ? "1 ora fa" : `${ore} ore fa`;
  const giorni = Math.round(ore / 24);
  if (giorni === 1) return "ieri";
  if (giorni < 60) return `${giorni} giorni fa`;
  if (giorni < 730) return `${Math.round(giorni / 30.4)} mesi fa`;
  return `${Math.round(giorni / 365.25)} anni fa`;
}

/** 0.35 → "350 m", 2.46 → "2,5 km". */
export function distanza(km: number): string {
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  return `${km.toLocaleString("it-IT", { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
}

const PAROLE_MINUSCOLE = new Set(["di", "del", "della", "delle", "dei", "degli", "dello", "da", "a", "al", "alla", "e", "in"]);
const SIGLE = new Set(["SS", "SP", "SR", "IP", "Q8", "GPL", "KM", "S.S.", "S.P.", "II", "III", "IV", "SRL", "SPA", "SAS"]);
const PREPOSIZIONE_APOSTROFO = /^(dell|dall|nell|sull|all|d|l)'/;

function maiuscolaIniziale(parola: string): string {
  return parola.replace(/(^|['.\-/(])(\p{L})/gu, (_, prima: string, lettera: string) => prima + lettera.toUpperCase());
}

/** "VIA DELL'EPOMEO 116/B" → "Via dell'Epomeo 116/B". I testi non tutti maiuscoli restano come sono. */
export function titolo(testo: string): string {
  if (testo !== testo.toUpperCase()) return testo;
  return testo
    .toLowerCase()
    .split(" ")
    .map((parola, i) => {
      if (SIGLE.has(parola.toUpperCase())) return parola.toUpperCase();
      if (/^(ss|sp|sr)[.\d]/.test(parola)) return parola.slice(0, 2).toUpperCase() + parola.slice(2);
      if (i === 0) return maiuscolaIniziale(parola);
      if (PAROLE_MINUSCOLE.has(parola)) return parola;
      const prep = PREPOSIZIONE_APOSTROFO.exec(parola);
      if (prep) return prep[0] + maiuscolaIniziale(parola.slice(prep[0].length));
      return maiuscolaIniziale(parola);
    })
    .join(" ");
}

/** Toglie CAP, "SNC" e simili e rende l'indirizzo leggibile. */
export function indirizzo(testo: string): string {
  const pulito = testo
    .replace(/\b\d{5}\b/g, "")
    .replace(/\b(S\.N\.C\.?|S\/N|SNC)(?=\s|,|$)/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/[\s,\-]+$/g, "")
    .trim();
  return titolo(pulito);
}
