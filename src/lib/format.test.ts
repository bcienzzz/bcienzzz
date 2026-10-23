import { describe, expect, it } from "vitest";
import { dataLunga, differenzaCent, distanza, euro, indirizzo, tempoFa, titolo } from "./format";

describe("format", () => {
  it("euro", () => {
    expect(euro(1.789)).toBe("1,789 €");
    expect(euro(0.7)).toBe("0,700 €");
  });

  it("differenzaCent", () => {
    expect(differenzaCent(-0.06)).toBe("−6 cent");
    expect(differenzaCent(0.004)).toBe("+0,4 cent");
    expect(differenzaCent(0)).toBe("±0 cent");
  });

  it("dataLunga", () => {
    expect(dataLunga("2026-10-21")).toBe("21 ottobre 2026");
  });

  it("tempoFa", () => {
    const ora = Date.parse("2026-10-22T12:00:00+02:00");
    expect(tempoFa("2026-10-22T11:35:00+02:00", ora)).toBe("25 min fa");
    expect(tempoFa("2026-10-22T09:00:00+02:00", ora)).toBe("3 ore fa");
    expect(tempoFa("2026-10-21T09:00:00+02:00", ora)).toBe("ieri");
    expect(tempoFa("2013-06-05T10:00:00+02:00", ora)).toBe("13 anni fa");
  });

  it("distanza", () => {
    expect(distanza(0.348)).toBe("350 m");
    expect(distanza(2.46)).toBe("2,5 km");
    expect(distanza(12.4)).toBe("12 km");
  });

  it("titolo", () => {
    expect(titolo("VIA DELL'EPOMEO 116/B")).toBe("Via dell'Epomeo 116/B");
    expect(titolo("VIALE J.F. KENNEDY 53")).toBe("Viale J.F. Kennedy 53");
    expect(titolo("SS 7 QUATER KM. 37+300")).toBe("SS 7 Quater Km. 37+300");
    expect(titolo("Via Terracina 180")).toBe("Via Terracina 180");
  });

  it("indirizzo", () => {
    expect(indirizzo("MONTENUOVO LICOLA PATRIA 148 80078")).toBe("Montenuovo Licola Patria 148");
    expect(indirizzo("VIA LAGO PATRIA SNC 80014")).toBe("Via Lago Patria");
    expect(indirizzo("Via DELLA LIBERAZIONE SNC 80125")).toBe("Via DELLA LIBERAZIONE");
    expect(indirizzo("SS.115 KM.158+302  S.N.  ")).toBe("SS.115 Km.158+302 S.N.");
  });
});
