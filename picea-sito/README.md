# Sito Pizzeria Picea

Sito statico (solo HTML, CSS e JavaScript, nessun database) per Picea, pizzeria napoletana a Pozzuoli.

```
picea-sito/
├── sito/        ← la cartella da pubblicare online (è il sito vero e proprio)
│   ├── index.html, storia.html, galleria.html, prenota.html, contatti.html, privacy.html, 404.html
│   ├── robots.txt, sitemap.xml, favicon.ico
│   └── assets/  (css, js, font, immagini)
└── sorgente/    ← da qui si modificano i contenuti
    ├── config.json   dati della pizzeria: orari, telefono, WhatsApp, Glovo, social, dati legali
    ├── build.py      rigenera le pagine in ../sito
    └── menu.json     bozza di menu NON verificata e NON pubblicata (vedi sotto)
```

## Modificare i contenuti

1. Apri `sorgente/config.json` o `sorgente/menu.json` con un editor di testo e cambia quello che serve.
2. Rigenera le pagine (serve Python 3, già presente su Mac e Linux):

   ```
   cd picea-sito/sorgente
   python3 build.py
   ```
3. Ricarica online la cartella `sito`.

Esempi:
- **Orari**: `orari.fasce` (0 = domenica … 6 = sabato). Una chiusura minore dell'apertura vuol dire il giorno dopo (es. `18:00`–`02:00`); un giorno con `[]` è chiuso (oggi: il martedì). Gli orari si aggiornano da soli ovunque: settimana in home, tabelle, piè di pagina, stato "Aperto ora", orari prenotabili e dati per Google.
- **Link Glovo**: `glovo_url`.
- **Logo**: il logo ufficiale è in `sito/assets/img/logo-picea-*.webp/.png` (esportato dal file vettoriale del cliente). Compare grande in cima alla home e piccolo nell’intestazione e nel footer.
- **Galleria**: le foto sono elencate in `galleria` dentro `config.json` (file, larghezze, dimensioni originali, testo alternativo, didascalia). Per aggiungerne una: salva in `sito/assets/img/` le versioni `nome-800.webp/.jpg` e `nome-1600.webp/.jpg` (o la larghezza reale, se la foto è più piccola) e aggiungi una voce all'elenco. Oggi la galleria usa dettagli dell'unica foto disponibile: appena arrivano foto recenti del locale e delle pizze vanno aggiunte qui.
- **Privacy**: se cambi il testo dell'informativa, aggiorna anche `privacy_aggiornata`.
- **Menu**: la pagina è stata tolta finché non arriva il menu ufficiale del cliente. `menu.json` contiene solo una bozza raccolta da fonti online, da NON pubblicare senza il controllo del cliente.

Puoi modificare i colori e le spaziature in `sito/assets/css/style.css` e il comportamento delle pagine (prenotazione, mappa, menu mobile) in `sito/assets/js/main.js`. Questi due file non vengono toccati da `build.py`.

## Vedere il sito sul computer

```
cd picea-sito/sito
python3 -m http.server 8000
```
poi apri http://localhost:8000 nel browser.

## Pubblicare

Qualsiasi hosting statico va bene. Tre opzioni:

| Servizio | Costo | Note |
|---|---|---|
| Netlify | gratis | trascini la cartella `sito` su app.netlify.com/drop e ottieni subito un link; poi colleghi il dominio |
| Cloudflare Pages | gratis | molto veloce; serve un account Cloudflare |
| Hosting del registrar (Aruba, Register.it…) | ~30–60 €/anno | carichi i file via FTP nella cartella del dominio |

Dominio: in `config.json` è impostato `https://www.pizzeriapicea.com` (risulta già della pizzeria). Se il sito va su un altro dominio, cambia `sito_url` e rilancia `build.py`: si aggiornano canonical, sitemap e anteprima per i social.

## Cosa fa il sito (e cosa no)

- **Prenotazioni**: il modulo prepara un messaggio WhatsApp al numero in `config.json`. La prenotazione è confermata quando la pizzeria risponde. Nessun dato viene salvato sul sito.
- **Modulo contatti**: apre l'app di posta del cliente con il messaggio pronto per l'email in `config.json`. Per ricevere i messaggi senza app di posta serve un servizio esterno (es. Web3Forms o Formspree, gratuiti con limiti).
- **Mappa**: Google Maps si carica solo quando il visitatore preme "Mostra la mappa"; prima non parte nessuna richiesta a Google.
- **Nessun cookie, nessuna statistica**: quindi non serve il banner dei cookie. Se in futuro si aggiunge Google Analytics o un pixel, servirà il banner.
- **Senza JavaScript** il sito si legge tutto; i due moduli lasciano il posto a telefono, WhatsApp ed email.
- **Pagina 404**: usa percorsi dalla radice del dominio (`/assets/...`), quindi funziona a qualsiasi indirizzo sbagliato. Su Netlify viene usata in automatico.
- **Font**: Marcellus (titoli) e Figtree (testo), ospitati nel sito con licenza SIL Open Font License.

## SEO (cosa c'è già e cosa fare dopo la pubblicazione)

Già nel sito:
- titoli e descrizioni diversi per ogni pagina, con "pizzeria", "pizza napoletana" e "Pozzuoli";
- dati strutturati per Google (schema.org): Restaurant con indirizzo, coordinate, orari (martedì chiuso), telefono, servizi, pagamenti e prenotazione; WebSite; percorso di navigazione (BreadcrumbList) nelle pagine interne; domande frequenti (FAQPage) nella pagina Contatti;
- sitemap.xml e robots.txt; la privacy e la 404 non vengono indicizzate;
- immagine di anteprima per WhatsApp/Facebook, testi alternativi sulle foto, pagine veloci e accessibili.

Da fare quando il sito è online (non si può fare dal codice):
1. **Google Search Console**: aggiungere il dominio, verificarlo e inviare `https://www.pizzeriapicea.com/sitemap.xml`.
2. **Scheda Google (Google Business Profile)** di Picea: mettere il link al nuovo sito, controllare che orari (martedì chiuso), telefono e indirizzo siano identici a quelli del sito, aggiungere foto recenti e rispondere alle recensioni. Per una pizzeria è la cosa che conta di più.
3. Mettere il link al sito anche nella bio di Instagram e nella pagina Facebook.
4. Se il dominio cambia, aggiornare `sito_url` in `config.json` e rigenerare.
