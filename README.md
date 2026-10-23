# Carburanti Campi Flegrei

Web app mobile-first (PWA) in italiano che mostra i distributori di carburante della zona
Campi Flegrei / Pozzuoli con prezzi, disponibilità e fila stimata. I prezzi sono quelli
ufficiali del MIMIT; disponibilità e fila arrivano dalle segnalazioni degli utenti.

> Fonte dati prezzi: Ministero delle Imprese e del Made in Italy (MIMIT), licenza IODL 2.0.

## Stato del progetto

| Step | Contenuto | Stato |
|---|---|---|
| 1 | Importazione e controllo dei dati MIMIT | ✅ fatto |
| 2 | Mappa e lista | ✅ bozza fatta |
| 3 | Scheda distributore | da fare |
| 4 | Segnalazioni utenti | da fare |
| 5 | Stima della fila | da fare |
| 6 | PWA, pubblicazione e aggiornamento giornaliero | da fare |

## Cosa serve sul computer

- [Node.js](https://nodejs.org) 22 o più recente (scegli la versione "LTS")
- [Git](https://git-scm.com)

## Installazione in locale

```bash
git clone https://github.com/bcienzzz/bcienzzz.git carburanti-flegrei
cd carburanti-flegrei
npm install
```

Finché il lavoro non è unito al ramo principale, aggiungi `-b claude/magical-keller-2ozmze` al comando `git clone`.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run import` | Scarica i file dal MIMIT, li controlla e crea `data/distributori.json` |
| `npm run import -- --anagrafica FILE --prezzi FILE` | Come sopra, ma usando file già scaricati |
| `npm run import -- --supabase` | Carica anche il risultato su Supabase (servono le variabili d'ambiente) |
| `npm test` | Esegue i test automatici |
| `npm run typecheck` / `npm run lint` | Controlli sul codice |
| `npm run dev` | Avvia l'app su http://localhost:3000 |
| `npm run import -- ... --snapshot` | Aggiorna `src/data/snapshot.json`, la copia dei dati usata quando Supabase non è configurato |

### Provare l'importazione

1. Scarica dal browser (da una connessione italiana) i due file:
   - https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv
   - https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv
2. Lancia:
   ```bash
   npm run import -- --anagrafica ~/Downloads/anagrafica_impianti_attivi.csv --prezzi ~/Downloads/prezzo_alle_8.csv
   ```
3. Lo script stampa un riepilogo: quanti distributori, quanti per comune nella zona Campi
   Flegrei, quali hanno coordinate sospette. Il risultato è in `data/distributori.json`, mentre
   le righe scartate finiscono in `data/scarti.json`.

Se sei in Italia puoi anche lanciare solo `npm run import`, che scarica i file da solo.

## Provare l'app

```bash
npm run dev
```

Apri http://localhost:3000. Per vederla come sul telefono, usa la modalità dispositivo
mobile del browser: in Chrome, tasto destro → Ispeziona → icona del telefono.

### Da dove legge i dati l'app

1. Se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` sono impostate, legge da **Supabase**.
2. Altrimenti usa **`src/data/snapshot.json`**, una copia dei dati della zona salvata nel progetto.
   Così l'app funziona anche senza database. La crei o aggiorni con `npm run import -- ... --snapshot`.

In app, il pannello Informazioni (icona "i") mostra in fondo quale delle due fonti è in uso.

## I dati MIMIT

Il formato è stato verificato sui file reali del 21/10/2026:

- **Prima riga**: `Estrazione del AAAA-MM-GG`. È la data mostrata in app come "prezzi aggiornati al…".
- **Seconda riga**: i nomi delle colonne, separati da `|`.
  - Anagrafica: `idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine`
  - Prezzi: `idImpianto|descCarburante|prezzo|isSelf|dtComu` (`isSelf` = 1 self, 0 servito; `dtComu` = `GG/MM/AAAA HH:MM:SS`, ora italiana)
- Se il MIMIT cambia le colonne, lo script **si ferma con un errore** invece di salvare dati sbagliati.

Problemi trovati nei file e come li gestiamo:

| Problema | Soluzione |
|---|---|
| 113 righe con `\| gestori.prezzibenzina.it` dentro il nome, che rompe le colonne | Il testo spurio viene tolto |
| Altri `\|` imprevisti nei campi | La riga viene scartata (in `data/scarti.json`), non indovinata |
| Virgolette spaiate e tab dentro i campi | Vengono ripuliti |
| Prezzi fermi da anni (alcuni dal 2013) | Segnati come `vecchio` se più vecchi di 30 giorni |
| Prezzi assurdi (es. 0,10 € o metano a 4,999 €) | Segnati come `sospetto` |
| Coordinate GPS sbagliate (es. un distributore di Sorrento in Liguria) | Segnate: vedi sotto |

Controllo delle coordinate (campo `coordinate`):

- `ok`: plausibili.
- `invertite`: latitudine e longitudine erano scambiate, corrette in automatico.
- `mancanti`: assenti o pari a zero.
- `fuori_provincia`: il punto cade fuori dalla provincia dichiarata.
- `lontane_dal_comune`: il punto è molto lontano dagli altri distributori dello stesso comune.

Solo `ok` e `invertite` finiscono sulla mappa. Gli altri resteranno in lista con l'avviso
"posizione non verificata".

### Il MIMIT risponde solo dall'Italia

Il sito del MIMIT non risponde alle connessioni dall'estero. Per questo l'aggiornamento
giornaliero non può girare su GitHub Actions né su Vercel, che hanno server all'estero.
Allo step 6 lo configuriamo su un server in Italia (Google Cloud Run, zona di Milano, nella
quota gratuita).

## Zone e province

Tutto è in `src/config/zones.ts`:

- `IMPORT_PROVINCES`: province importate. Ora `NA` e `CE`: Caserta serve per Villaggio Coppola, che è nel comune di Castel Volturno.
- `ZONES`: le zone mostrate in app, ognuna con centro della mappa e contorno. La zona "Campi
  Flegrei" comprende Pozzuoli, Bacoli, Monte di Procida, Quarto, Licola/Lago Patria, Villaggio
  Coppola, Bagnoli, Fuorigrotta e dintorni (Pianura, Soccavo, Posillipo).

Per aggiungere un'altra area: aggiungi la provincia a `IMPORT_PROVINCES`, il suo riquadro a
`PROVINCE_BBOX` e, se vuoi, una nuova zona a `ZONES`.

## Supabase

1. Crea un progetto nuovo su [supabase.com](https://supabase.com): piano gratuito, regione **Frankfurt (eu-central-1)**.
2. Vai su **SQL Editor**, incolla il contenuto di `supabase/schema.sql` e premi **Run**.
3. Copia `.env.example` in `.env.local` e inserisci i valori da **Project Settings → API**.
4. Prova: `npm run import -- --anagrafica ... --prezzi ... --supabase`

### Variabili d'ambiente

| Nome | Dove si usa | Segreta? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | app e script | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | app (solo lettura) | no |
| `SUPABASE_SERVICE_ROLE_KEY` | solo script di importazione | **sì**: mai nel browser, mai su Git |

## Struttura del progetto

```
src/config/zones.ts        province e zone coperte
src/lib/mimit/parse.ts     lettura dei file MIMIT
src/lib/mimit/fuels.ts     raggruppamento dei carburanti (benzina, gasolio, GPL, metano)
src/lib/mimit/build.ts     unione dei file e controlli su coordinate e prezzi
src/lib/geo.ts             distanze e calcoli geografici
src/lib/dati.ts            caricamento dei dati per l'app (Supabase o copia locale)
src/lib/stazioni.ts        ordinamento, media della zona, prezzi "convenienti"
src/lib/format.ts          prezzi, date e indirizzi in italiano
src/data/snapshot.json     copia dei dati della zona
src/components/App.tsx     schermata principale (filtri, mappa/lista)
src/components/Mappa.tsx   mappa Leaflet + OpenStreetMap
src/components/Lista.tsx   lista dei distributori
scripts/import-mimit.ts    script di importazione giornaliera
supabase/schema.sql        tabelle del database
```

## Pubblicazione (deploy)

Verrà descritta allo step 6: Vercel per l'app e un job giornaliero in Italia per i dati.
