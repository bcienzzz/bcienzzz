// Configurazione delle zone coperte dall'app.
// Per estendere l'app a una nuova area basta aggiungere la provincia a
// IMPORT_PROVINCES e, se serve, una nuova zona a ZONES.

/** Sigle delle province importate dai file MIMIT. */
export const IMPORT_PROVINCES = ["NA", "CE"] as const;

/** Rettangolo geografico (gradi decimali). */
export type BBox = { minLat: number; maxLat: number; minLon: number; maxLon: number };

/**
 * Riquadro largo che contiene la provincia. Serve solo a scartare coordinate
 * palesemente sbagliate (es. un distributore di Pozzuoli posizionato a Milano).
 */
export const PROVINCE_BBOX: Record<string, BBox> = {
  NA: { minLat: 40.5, maxLat: 41.05, minLon: 13.8, maxLon: 14.75 },
  CE: { minLat: 40.9, maxLat: 41.55, minLon: 13.7, maxLon: 14.6 },
};

export type Zone = {
  id: string;
  nome: string;
  /** Centro della mappa all'apertura. */
  centro: { lat: number; lon: number };
  zoom: number;
  /**
   * Contorno della zona: elenco di punti [lat, lon] in ordine.
   * Un distributore fa parte della zona se le sue coordinate cadono qui dentro.
   */
  contorno: [number, number][];
  /**
   * Usati solo quando le coordinate non sono affidabili: il distributore entra nella zona
   * se il comune è in `comuni` oppure se l'indirizzo contiene uno dei `cap`.
   */
  comuni: string[];
  cap: string[];
};

export const ZONES: Zone[] = [
  {
    // Pozzuoli, Bacoli, Monte di Procida, Quarto, Licola, Villaggio Coppola,
    // Bagnoli, Fuorigrotta e dintorni.
    id: "campi-flegrei",
    nome: "Campi Flegrei",
    centro: { lat: 40.835, lon: 14.11 },
    zoom: 12,
    contorno: [
      [41.01, 13.93], // mare davanti a Villaggio Coppola
      [41.01, 14.02], // Villaggio Coppola / Pinetamare (lato interno)
      [40.93, 14.07], // Lago Patria, Licola
      [40.9, 14.12], // Varcaturo, Quarto nord
      [40.89, 14.19], // Quarto est, Pianura
      [40.85, 14.215], // Fuorigrotta nord
      [40.77, 14.215], // mare davanti a Posillipo
      [40.77, 13.93], // mare davanti a Capo Miseno
    ],
    comuni: ["POZZUOLI", "BACOLI", "MONTE DI PROCIDA", "QUARTO"],
    // CAP di Napoli: Posillipo, Bagnoli, Fuorigrotta, Pianura/Soccavo. Non mettiamo CAP
    // condivisi con comuni fuori zona (es. 80014 Giugliano, 80070 anche Ischia).
    cap: ["80123", "80124", "80125", "80126"],
  },
];

export const DEFAULT_ZONE_ID = "campi-flegrei";
