"use client";

// Gruppo di pulsanti in cui se ne sceglie uno solo (es. Self / Servito).

type Opzione<T extends string> = { valore: T; etichetta: string };

export function Segmenti<T extends string>({
  opzioni,
  valore,
  onCambia,
  etichetta,
  className = "",
}: {
  opzioni: Opzione<T>[];
  valore: T;
  onCambia: (v: T) => void;
  etichetta: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={etichetta} className={`flex rounded-xl bg-slate-100 p-1 ${className}`}>
      {opzioni.map((o) => {
        const attivo = o.valore === valore;
        return (
          <button
            key={o.valore}
            type="button"
            aria-pressed={attivo}
            onClick={() => onCambia(o.valore)}
            className={`min-h-10 flex-1 rounded-lg px-2 text-sm font-semibold transition-colors ${
              attivo ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 active:bg-slate-200"
            }`}
          >
            {o.etichetta}
          </button>
        );
      })}
    </div>
  );
}
