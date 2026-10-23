import { describe, expect, it } from "vitest";
import { mediaZona, perInterfaccia, righe, sogliaConvenienti, type DistributoreUI, type PrezzoUI } from "./stazioni";

const prezzo = (p: number, extra: Partial<PrezzoUI> = {}): PrezzoUI => ({
  carburante: "Benzina",
  famiglia: "benzina",
  base: true,
  self: true,
  prezzo: p,
  comunicatoIl: "2026-10-20T08:00:00+02:00",
  vecchio: false,
  sospetto: false,
  ...extra,
});

const distr = (id: number, lat: number | null, prezzi: PrezzoUI[]): DistributoreUI => ({
  id,
  titolo: `D${id}`,
  bandiera: "Q8",
  indirizzo: "",
  comune: "Pozzuoli",
  lat,
  lon: lat === null ? null : 14.1,
  posizioneVerificata: lat !== null,
  prezzi,
});

const elenco = [
  distr(1, 40.82, [prezzo(1.9)]),
  distr(2, 40.9, [prezzo(1.8)]),
  distr(3, 40.83, [prezzo(1.5, { vecchio: true })]),
  distr(4, null, [prezzo(1.85)]),
  distr(5, 40.84, [prezzo(1.7, { self: false })]),
];

describe("righe", () => {
  it("ordina per prezzo, prezzi non affidabili in fondo, filtra self/servito", () => {
    expect(righe(elenco, "benzina", true, "prezzo", null).map((r) => r.d.id)).toEqual([2, 4, 1, 3]);
    expect(righe(elenco, "benzina", false, "prezzo", null).map((r) => r.d.id)).toEqual([5]);
    expect(righe(elenco, "gasolio", true, "prezzo", null)).toEqual([]);
  });

  it("ordina per distanza, senza posizione in fondo", () => {
    const r = righe(elenco, "benzina", true, "distanza", { lat: 40.82, lon: 14.1 });
    expect(r.map((x) => x.d.id)).toEqual([1, 2, 4, 3]);
    expect(r[0].km).toBeCloseTo(0, 3);
    expect(r[2].km).toBeNull();
  });
});

describe("media e convenienti", () => {
  const molti = [1.8, 1.9, 1.95, 1.99, 1.99, 1.99, 2.0, 2.05, 2.1, 2.2].map((p, i) => distr(i, 40.8, [prezzo(p)]));
  const r = righe(molti, "benzina", true, "prezzo", null);

  it("la media è la mediana dei prezzi affidabili", () => {
    expect(mediaZona(r)).toBeCloseTo(1.99);
  });

  it("conveniente = primo 20% e almeno 2 centesimi sotto la media", () => {
    expect(sogliaConvenienti(r)).toBeCloseTo(1.9);
    const piatti = [1.98, 1.985, 1.99, 1.99, 1.99, 1.99].map((p, i) => distr(i, 40.8, [prezzo(p)]));
    expect(sogliaConvenienti(righe(piatti, "benzina", true, "prezzo", null))).toBeCloseTo(1.97);
  });
});

describe("perInterfaccia", () => {
  it("pompe bianche: usa il nome; coordinate dubbie: niente mappa", () => {
    const d = perInterfaccia({
      id: 9,
      bandiera: "Pompe Bianche",
      nome: "ITALIMPIANTI POZZUOLI",
      indirizzo: "VIA MILISCOLA 165/B 80078",
      comune: "POZZUOLI",
      lat: 40.776,
      lon: 14.48,
      coordinate: "lontane_dal_comune",
      prezzi: [],
    });
    expect(d).toMatchObject({
      titolo: "Italimpianti Pozzuoli",
      bandiera: "Pompa bianca",
      indirizzo: "Via Miliscola 165/B",
      comune: "Pozzuoli",
      lat: null,
      posizioneVerificata: false,
    });
  });
});
