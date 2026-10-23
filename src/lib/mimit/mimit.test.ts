import { describe, expect, it } from "vitest";
import { inPoligono } from "@/lib/geo";
import { ZONES } from "@/config/zones";
import { buildDataset } from "./build";
import { classificaCarburante } from "./fuels";
import { dataItalianaToISO, MimitFormatError, parseAnagrafica, parsePrezzi } from "./parse";

// Righe prese dai file reali del 21/10/2026 (alcune coordinate modificate per i test).
const ANAGRAFICA = [
  "Estrazione del 2026-10-21",
  "idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine",
  "52653|GE.CA.M. DI ORESTE MOVIBILE & C.|Esso|Stradale|ESSO LICOLA|MONTENUOVO LICOLA PATRIA 148 80078|POZZUOLI|NA|40.869755465252254|14.059473127126694",
  '32424|"IP SERVICES S.R.L."|Api-Ip|Stradale|POZZUOLI - DOMITIANA|VIA DOMITIANA  80078|POZZUOLI|NA|40.85|14.08',
  "63381|ENIMOOV S.P.A.|Agip Eni|Stradale|19834\tMONTALLEGRO|SS.115 KM.158+302  S.N.  |POZZUOLI|NA|40.84|14.07",
  "54386|PRADELLI - MONTEOMBRARO | gestori.prezzibenzina.it|Pompe Bianche|Stradale|PRADELLI | gestori.prezzibenzina.it|Via dei Martiri 255 80078|POZZUOLI|NA|40.83|14.09",
  "11111|ROTTO|X|Stradale|NOME | ALTRO|VIA|POZZUOLI|NA|40.8|14.1",
  "62970|ENI|Agip Eni|Stradale|SORRENTO|CORSO ITALIA No279|SORRENTO|NA|43.78874|7.6213346",
  "70000|INVERTITO|Q8|Stradale|X|VIA X|BACOLI|NA|14.06|40.8",
  "70001|LONTANO|Q8|Stradale|X|VIA X|POZZUOLI|NA|40.776|14.48",
  "70002|SENZA GPS|Q8|Stradale|X|VIA X|POZZUOLI|NA||",
  "59183|ENIMOOV S.P.A.|Agip Eni|Stradale|19829 AGRIGENTO|SS.189 KM. 64+649|AGRIGENTO|AG|37.333935|13.595533",
].join("\n");

const PREZZI = [
  "Estrazione del 2026-10-21",
  "idImpianto|descCarburante|prezzo|isSelf|dtComu",
  "52653|Benzina|1.799|1|20/10/2026 07:30:00",
  "52653|Benzina|1.789|1|20/10/2026 18:00:00",
  "52653|Benzina|1.999|0|20/10/2026 07:30:00",
  "52653|Blue Diesel|1.899|1|20/10/2026 07:30:00",
  "52653|Metano|4.999|1|20/10/2026 07:30:00",
  "32424|Gasolio|1.689|1|05/06/2013 10:00:00",
  "59183|Benzina|1.850|1|20/10/2026 07:30:00",
  "99999|Benzina|1.850|1|20/10/2026 07:30:00",
].join("\n");

describe("parseAnagrafica", () => {
  const r = parseAnagrafica(ANAGRAFICA);

  it("legge la data di estrazione", () => {
    expect(r.dataEstrazione).toBe("2026-10-21");
  });

  it("toglie virgolette spurie e tab", () => {
    expect(r.righe.find((x) => x.id === 32424)?.gestore).toBe("IP SERVICES S.R.L.");
    expect(r.righe.find((x) => x.id === 63381)?.nome).toBe("19834 MONTALLEGRO");
  });

  it("ripara il '|' di gestori.prezzibenzina.it", () => {
    const x = r.righe.find((x) => x.id === 54386)!;
    expect(x.gestore).toBe("PRADELLI - MONTEOMBRARO");
    expect(x.comune).toBe("POZZUOLI");
    expect(x.lat).toBe(40.83);
  });

  it("scarta (senza indovinare) le righe con '|' sconosciuti", () => {
    expect(r.righe.some((x) => x.id === 11111)).toBe(false);
    expect(r.scarti).toHaveLength(1);
  });

  it("coordinate vuote → null", () => {
    expect(r.righe.find((x) => x.id === 70002)).toMatchObject({ lat: null, lon: null });
  });

  it("si ferma se le colonne cambiano", () => {
    const rotto = ANAGRAFICA.replace("Latitudine|Longitudine", "Lat|Lon");
    expect(() => parseAnagrafica(rotto)).toThrow(MimitFormatError);
    expect(() => parseAnagrafica("ciao\n" + ANAGRAFICA)).toThrow(MimitFormatError);
  });

  it("accetta file con a capo Windows", () => {
    expect(parseAnagrafica(ANAGRAFICA.replace(/\n/g, "\r\n")).righe).toHaveLength(r.righe.length);
  });
});

describe("parsePrezzi", () => {
  it("legge prezzo, self e data", () => {
    const r = parsePrezzi(PREZZI);
    expect(r.righe[0]).toEqual({
      idImpianto: 52653,
      carburante: "Benzina",
      prezzo: 1.799,
      self: true,
      comunicatoIl: "2026-10-20T07:30:00+02:00",
    });
    expect(r.scarti).toHaveLength(0);
  });

  it("si ferma se le colonne cambiano", () => {
    expect(() => parsePrezzi(PREZZI.replace("isSelf", "self"))).toThrow(MimitFormatError);
  });
});

describe("dataItalianaToISO", () => {
  it("gestisce ora legale e solare", () => {
    expect(dataItalianaToISO("20/07/2026 12:00:00")).toBe("2026-07-20T12:00:00+02:00");
    expect(dataItalianaToISO("20/01/2026 12:00:00")).toBe("2026-01-20T12:00:00+01:00");
    expect(dataItalianaToISO("2026-01-20")).toBeNull();
  });
});

describe("classificaCarburante", () => {
  it.each([
    ["Benzina", "benzina", true],
    ["Gasolio", "gasolio", true],
    ["GPL", "gpl", true],
    ["Metano", "metano", true],
    ["Blue Diesel", "gasolio", false],
    ["HVOlution", "gasolio", false],
    ["HiQ Perform+", "benzina", false],
    ["Blue Super", "benzina", false],
    ["Benzina WR 100", "benzina", false],
    ["L-GNC", "metano", false],
    ["GNL", "altro", false],
  ])("%s → %s", (nome, famiglia, base) => {
    expect(classificaCarburante(nome)).toEqual({ famiglia, base });
  });
});

describe("buildDataset", () => {
  const ds = buildDataset(parseAnagrafica(ANAGRAFICA), parsePrezzi(PREZZI), ["NA"]);
  const get = (id: number) => ds.distributori.find((d) => d.id === id)!;

  it("tiene solo le province scelte", () => {
    expect(ds.distributori.some((d) => d.provincia === "AG")).toBe(false);
  });

  it("controlla le coordinate", () => {
    expect(get(52653).coordinate).toBe("ok");
    expect(get(62970).coordinate).toBe("fuori_provincia");
    expect(get(70000)).toMatchObject({ coordinate: "invertite", lat: 40.8, lon: 14.06 });
    expect(get(70001).coordinate).toBe("lontane_dal_comune");
    expect(get(70002).coordinate).toBe("mancanti");
  });

  it("assegna la zona solo con coordinate affidabili", () => {
    expect(get(52653).zone).toEqual(["campi-flegrei"]);
    expect(get(62970).zone).toEqual([]);
  });

  it("con coordinate inaffidabili usa comune e CAP", () => {
    expect(get(70001).zone).toEqual(["campi-flegrei"]); // POZZUOLI, punto a Torre del Greco
    expect(get(70002).zone).toEqual(["campi-flegrei"]); // POZZUOLI, senza GPS
  });

  it("unisce i prezzi tenendo la comunicazione più recente", () => {
    const p = get(52653).prezzi;
    expect(p.filter((x) => x.carburante === "Benzina" && x.self)).toHaveLength(1);
    expect(p.find((x) => x.carburante === "Benzina" && x.self)?.prezzo).toBe(1.789);
    expect(p.find((x) => x.carburante === "Benzina" && !x.self)?.prezzo).toBe(1.999);
  });

  it("segnala prezzi vecchi e sospetti", () => {
    expect(get(32424).prezzi[0].vecchio).toBe(true);
    expect(get(52653).prezzi.find((x) => x.carburante === "Metano")?.sospetto).toBe(true);
    expect(ds.report.prezziVecchi).toBe(1);
    expect(ds.report.prezziSospetti).toBe(1);
  });
});

describe("zona Campi Flegrei", () => {
  const cf = ZONES.find((z) => z.id === "campi-flegrei")!.contorno;
  it.each([
    ["Pozzuoli centro", 40.823, 14.122, true],
    ["Bacoli", 40.797, 14.078, true],
    ["Monte di Procida", 40.8, 14.05, true],
    ["Quarto", 40.878, 14.142, true],
    ["Licola", 40.87, 14.06, true],
    ["Villaggio Coppola", 40.975, 13.99, true],
    ["Bagnoli", 40.81, 14.17, true],
    ["Fuorigrotta", 40.83, 14.19, true],
    ["Aversa", 40.973, 14.207, false],
    ["Giugliano centro", 40.928, 14.196, false],
    ["Napoli centro", 40.852, 14.268, false],
  ])("%s", (_nome, lat, lon, atteso) => {
    expect(inPoligono(lat, lon, cf)).toBe(atteso);
  });
});
