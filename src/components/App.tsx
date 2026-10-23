"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FAMIGLIE, NOME_FAMIGLIA, type Famiglia } from "@/lib/mimit/fuels";
import { dataLunga, euro } from "@/lib/format";
import { mediaZona, righe as calcolaRighe, sogliaConvenienti, type DatiZona, type Ordine } from "@/lib/stazioni";
import { AvvisoGuida, Info } from "./Finestre";
import { IconaInfo, IconaLista, IconaMappa, IconaPompa, IconaPosizione } from "./Icone";
import { Lista } from "./Lista";
import { leggi, scrivi } from "./preferenze";
import { SchedaRapida } from "./SchedaRapida";
import { Segmenti } from "./Segmenti";
import { usePosizione } from "./usePosizione";

// Leaflet funziona solo nel browser: la mappa non viene generata sul server.
const Mappa = dynamic(() => import("./Mappa"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-slate-500">Carico la mappa…</div>,
});

type Vista = "mappa" | "lista";

const MESSAGGI_POSIZIONE = {
  negata: "Posizione non consentita: abilitala nelle impostazioni del browser per vedere le distanze.",
  "non-disponibile": "Non riesco a trovare la tua posizione in questo momento.",
} as const;

export default function App({ dati }: { dati: DatiZona }) {
  const [vista, setVista] = useState<Vista>("mappa");
  const [famiglia, setFamiglia] = useState<Famiglia>("benzina");
  const [self, setSelf] = useState(true);
  const [ordine, setOrdine] = useState<Ordine>("prezzo");
  const [sceltoId, setSceltoId] = useState<number | null>(null);
  const [infoAperta, setInfoAperta] = useState(false);
  const [avvisoGuida, setAvvisoGuida] = useState(false);
  const [centra, setCentra] = useState(0);
  const [ora, setOra] = useState(() => Date.parse(`${dati.dataEstrazione}T12:00:00Z`));
  const { posizione, stato, chiedi } = usePosizione();

  // Preferenze salvate e ora reale: si leggono solo nel browser, dopo il primo disegno.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- valori disponibili solo nel browser */
    const f = leggi("famiglia");
    if (f && (FAMIGLIE as readonly string[]).includes(f)) setFamiglia(f as Famiglia);
    const s = leggi("self");
    if (s) setSelf(s === "1");
    if (leggi("avviso-guida") !== "ok") setAvvisoGuida(true);
    setOra(Date.now());
    /* eslint-enable react-hooks/set-state-in-effect */
    const t = setInterval(() => setOra(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const scegliFamiglia = (f: Famiglia) => {
    setFamiglia(f);
    scrivi("famiglia", f);
  };
  const scegliSelf = (v: "self" | "servito") => {
    setSelf(v === "self");
    scrivi("self", v === "self" ? "1" : "0");
  };

  const righe = useMemo(
    () => calcolaRighe(dati.distributori, famiglia, self, ordine, posizione),
    [dati.distributori, famiglia, self, ordine, posizione],
  );
  const media = useMemo(() => mediaZona(righe), [righe]);
  const soglia = useMemo(() => sogliaConvenienti(righe), [righe]);
  const scelta = righe.find((r) => r.d.id === sceltoId) ?? null;

  const vaiAllaPosizione = useCallback(async () => {
    if (posizione || (await chiedi())) setCentra((n) => n + 1);
  }, [posizione, chiedi]);

  const scegliOrdine = async (o: Ordine) => {
    setOrdine(o);
    if (o === "distanza" && !posizione) await chiedi();
  };

  const messaggioPosizione = stato === "negata" || stato === "non-disponibile" ? MESSAGGI_POSIZIONE[stato] : null;

  return (
    <div className="flex h-dvh flex-col">
      {/* Intestazione */}
      <header className="z-10 flex items-center gap-3 border-b border-slate-200 bg-white px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <span className="grid size-9 place-items-center rounded-xl bg-primario text-white">
          <IconaPompa className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold leading-tight">Carburanti {dati.zona.nome}</h1>
          <p className="truncate text-xs text-slate-500">Prezzi MIMIT aggiornati al {dataLunga(dati.dataEstrazione)}</p>
        </div>
        <button
          type="button"
          onClick={() => setInfoAperta(true)}
          aria-label="Informazioni"
          className="grid size-10 place-items-center rounded-full text-slate-600 active:bg-slate-100"
        >
          <IconaInfo className="size-6" />
        </button>
      </header>

      {/* Contenuto */}
      <main className="relative min-h-0 flex-1">
        <div className={vista === "mappa" ? "absolute inset-0" : "hidden"}>
          <Mappa
            centro={dati.zona.centro}
            zoom={dati.zona.zoom}
            righe={righe}
            soglia={soglia}
            sceltoId={sceltoId}
            posizione={posizione}
            centraSuPosizione={centra}
            onScegli={setSceltoId}
          />
          <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex items-start justify-between gap-2">
            <div className="pointer-events-auto rounded-xl bg-white/95 px-3 py-2 text-xs shadow ring-1 ring-slate-200">
              <p className="text-slate-500">
                {NOME_FAMIGLIA[famiglia]} {self ? "self" : "servito"} · media zona
              </p>
              <p className="text-base font-bold tabular-nums">{media !== null ? euro(media) : "—"}</p>
            </div>
            <button
              type="button"
              onClick={vaiAllaPosizione}
              aria-label="Mostra la mia posizione"
              className="pointer-events-auto grid size-12 place-items-center rounded-full bg-white text-primario shadow ring-1 ring-slate-200 active:bg-slate-100"
            >
              <IconaPosizione className={`size-6 ${stato === "in-corso" ? "animate-pulse" : ""}`} />
            </button>
          </div>
        </div>

        {vista === "lista" && (
          <div className="absolute inset-0 overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur">
              <p className="flex-1 text-xs text-slate-600">
                <strong className="text-slate-900">{righe.length}</strong> distributori
                {media !== null && (
                  <>
                    {" "}
                    · media <strong className="tabular-nums text-slate-900">{euro(media)}</strong>
                  </>
                )}
              </p>
              <Segmenti
                etichetta="Ordina per"
                className="w-48"
                opzioni={[
                  { valore: "prezzo", etichetta: "Prezzo" },
                  { valore: "distanza", etichetta: "Distanza" },
                ]}
                valore={ordine}
                onCambia={scegliOrdine}
              />
            </div>
            <Lista righe={righe} media={media} soglia={soglia} ora={ora} onScegli={setSceltoId} />
            <p className="px-4 py-6 text-center text-xs text-slate-400">
              Fonte dati prezzi: Ministero delle Imprese e del Made in Italy (MIMIT)
            </p>
          </div>
        )}

        {messaggioPosizione && (
          <p className="absolute inset-x-3 top-20 z-[1100] rounded-xl bg-slate-900/90 p-3 text-sm text-white shadow-lg">
            {messaggioPosizione}
          </p>
        )}

        {scelta && (
          <div className="absolute inset-x-3 bottom-3 z-[1100]">
            <SchedaRapida r={scelta} ora={ora} onChiudi={() => setSceltoId(null)} />
          </div>
        )}
      </main>

      {/* Comandi in basso, a portata di pollice */}
      <nav className="z-10 space-y-2 border-t border-slate-200 bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <Segmenti
          etichetta="Carburante"
          opzioni={FAMIGLIE.map((f) => ({ valore: f, etichetta: NOME_FAMIGLIA[f] }))}
          valore={famiglia}
          onCambia={scegliFamiglia}
        />
        <div className="flex gap-2">
          <Segmenti
            etichetta="Modalità"
            className="flex-1"
            opzioni={[
              { valore: "self", etichetta: "Self" },
              { valore: "servito", etichetta: "Servito" },
            ]}
            valore={self ? "self" : "servito"}
            onCambia={scegliSelf}
          />
          <div role="tablist" aria-label="Vista" className="flex flex-1 rounded-xl bg-slate-100 p-1">
            {(
              [
                ["mappa", "Mappa", IconaMappa],
                ["lista", "Lista", IconaLista],
              ] as const
            ).map(([v, testo, Icona]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={vista === v}
                onClick={() => {
                  setVista(v);
                  setSceltoId(null);
                }}
                className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold ${
                  vista === v ? "bg-primario text-white shadow-sm" : "text-slate-500 active:bg-slate-200"
                }`}
              >
                <Icona className="size-4" />
                {testo}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {avvisoGuida && (
        <AvvisoGuida
          onOk={() => {
            setAvvisoGuida(false);
            scrivi("avviso-guida", "ok");
          }}
        />
      )}
      {infoAperta && <Info dataEstrazione={dati.dataEstrazione} fonte={dati.fonte} onChiudi={() => setInfoAperta(false)} />}
    </div>
  );
}
