// Tipi e calcoli usati dall'interfaccia (lato browser).

import type { Famiglia } from "@/lib/mimit/fuels";
import { distanzaKm, mediana } from "@/lib/geo";
import { indirizzo, titolo } from "@/lib/format";

export type PrezzoUI = {
  carburante: string;
  famiglia: Famiglia;
  base: boolean;
  self: boolean;
  prezzo: number;
  comunicatoIl: string;
  vecchio: boolean;
  sospetto: boolean;
};

export type DistributoreUI = {
  id: number;
  /** Marchio, o nome dell'impianto per le pompe bianche. */
  titolo: string;
  bandiera: string;
  indirizzo: string;
  comune: string;
  lat: number | null;
  lon: number | null;
  /** false se le coordinate non sono affidabili: niente mappa, avviso in lista. */
  posizioneVerificata: boolean;
  prezzi: PrezzoUI[];
};

export type DatiZona = {
  zona: { id: string; nome: string; centro: { lat: number; lon: number }; zoom: number };
  dataEstrazione: string;
  /** "supabase" o "copia locale": utile per capire da dove arrivano i dati. */
  fonte: string;
  distributori: DistributoreUI[];
};

type DistributoreGrezzo = {
  id: number;
  bandiera: string;
  nome: string;
  indirizzo: string;
  comune: string;
  lat: number | null;
  lon: number | null;
  coordinate: string;
  prezzi: PrezzoUI[];
};

export function perInterfaccia(d: DistributoreGrezzo): DistributoreUI {
  const pompaBianca = d.bandiera === "Pompe Bianche" || d.bandiera === "";
  const posizioneVerificata = (d.coordinate === "ok" || d.coordinate === "invertite") && d.lat !== null && d.lon !== null;
  return {
    id: d.id,
    titolo: pompaBianca ? titolo(d.nome) || "Pompa bianca" : d.bandiera,
    bandiera: pompaBianca ? "Pompa bianca" : d.bandiera,
    indirizzo: indirizzo(d.indirizzo),
    comune: titolo(d.comune),
    lat: posizioneVerificata ? d.lat : null,
    lon: posizioneVerificata ? d.lon : null,
    posizioneVerificata,
    prezzi: d.prezzi,
  };
}

/** Il prezzo da mostrare per carburante e modalità scelti (solo carburante "base"). */
export function prezzoScelto(d: DistributoreUI, famiglia: Famiglia, self: boolean): PrezzoUI | undefined {
  return d.prezzi.find((p) => p.famiglia === famiglia && p.base && p.self === self);
}

/** Prezzo utile per confronti e medie: esclude prezzi vecchi o sospetti. */
export function affidabile(p: PrezzoUI | undefined): p is PrezzoUI {
  return !!p && !p.vecchio && !p.sospetto;
}

export type Riga = {
  d: DistributoreUI;
  prezzo: PrezzoUI;
  /** km dalla posizione dell'utente, se nota. */
  km: number | null;
};

export type Ordine = "prezzo" | "distanza";

/** Distributori che hanno il carburante scelto, ordinati. I prezzi non affidabili vanno in fondo. */
export function righe(
  distributori: DistributoreUI[],
  famiglia: Famiglia,
  self: boolean,
  ordine: Ordine,
  posizione: { lat: number; lon: number } | null,
): Riga[] {
  const out: Riga[] = [];
  for (const d of distributori) {
    const prezzo = prezzoScelto(d, famiglia, self);
    if (!prezzo) continue;
    const km = posizione && d.lat !== null && d.lon !== null ? distanzaKm(posizione.lat, posizione.lon, d.lat, d.lon) : null;
    out.push({ d, prezzo, km });
  }
  return out.sort((a, b) => {
    const fa = affidabile(a.prezzo) ? 0 : 1;
    const fb = affidabile(b.prezzo) ? 0 : 1;
    if (fa !== fb) return fa - fb;
    if (ordine === "distanza") {
      if (a.km === null && b.km !== null) return 1;
      if (b.km === null && a.km !== null) return -1;
      if (a.km !== null && b.km !== null && a.km !== b.km) return a.km - b.km;
    }
    return a.prezzo.prezzo - b.prezzo.prezzo;
  });
}

/** Media (mediana, più robusta) dei prezzi affidabili della zona. */
export function mediaZona(r: Riga[]): number | null {
  const prezzi = r.filter((x) => affidabile(x.prezzo)).map((x) => x.prezzo.prezzo);
  return prezzi.length ? mediana(prezzi) : null;
}

/** Differenza minima dalla media perché un prezzo sia "conveniente" (2 centesimi). */
const SCARTO_MINIMO = 0.02;

/**
 * Soglia sotto cui un prezzo è "conveniente": deve stare nel 20% più economico
 * della zona ed essere almeno 2 centesimi sotto la media.
 */
export function sogliaConvenienti(r: Riga[]): number | null {
  const prezzi = r
    .filter((x) => affidabile(x.prezzo))
    .map((x) => x.prezzo.prezzo)
    .sort((a, b) => a - b);
  if (prezzi.length < 5) return null;
  const primoVentesimo = prezzi[Math.max(0, Math.floor(prezzi.length * 0.2) - 1)];
  return Math.min(primoVentesimo, mediana(prezzi) - SCARTO_MINIMO);
}
