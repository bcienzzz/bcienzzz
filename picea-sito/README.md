# Sito Pizzeria Picea

Sito statico (solo HTML, CSS e JavaScript, nessun database) per Picea, pizzeria napoletana a Pozzuoli.

```
picea-sito/
├── sito/        ← la cartella da pubblicare online (è il sito vero e proprio)
│   ├── index.html, storia.html, menu.html, prenota.html, contatti.html, privacy.html, 404.html
│   ├── robots.txt, sitemap.xml
│   └── assets/  (css, js, font, immagini)
└── sorgente/    ← da qui si modificano i contenuti
    ├── config.json   dati della pizzeria: orari, telefono, WhatsApp, Glovo, social, dati legali
    ├── menu.json     il menu (senza prezzi)
    ├── build.py      rigenera le pagine in ../sito
    └── ramo.py       disegna il rametto di abete (Picea abies) usato come motivo grafico
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
- **Orari**: `orari.fasce` (0 = domenica … 6 = sabato). Una chiusura minore dell'apertura vuol dire il giorno dopo (es. `18:00`–`02:00`). Gli orari si aggiornano da soli ovunque: tabelle, piè di pagina, stato "Aperto ora", orari prenotabili e dati per Google.
- **Link Glovo**: `glovo_url`. Si prende dall'app Glovo: pagina di Picea → Condividi → Copia link.
- **Pizza in home**: in `menu.json` aggiungi `"in_evidenza": true` alla pizza (ne vengono mostrate 3).
- **Logo**: metti il file in `sito/assets/img/` (es. `logo.png`) e scrivi `"logo_url": "assets/img/logo.png"`.

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
- **Font**: Marcellus (titoli) e Figtree (testo), ospitati nel sito con licenza SIL Open Font License.
