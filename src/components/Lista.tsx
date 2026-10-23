"use client";

import { differenzaCent, distanza, euro, tempoFa } from "@/lib/format";
import { affidabile, type Riga } from "@/lib/stazioni";
import { IconaAttenzione } from "./Icone";

type Props = {
  righe: Riga[];
  media: number | null;
  soglia: number | null;
  ora: number;
  onScegli: (id: number) => void;
};

export function Avvisi({ r, ora }: { r: Riga; ora: number }) {
  const avvisi: string[] = [];
  if (r.prezzo.vecchio) avvisi.push(`Prezzo comunicato ${tempoFa(r.prezzo.comunicatoIl, ora)}`);
  if (r.prezzo.sospetto) avvisi.push("Prezzo da verificare");
  if (!r.d.posizioneVerificata) avvisi.push("Posizione non verificata");
  if (!avvisi.length) return null;
  return (
    <ul className="mt-1.5 flex flex-wrap gap-1">
      {avvisi.map((a) => (
        <li key={a} className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">
          <IconaAttenzione className="size-3.5" />
          {a}
        </li>
      ))}
    </ul>
  );
}

export function Lista({ righe, media, soglia, ora, onScegli }: Props) {
  if (righe.length === 0) {
    return (
      <p className="p-6 text-center text-slate-500">
        Nessun distributore della zona ha comunicato un prezzo per questo carburante.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-200 bg-white">
      {righe.map((r) => {
        const ok = affidabile(r.prezzo);
        const conveniente = ok && soglia !== null && r.prezzo.prezzo <= soglia;
        return (
          <li key={r.d.id}>
            <button
              type="button"
              onClick={() => onScegli(r.d.id)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{r.d.titolo}</span>
                  {conveniente && (
                    <span className="shrink-0 rounded-md bg-primario/10 px-1.5 py-0.5 text-[11px] font-semibold text-primario">
                      Conveniente
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-slate-600">
                  {r.d.indirizzo}
                  {r.d.indirizzo && ", "}
                  {r.d.comune}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.km !== null && <span className="font-medium text-slate-700">{distanza(r.km)} · </span>}
                  aggiornato {tempoFa(r.prezzo.comunicatoIl, ora)}
                </p>
                <Avvisi r={r} ora={ora} />
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-lg font-bold tabular-nums ${ok ? "text-slate-900" : "text-slate-400"}`}>
                  {euro(r.prezzo.prezzo)}
                </p>
                {ok && media !== null && (
                  <p className="text-xs tabular-nums text-slate-500">{differenzaCent(r.prezzo.prezzo - media)} sulla media</p>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
