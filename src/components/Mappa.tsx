"use client";

// Mappa Leaflet + OpenStreetMap. Caricata solo nel browser (vedi App.tsx).

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { affidabile, type Riga } from "@/lib/stazioni";

type Props = {
  centro: { lat: number; lon: number };
  zoom: number;
  righe: Riga[];
  soglia: number | null;
  sceltoId: number | null;
  posizione: { lat: number; lon: number } | null;
  /** Cambia valore per chiedere alla mappa di centrarsi sulla posizione dell'utente. */
  centraSuPosizione: number;
  onScegli: (id: number | null) => void;
};

type MarkerConPrezzo = L.Marker & { prezzo?: number };

function prezzoBreve(p: number): string {
  return p.toFixed(3).replace(".", ",");
}

function iconaPrezzo(r: Riga, soglia: number | null, scelto: boolean): L.DivIcon {
  const classi = ["pin"];
  if (!affidabile(r.prezzo)) classi.push("pin--dubbio");
  else if (soglia !== null && r.prezzo.prezzo <= soglia) classi.push("pin--conveniente");
  if (scelto) classi.push("pin--scelto");
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div class="${classi.join(" ")}">${prezzoBreve(r.prezzo.prezzo)}</div>`,
  });
}

export default function Mappa({ centro, zoom, righe, soglia, sceltoId, posizione, centraSuPosizione, onScegli }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const mappaRef = useRef<L.Map | null>(null);
  const gruppoRef = useRef<L.MarkerClusterGroup | null>(null);
  const markerRef = useRef(new Map<number, { m: MarkerConPrezzo; r: Riga }>());
  const posRef = useRef<L.CircleMarker | null>(null);
  const onScegliRef = useRef(onScegli);
  useEffect(() => {
    onScegliRef.current = onScegli;
  }, [onScegli]);

  // Creazione della mappa (una volta sola).
  useEffect(() => {
    let annullato = false;
    const marker = markerRef.current;
    const mappa = L.map(divRef.current!, { zoomControl: false, attributionControl: true }).setView(
      [centro.lat, centro.lon],
      zoom,
    );
    mappa.attributionControl.setPrefix(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mappa);
    mappa.on("click", () => onScegliRef.current(null));
    mappaRef.current = mappa;

    // Il plugin dei gruppi si aspetta Leaflet come variabile globale.
    (window as unknown as { L: typeof L }).L = L;
    import("leaflet.markercluster").then(() => {
      if (annullato) return;
      gruppoRef.current = L.markerClusterGroup({
        maxClusterRadius: 45,
        disableClusteringAtZoom: 15,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: false,
        iconCreateFunction: (cluster) => {
          const prezzi = cluster
            .getAllChildMarkers()
            .map((m) => (m as MarkerConPrezzo).prezzo)
            .filter((p): p is number => p !== undefined);
          const min = prezzi.length ? Math.min(...prezzi) : null;
          return L.divIcon({
            className: "",
            iconSize: [0, 0],
            html: `<div class="gruppo">${
              min !== null ? `<span>da</span><b>${prezzoBreve(min)}</b>` : ""
            }<span>${cluster.getChildCount()} distrib.</span></div>`,
          });
        },
      }).addTo(mappa);
      mappa.fire("gruppi-pronti");
    });

    return () => {
      annullato = true;
      mappa.remove();
      mappaRef.current = null;
      gruppoRef.current = null;
      marker.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- centro e zoom servono solo all'avvio
  }, []);

  // Segnaposto con i prezzi: rifatti quando cambiano carburante, self/servito o dati.
  useEffect(() => {
    const mappa = mappaRef.current;
    if (!mappa) return;
    const disegna = () => {
      const gruppo = gruppoRef.current;
      if (!gruppo) return;
      gruppo.clearLayers();
      markerRef.current.clear();
      const nuovi: L.Marker[] = [];
      for (const r of righe) {
        if (r.d.lat === null || r.d.lon === null) continue;
        const m: MarkerConPrezzo = L.marker([r.d.lat, r.d.lon], {
          icon: iconaPrezzo(r, soglia, r.d.id === sceltoId),
          keyboard: false,
        });
        if (affidabile(r.prezzo)) m.prezzo = r.prezzo.prezzo;
        m.on("click", () => onScegliRef.current(r.d.id));
        markerRef.current.set(r.d.id, { m, r });
        nuovi.push(m);
      }
      gruppo.addLayers(nuovi);
    };
    if (gruppoRef.current) disegna();
    else mappa.once("gruppi-pronti", disegna);
    return () => {
      mappa.off("gruppi-pronti", disegna);
    };
    // sceltoId è gestito dall'effetto sotto, senza ridisegnare tutto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [righe, soglia]);

  // Evidenzia il distributore scelto.
  const precedente = useRef<number | null>(null);
  useEffect(() => {
    for (const id of [precedente.current, sceltoId]) {
      if (id === null) continue;
      const voce = markerRef.current.get(id);
      if (voce) {
        voce.m.setIcon(iconaPrezzo(voce.r, soglia, id === sceltoId));
        voce.m.setZIndexOffset(id === sceltoId ? 1000 : 0);
      }
    }
    precedente.current = sceltoId;
    const voce = sceltoId !== null ? markerRef.current.get(sceltoId) : undefined;
    const mappa = mappaRef.current;
    if (voce && mappa && !mappa.getBounds().pad(-0.15).contains(voce.m.getLatLng())) {
      mappa.panTo(voce.m.getLatLng());
    }
  }, [sceltoId, soglia]);

  // Pallino blu con la posizione dell'utente.
  useEffect(() => {
    const mappa = mappaRef.current;
    if (!mappa) return;
    posRef.current?.remove();
    posRef.current = null;
    if (posizione) {
      posRef.current = L.circleMarker([posizione.lat, posizione.lon], {
        radius: 8,
        color: "#fff",
        weight: 3,
        fillColor: "#2563eb",
        fillOpacity: 1,
        interactive: false,
      }).addTo(mappa);
    }
  }, [posizione]);

  useEffect(() => {
    if (centraSuPosizione && posizione) mappaRef.current?.flyTo([posizione.lat, posizione.lon], 14, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- si centra solo quando lo chiede l'utente
  }, [centraSuPosizione]);

  return <div ref={divRef} className="absolute inset-0" aria-label="Mappa dei distributori" role="region" />;
}
