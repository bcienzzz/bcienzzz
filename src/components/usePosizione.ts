"use client";

import { useCallback, useState } from "react";

export type StatoPosizione = "nessuna" | "in-corso" | "ok" | "negata" | "non-disponibile";

/** Posizione dell'utente, chiesta solo quando serve. Non viene mai inviata al server. */
export function usePosizione() {
  const [posizione, setPosizione] = useState<{ lat: number; lon: number } | null>(null);
  const [stato, setStato] = useState<StatoPosizione>("nessuna");

  const chiedi = useCallback((): Promise<boolean> => {
    if (!("geolocation" in navigator)) {
      setStato("non-disponibile");
      return Promise.resolve(false);
    }
    setStato("in-corso");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setPosizione({ lat: p.coords.latitude, lon: p.coords.longitude });
          setStato("ok");
          resolve(true);
        },
        (e) => {
          setStato(e.code === e.PERMISSION_DENIED ? "negata" : "non-disponibile");
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }, []);

  return { posizione, stato, chiedi };
}
