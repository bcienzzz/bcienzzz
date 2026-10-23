"use client";

// Riquadro che compare in basso quando si tocca un distributore.
// La scheda completa (con "Portami lì") arriva nello step 3.

import { FAMIGLIE, NOME_FAMIGLIA } from "@/lib/mimit/fuels";
import { distanza, euro, tempoFa } from "@/lib/format";
import { affidabile, type Riga } from "@/lib/stazioni";
import { IconaChiudi } from "./Icone";
import { Avvisi } from "./Lista";

export function SchedaRapida({ r, ora, onChiudi }: { r: Riga; ora: number; onChiudi: () => void }) {
  const { d } = r;
  return (
    <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold">{d.titolo}</p>
          <p className="truncate text-sm text-slate-600">
            {d.indirizzo}
            {d.indirizzo && ", "}
            {d.comune}
          </p>
          {r.km !== null && <p className="text-xs font-medium text-slate-700">a {distanza(r.km)}</p>}
        </div>
        <button
          type="button"
          onClick={onChiudi}
          aria-label="Chiudi"
          className="-m-2 grid size-10 shrink-0 place-items-center rounded-full text-slate-500 active:bg-slate-100"
        >
          <IconaChiudi />
        </button>
      </div>

      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th className="font-medium">Carburante</th>
            <th className="text-right font-medium">Self</th>
            <th className="text-right font-medium">Servito</th>
          </tr>
        </thead>
        <tbody>
          {FAMIGLIE.map((f) => {
            const s = d.prezzi.find((p) => p.famiglia === f && p.base && p.self);
            const v = d.prezzi.find((p) => p.famiglia === f && p.base && !p.self);
            if (!s && !v) return null;
            const cella = (p: typeof s) =>
              p ? (
                <span className={affidabile(p) ? "font-semibold" : "text-slate-400"}>{euro(p.prezzo)}</span>
              ) : (
                <span className="text-slate-300">—</span>
              );
            return (
              <tr key={f} className="border-t border-slate-100">
                <td className="py-1.5">{NOME_FAMIGLIA[f]}</td>
                <td className="py-1.5 text-right tabular-nums">{cella(s)}</td>
                <td className="py-1.5 text-right tabular-nums">{cella(v)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">Prezzo scelto aggiornato {tempoFa(r.prezzo.comunicatoIl, ora)}</p>
      <Avvisi r={r} ora={ora} />
    </div>
  );
}
