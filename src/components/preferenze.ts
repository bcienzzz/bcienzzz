// Preferenze salvate solo nel browser (carburante scelto, avviso già letto...).
// Se il browser non permette di salvare, l'app funziona lo stesso.

export function leggi(chiave: string): string | null {
  try {
    return localStorage.getItem(`cf:${chiave}`);
  } catch {
    return null;
  }
}

export function scrivi(chiave: string, valore: string): void {
  try {
    localStorage.setItem(`cf:${chiave}`, valore);
  } catch {
    // niente: è solo una comodità
  }
}
