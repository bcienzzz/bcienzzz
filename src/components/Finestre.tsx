"use client";

// Avviso "non usare l'app mentre guidi" e pannello informazioni.

import { dataLunga } from "@/lib/format";
import { IconaAttenzione, IconaChiudi } from "./Icone";

export function AvvisoGuida({ onOk }: { onOk: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="avviso-titolo" className="fixed inset-0 z-[2000] grid place-items-center bg-slate-900/50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700">
          <IconaAttenzione className="size-6" />
        </div>
        <h2 id="avviso-titolo" className="mt-3 text-lg font-bold">
          Non usare l&apos;app mentre guidi
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Accosta in un posto sicuro o chiedi a un passeggero. Nessun prezzo vale un incidente.
        </p>
        <button
          type="button"
          onClick={onOk}
          className="mt-5 min-h-12 w-full rounded-xl bg-primario text-base font-semibold text-white active:opacity-90"
        >
          Ho capito
        </button>
      </div>
    </div>
  );
}

export function Info({ dataEstrazione, fonte, onChiudi }: { dataEstrazione: string; fonte: string; onChiudi: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="info-titolo" className="fixed inset-0 z-[2000] flex items-end bg-slate-900/50" onClick={onChiudi}>
      <div
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="info-titolo" className="text-lg font-bold">
            Informazioni
          </h2>
          <button type="button" onClick={onChiudi} aria-label="Chiudi" className="grid size-10 place-items-center rounded-full active:bg-slate-100">
            <IconaChiudi />
          </button>
        </div>

        <section className="mt-4 space-y-2 text-sm text-slate-700">
          <h3 className="font-semibold text-slate-900">Da dove vengono i prezzi</h3>
          <p>
            Fonte dati prezzi: <strong>Ministero delle Imprese e del Made in Italy (MIMIT)</strong>, open data con
            licenza{" "}
            <a className="text-primario underline" href="https://www.dati.gov.it/iodl/2.0/" target="_blank" rel="noreferrer">
              IODL 2.0
            </a>
            .
          </p>
          <p>
            I file del MIMIT si aggiornano una volta al giorno e contengono i prezzi in vigore alle 8 del giorno
            precedente. Ultimo aggiornamento: <strong>{dataLunga(dataEstrazione)}</strong>.
          </p>
          <p>
            I prezzi sono comunicati dai gestori: possono non essere aggiornati. Segnaliamo quelli molto vecchi o
            fuori scala, e i distributori con una posizione GPS dubbia.
          </p>
        </section>

        <section className="mt-5 space-y-2 text-sm text-slate-700">
          <h3 className="font-semibold text-slate-900">Mappa</h3>
          <p>
            Mappa ©{" "}
            <a className="text-primario underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
              OpenStreetMap
            </a>{" "}
            contributors.
          </p>
          <p>
            La tua posizione serve solo a calcolare le distanze sul tuo telefono: non viene inviata né salvata.
          </p>
        </section>

        <section className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Non usare l&apos;app mentre guidi.</strong> Accosta o chiedi a un passeggero.
        </section>

        <p className="mt-5 text-xs text-slate-400">Dati: {fonte}</p>
      </div>
    </div>
  );
}
