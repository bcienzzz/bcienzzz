// Unisce anagrafica e prezzi, filtra le province scelte e controlla la qualità
// di coordinate e prezzi. Il risultato è ciò che l'app mostra.

import { PROVINCE_BBOX, ZONES, type Zone } from "@/config/zones";
import { distanzaKm, inBBox, inPoligono, mediana } from "@/lib/geo";
import { classificaCarburante, PREZZO_PLAUSIBILE, type Famiglia } from "./fuels";
import type { Impianto, Parsed, Prezzo } from "./parse";

/**
 * - ok: coordinate plausibili
 * - invertite: latitudine e longitudine erano scambiate, le abbiamo corrette
 * - mancanti: coordinate assenti o pari a zero
 * - fuori_provincia: il punto cade fuori dalla provincia dichiarata
 * - lontane_dal_comune: il punto è molto lontano dagli altri distributori dello stesso comune
 */
export type StatoCoordinate = "ok" | "invertite" | "mancanti" | "fuori_provincia" | "lontane_dal_comune";

/** Coordinate affidabili abbastanza da mostrare il distributore sulla mappa. */
export const COORDINATE_MOSTRABILI: StatoCoordinate[] = ["ok", "invertite"];

export type PrezzoDistributore = {
  carburante: string;
  famiglia: Famiglia;
  base: boolean;
  self: boolean;
  prezzo: number;
  comunicatoIl: string;
  /** Prezzo comunicato più di GIORNI_PREZZO_VECCHIO giorni prima dell'estrazione. */
  vecchio: boolean;
  /** Prezzo fuori dall'intervallo plausibile per quel carburante. */
  sospetto: boolean;
};

export type Distributore = Omit<Impianto, "lat" | "lon"> & {
  lat: number | null;
  lon: number | null;
  coordinate: StatoCoordinate;
  zone: string[];
  prezzi: PrezzoDistributore[];
};

export type Report = {
  impiantiLetti: number;
  impiantiNelleProvince: number;
  righeAnagraficaScartate: number;
  righePrezziScartate: number;
  prezziAbbinati: number;
  coordinate: Record<StatoCoordinate, number>;
  prezziVecchi: number;
  prezziSospetti: number;
  senzaPrezzi: number;
  perZona: Record<string, number>;
};

export type Dataset = {
  dataEstrazione: string;
  province: string[];
  distributori: Distributore[];
  report: Report;
};

export const GIORNI_PREZZO_VECCHIO = 30;

/** Distanza minima (km) dal centro dei distributori del comune oltre cui segnaliamo il punto. */
const SOGLIA_MIN_KM = 8;
/** La soglia cresce per i comuni grandi: N volte la distanza mediana dei loro distributori. */
const FATTORE_SOGLIA = 3;

export function buildDataset(
  anagrafica: Parsed<Impianto>,
  prezzi: Parsed<Prezzo>,
  province: readonly string[],
  zone: Zone[] = ZONES,
): Dataset {
  const set = new Set(province);
  const impianti = anagrafica.righe.filter((r) => set.has(r.provincia));

  const distributori: Distributore[] = impianti.map((imp) => ({
    ...imp,
    ...controllaCoordinateBase(imp),
    zone: [],
    prezzi: [],
  }));

  segnalaLontaniDalComune(distributori);

  for (const d of distributori) {
    if (d.lat !== null && d.lon !== null && COORDINATE_MOSTRABILI.includes(d.coordinate)) {
      d.zone = zone.filter((z) => inPoligono(d.lat!, d.lon!, z.contorno)).map((z) => z.id);
    }
  }

  // Prezzi: se la stessa combinazione compare più volte teniamo la comunicazione più recente.
  const perId = new Map(distributori.map((d) => [d.id, d]));
  const limiteVecchio = Date.parse(`${prezzi.dataEstrazione}T00:00:00Z`) - GIORNI_PREZZO_VECCHIO * 86400000;
  let prezziAbbinati = 0;
  for (const p of prezzi.righe) {
    const d = perId.get(p.idImpianto);
    if (!d) continue;
    const { famiglia, base } = classificaCarburante(p.carburante);
    const [min, max] = PREZZO_PLAUSIBILE[famiglia];
    const nuovo: PrezzoDistributore = {
      carburante: p.carburante,
      famiglia,
      base,
      self: p.self,
      prezzo: p.prezzo,
      comunicatoIl: p.comunicatoIl,
      vecchio: Date.parse(p.comunicatoIl) < limiteVecchio,
      sospetto: p.prezzo < min || p.prezzo > max,
    };
    const i = d.prezzi.findIndex((x) => x.carburante === p.carburante && x.self === p.self);
    if (i === -1) {
      d.prezzi.push(nuovo);
      prezziAbbinati++;
    } else if (Date.parse(nuovo.comunicatoIl) > Date.parse(d.prezzi[i].comunicatoIl)) {
      d.prezzi[i] = nuovo;
    }
  }

  const coordinate: Record<StatoCoordinate, number> = {
    ok: 0,
    invertite: 0,
    mancanti: 0,
    fuori_provincia: 0,
    lontane_dal_comune: 0,
  };
  const perZona: Record<string, number> = Object.fromEntries(zone.map((z) => [z.id, 0]));
  let prezziVecchi = 0;
  let prezziSospetti = 0;
  let senzaPrezzi = 0;
  for (const d of distributori) {
    coordinate[d.coordinate]++;
    for (const z of d.zone) perZona[z]++;
    if (d.prezzi.length === 0) senzaPrezzi++;
    prezziVecchi += d.prezzi.filter((p) => p.vecchio).length;
    prezziSospetti += d.prezzi.filter((p) => p.sospetto).length;
  }

  return {
    dataEstrazione: prezzi.dataEstrazione,
    province: [...province],
    distributori,
    report: {
      impiantiLetti: anagrafica.righe.length,
      impiantiNelleProvince: distributori.length,
      righeAnagraficaScartate: anagrafica.scarti.length,
      righePrezziScartate: prezzi.scarti.length,
      prezziAbbinati,
      coordinate,
      prezziVecchi,
      prezziSospetti,
      senzaPrezzi,
      perZona,
    },
  };
}

function controllaCoordinateBase(imp: Impianto): Pick<Distributore, "lat" | "lon" | "coordinate"> {
  const { lat, lon } = imp;
  if (lat === null || lon === null || lat === 0 || lon === 0) return { lat: null, lon: null, coordinate: "mancanti" };
  const bbox = PROVINCE_BBOX[imp.provincia];
  // Provincia senza riquadro configurato: accettiamo solo coordinate dentro l'Italia.
  if (!bbox) {
    const italia = { minLat: 35.4, maxLat: 47.2, minLon: 6.5, maxLon: 18.6 };
    return inBBox(lat, lon, italia) ? { lat, lon, coordinate: "ok" } : { lat, lon, coordinate: "fuori_provincia" };
  }
  if (inBBox(lat, lon, bbox)) return { lat, lon, coordinate: "ok" };
  if (inBBox(lon, lat, bbox)) return { lat: lon, lon: lat, coordinate: "invertite" };
  return { lat, lon, coordinate: "fuori_provincia" };
}

function segnalaLontaniDalComune(distributori: Distributore[]): void {
  const gruppi = new Map<string, Distributore[]>();
  for (const d of distributori) {
    if (!COORDINATE_MOSTRABILI.includes(d.coordinate)) continue;
    const k = `${d.provincia}|${d.comune}`;
    gruppi.set(k, [...(gruppi.get(k) ?? []), d]);
  }
  for (const gruppo of gruppi.values()) {
    if (gruppo.length < 3) continue; // troppo pochi per capire dov'è "il comune"
    const cLat = mediana(gruppo.map((d) => d.lat!));
    const cLon = mediana(gruppo.map((d) => d.lon!));
    const dist = gruppo.map((d) => distanzaKm(d.lat!, d.lon!, cLat, cLon));
    const soglia = Math.max(SOGLIA_MIN_KM, FATTORE_SOGLIA * mediana(dist));
    gruppo.forEach((d, i) => {
      if (dist[i] > soglia) d.coordinate = "lontane_dal_comune";
    });
  }
}
