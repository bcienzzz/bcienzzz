#!/usr/bin/env python3
"""Genera il sito di Picea nella cartella ../sito partendo da config.json e menu.json.

Uso:  python3 build.py
Tutte le pagine condividono testata, menu e piè di pagina, così restano sempre uguali.
"""
import datetime
import html
import json
import os
import re

QUI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(QUI, "..", "sito")
C = json.load(open(os.path.join(QUI, "config.json"), encoding="utf-8"))
OGGI = datetime.date.today()

e = html.escape  # testo sicuro nell'HTML


# ------------------------------------------------------------------ icone
def icona(nome, classe=""):
    c = f' class="{classe}"' if classe else ""
    return f'<svg{c} aria-hidden="true" focusable="false"><use href="#i-{nome}"/></svg>'


ICONE = """<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<symbol id="i-tel" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M5 3.5h3.2l1.6 4-2.1 1.3a11 11 0 0 0 5.5 5.5l1.3-2.1 4 1.6V17a2.5 2.5 0 0 1-2.7 2.5C9.6 19 5 14.4 4.5 6.2A2.5 2.5 0 0 1 5 3.5Z"/></symbol>
<symbol id="i-whatsapp" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.2 21.8l4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.9a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 1 1 12 20.1Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.7.7 2.3.8 3.1.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.6-.3Z"/></symbol>
<symbol id="i-scooter" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="2.6"/><circle cx="18.5" cy="17" r="2.6"/><path d="M8.6 17h6.8l2.6-6h-3.5"/><path d="M14 5.5h2l2.3 9"/><path d="M3 11h7.5v4H5"/></g></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/></g></symbol>
<symbol id="i-calendario" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17h2"/></g></symbol>
<symbol id="i-orologio" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></g></symbol>
<symbol id="i-email" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></g></symbol>
<symbol id="i-freccia" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M4 12h15M13 6l6 6-6 6"/></symbol>
<symbol id="i-esterno" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></symbol>
<symbol id="i-instagram" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/></g></symbol>
<symbol id="i-facebook" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21.5v-8h2.7l.4-3.1h-3.1V8.4c0-.9.3-1.5 1.5-1.5h1.7V4.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.2H7.5v3.1h2.7v8h3.3Z"/></symbol>
<symbol id="i-accessibile" viewBox="0 0 36 36"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="17" cy="6" r="2.4"/><path d="M17 10.5v9h8.5l3 7.5"/><path d="M17 14.5h7"/><path d="M13 16a7.5 7.5 0 1 0 10 9.4"/></g></symbol>
<symbol id="i-consegna" viewBox="0 0 36 36"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="25.5" r="3.8"/><circle cx="27.5" cy="25.5" r="3.8"/><path d="M12.3 25.5h10.5l3.8-9h-5.2"/><path d="M21 10.5h3l3.8 15"/><path d="M4 16.5h11.2v6H6"/></g></symbol>
<symbol id="i-aperto" viewBox="0 0 36 36"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13.5 18 5.5l13 8H5Z"/><path d="M18 13.5v18"/><path d="M10.5 22.5h15"/><path d="M12.8 22.5 10.5 31.5M23.2 22.5l2.3 9"/></g></symbol>
<symbol id="i-eventi" viewBox="0 0 36 36"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 6h7.5l-.8 7.5a3 3 0 0 1-5.9 0L7.5 6Z"/><path d="M11.3 16.5v12m-3.8 0h7.5"/><path d="M21 6h7.5l-.8 7.5a3 3 0 0 1-5.9 0L21 6Z"/><path d="M24.8 16.5v12m-3.8 0h7.5"/><path d="M8.3 9.8h6m6.8 0h6"/></g></symbol>
<symbol id="i-asporto" viewBox="0 0 36 36"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.8 12h22.5l-1.9 18H8.6L6.8 12Z"/><path d="M12.8 15v-4.5a5.2 5.2 0 0 1 10.5 0V15"/></g></symbol>
<symbol id="i-wifi" viewBox="0 0 36 36"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.3a20.3 20.3 0 0 1 28 0"/><path d="M8.3 19.1a13.5 13.5 0 0 1 19.4 0"/><path d="M12.8 24a7 7 0 0 1 10.4 0"/><circle cx="18" cy="28.5" r="1.2" fill="currentColor"/></g></symbol>
</defs></svg>"""


# ------------------------------------------------------------------ dati derivati
IND = C["indirizzo"]
INDIRIZZO_RIGA = f'{IND["via"]}, {IND["cap"]} {IND["citta"]} ({IND["provincia"]})'
# Spazi non separabili: i numeri di telefono non vanno mai a capo.
TEL_V, TEL_L = C["telefono"]["visibile"].replace(" ", "\u00a0"), C["telefono"]["link"]
WA_V, WA_N = C["whatsapp"]["visibile"].replace(" ", "\u00a0"), C["whatsapp"]["numero"]
GLOVO = C["glovo_url"]
GIORNI_IT = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"]
SCHEMA_GIORNI = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

NAV = [
    ("index.html", "Home"),
    ("storia.html", "La storia"),
    ("prenota.html", "Prenota"),
    ("contatti.html", "Contatti"),
]


NUOVA_SCHEDA = '<span class="sr-only"> (si apre in una nuova scheda)</span>'


def link_esterno(url, testo, classe="", icona_nome=None, etichetta=None):
    i = icona(icona_nome) if icona_nome else ""
    cl = f' class="{classe}"' if classe else ""
    if etichetta:  # l'aria-label sostituisce il testo, quindi l'avviso va dentro l'etichetta
        return f'<a{cl} href="{e(url)}" target="_blank" rel="noopener" aria-label="{e(etichetta)} (si apre in una nuova scheda)">{i}{testo}</a>'
    return f'<a{cl} href="{e(url)}" target="_blank" rel="noopener">{i}{testo}{NUOVA_SCHEDA}</a>'


def via_unita():
    """La via con il numero civico che non va mai a capo da solo."""
    return e(IND["via"]).replace(", ", ",&nbsp;")


def citta_unita():
    """CAP, città e provincia: la sigla (NA) non resta mai da sola su una riga."""
    return f'{e(IND["cap"])} {e(IND["citta"])}&nbsp;({e(IND["provincia"])})'


def fasce_giorno(giorno):
    return C["orari"]["fasce"].get(str(giorno)) or []


def fasce_testo(giorno):
    return [f"{a}–{c}" for a, c in fasce_giorno(giorno)]


def tabella_orari(classe=""):
    righe = []
    for g in C["orari"]["gruppi"]:
        fasce = "".join(f"<span><time>{a}</time>–<time>{c}</time></span>" for a, c in fasce_giorno(g["giorni"][0])) or '<span class="chiuso">Chiuso</span>'
        righe.append(
            f'<li data-giorni="{",".join(map(str, g["giorni"]))}"><span class="giorni">{e(g["etichetta"])} '
            f'<span class="badge-oggi" hidden>Oggi</span></span><span class="fasce">{fasce}</span></li>')
    return f'<ul class="tabella-orari {classe}">{"".join(righe)}</ul>'


def settimana_html():
    nomi = [(1, "Lun"), (2, "Mar"), (3, "Mer"), (4, "Gio"), (5, "Ven"), (6, "Sab"), (0, "Dom")]
    col = []
    for g, n in nomi:
        fasce = "".join(f'<span><time>{a}</time><i>–</i><time>{c}</time></span>' for a, c in fasce_giorno(g)) or '<span class="chiuso">Chiuso</span>'
        col.append(f'<li data-giorni="{g}"><b>{n}</b>{fasce}<em class="badge-oggi" hidden>Oggi</em></li>')
    return f'<ul class="settimana">{"".join(col)}</ul>'


def orari_brevi():
    out = []
    for g in C["orari"]["gruppi"]:
        fasce = "".join(f"<span>{f}</span>" for f in fasce_testo(g["giorni"][0])) or "<span>Chiuso</span>"
        out.append(f'<li><span>{e(g["etichetta"])}</span><span>{fasce}</span></li>')
    return f'<ul class="orari-brevi">{"".join(out)}</ul>'


def social_html():
    voci = []
    if C["social"].get("instagram"):
        voci.append(link_esterno(C["social"]["instagram"], "", "", "instagram", "Picea su Instagram"))
    if C["social"].get("facebook"):
        voci.append(link_esterno(C["social"]["facebook"], "", "", "facebook", "Picea su Facebook"))
    return f'<div class="social">{"".join(voci)}</div>' if voci else ""


def bottone_glovo(classe="btn btn--vuoto btn--glovo", testo="Ordina su Glovo"):
    if not GLOVO:
        return ""
    return link_esterno(GLOVO, testo, classe, "scooter")


def bottone_whatsapp(classe="btn", testo=None):
    if not WA_N:
        return ""
    testo = testo or f"WhatsApp {WA_V}"
    return link_esterno(f"https://wa.me/{WA_N}", e(testo), classe, "whatsapp")


def legale_riga():
    L = C["legale"]
    parti = [e(L["ragione_sociale"] or C["nome_completo"])]
    if L["partita_iva"]:
        parti.append("P. IVA " + e(L["partita_iva"]))
    if L["codice_fiscale"] and L["codice_fiscale"] != L["partita_iva"]:
        parti.append("C.F. " + e(L["codice_fiscale"]))
    return " · ".join(parti)


def mappa_html():
    return f"""<div class="mappa">
  <div class="mappa__copertina">
    <span class="mappa__pin" aria-hidden="true"><i></i><i></i>{icona("pin", "pin")}</span>
    <strong>{e(IND["via"])}, {e(IND["citta"])}</strong>
    <p>La mappa di Google si carica solo se premi “Mostra la mappa”: prima di allora Google non riceve alcun dato.</p>
    <div class="azioni">
      <button class="btn" type="button" data-carica-mappa>Mostra la mappa</button>
      {link_esterno(C["maps_link"], "Apri in Google Maps", "btn btn--vuoto", "esterno")}
    </div>
  </div>
</div>"""


def immagine(nome, alt, larghezze, sizes, classe="", lazy=True, priorita=False, w=None, h=None, verticale=None):
    """<picture> con WebP e JPEG. nome senza estensione; larghezze = lista di suffissi o None.
    verticale = larghezze del ritaglio verticale (file nome-verticale-L) usato sui telefoni tenuti in verticale."""
    s_vert = ""
    if verticale:
        media = "(max-width: 719px) and (orientation: portrait)"
        for tipo, est in (("image/webp", "webp"), ("image/jpeg", "jpg")):
            sv = ", ".join(f"assets/img/{nome}-verticale-{l}.{est} {l}w" for l in verticale)
            s_vert += f'<source media="{media}" type="{tipo}" srcset="{sv}" sizes="100vw">'
    if larghezze:
        webp = ", ".join(f"assets/img/{nome}-{l}.webp {l}w" for l in larghezze)
        jpg = ", ".join(f"assets/img/{nome}-{l}.jpg {l}w" for l in larghezze)
        src = f"assets/img/{nome}-{larghezze[len(larghezze) // 2]}.jpg"
        s_webp = f'<source type="image/webp" srcset="{webp}" sizes="{sizes}">'
        img_srcset = f' srcset="{jpg}" sizes="{sizes}"'
    else:
        s_webp = f'<source type="image/webp" srcset="assets/img/{nome}.webp">'
        src, img_srcset = f"assets/img/{nome}.jpg", ""
    attr = ' loading="lazy" decoding="async"' if lazy else ' decoding="async"'
    if priorita:
        # la classe "caricata" fa entrare la foto in dissolvenza sopra il segnaposto sfocato
        attr += (' fetchpriority="high" onload="var i=this;(i.decode?i.decode():Promise.resolve()).catch(function(){})'
                 '.then(function(){requestAnimationFrame(function(){i.classList.add(\'caricata\')})})"')
    dim = f' width="{w}" height="{h}"' if w and h else ""
    cl = f' class="{classe}"' if classe else ""
    return f'<picture{cl}>{s_vert}{s_webp}<img src="{src}"{img_srcset} alt="{e(alt)}"{dim}{attr}></picture>'


# ------------------------------------------------------------------ struttura comune
def schema_ristorante():
    spec = []
    for g in range(7):
        for a, c in fasce_giorno(g):
            spec.append({"@type": "OpeningHoursSpecification", "dayOfWeek": SCHEMA_GIORNI[g],
                         "opens": a, "closes": "23:59" if c == "00:00" else c})
    dati = {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": C["nome_completo"],
        "description": "Pizzeria napoletana nel centro storico di Pozzuoli dal 1996: la verace pizza napoletana cotta nel forno a legna.",
        "foundingDate": str(C["anno_apertura"]),
        "servesCuisine": ["Pizza napoletana"],
        "telephone": TEL_L,
        "email": C["email"],
        "address": {"@type": "PostalAddress", "streetAddress": IND["via"], "postalCode": IND["cap"],
                    "addressLocality": IND["citta"], "addressRegion": IND["provincia"], "addressCountry": "IT"},
        "geo": {"@type": "GeoCoordinates", "latitude": C["geo"]["lat"], "longitude": C["geo"]["lng"]},
        "hasMap": C["maps_link"],
        "acceptsReservations": True,
        "paymentAccepted": ", ".join(C["pagamenti"]),
        "openingHoursSpecification": spec,
    }
    if C["sito_url"]:
        dati["url"] = C["sito_url"]
        dati["image"] = C["sito_url"].rstrip("/") + "/assets/img/og-picea.jpg"
    same = [u for u in (C["social"].get("instagram"), C["social"].get("facebook")) if u]
    if same:
        dati["sameAs"] = same
    return '<script type="application/ld+json">' + json.dumps(dati, ensure_ascii=False) + "</script>"


def dati_js():
    d = {
        "orari": C["orari"]["fasce"],
        "whatsapp": WA_N,
        "email": C["email"],
        "mapsEmbed": C["maps_embed"],
        "indirizzo": INDIRIZZO_RIGA,
        "prenotazioni": {"intervallo": C["prenotazioni"]["intervallo_minuti"],
                         "margine": C["prenotazioni"]["ultimo_orario_prima_della_chiusura_minuti"],
                         "personeMax": C["prenotazioni"]["persone_max"]},
    }
    return "<script>window.PICEA=" + json.dumps(d, ensure_ascii=False) + ";</script>"


def head(pagina, titolo, descrizione, extra=""):
    url = C["sito_url"].rstrip("/")
    canon = ""
    if pagina == "404.html":
        canon = '<meta name="robots" content="noindex">'
    elif url:
        percorso = "/" if pagina == "index.html" else "/" + pagina
        canon = (f'<link rel="canonical" href="{url}{percorso}">\n<meta property="og:url" content="{url}{percorso}">\n'
                 f'<meta property="og:image" content="{url}/assets/img/og-picea.jpg">\n'
                 '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'
                 '<meta property="og:image:alt" content="Tre pizze napoletane di Picea viste dall’alto su un tavolo di legno">')
    og_tipo = "restaurant.restaurant" if pagina in ("index.html", "contatti.html") else "website"
    return f"""<!DOCTYPE html>
<html lang="it" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(titolo)}</title>
<meta name="description" content="{e(descrizione)}">
<meta name="theme-color" content="#0f0e0c">
<meta property="og:type" content="{og_tipo}">
<meta property="og:locale" content="it_IT">
<meta property="og:site_name" content="{e(C["nome_completo"])}">
<meta property="og:title" content="{e(titolo)}">
<meta property="og:description" content="{e(descrizione)}">
<meta name="twitter:card" content="summary_large_image">
{canon}
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="preload" href="assets/fonts/marcellus-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/figtree-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/style.css">
<script>document.documentElement.classList.replace("no-js","js");</script>
{extra}
</head>"""


def header(pagina):
    voci = []
    voci_m = []
    for href, testo in NAV:
        cur = ' aria-current="page"' if href == pagina else ""
        voci.append(f'<a href="{href}"{cur}>{e(testo)}</a>')
        voci_m.append(f'<li><a href="{href}"{cur}>{e(testo)}</a></li>')
    logo = (f'<img src="{e(C["logo_url"])}" alt="" width="48" height="48" referrerpolicy="no-referrer" '
            f'onerror="this.remove()">') if C["logo_url"] else ""
    info_m = f'<p class="info">{via_unita()}, {citta_unita()}<br><a href="tel:{TEL_L}">{e(TEL_V)}</a></p>'
    return f"""<a class="salta" href="#contenuto">Vai al contenuto</a>
{ICONE}
<header class="header">
  <div class="contenitore">
    <a class="marchio" href="index.html">
      {logo}
      <span class="marchio__testo"><span class="marchio__nome">{e(C["nome"])}</span><span class="marchio__sotto">Pozzuoli · dal {C["anno_apertura"]}</span></span><span class="sr-only"> – torna alla home</span>
    </a>
    <nav class="nav" aria-label="Menu principale">{"".join(voci)}</nav>
    <a class="btn" href="prenota.html">{icona("calendario")}Prenota</a>
    <button class="burger" type="button" aria-label="Apri il menu" aria-expanded="false" aria-controls="menu-mobile"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="menu-mobile" id="menu-mobile" inert>
  <nav aria-label="Menu"><ul>{"".join(voci_m)}</ul></nav>
  {info_m}
</div>"""


def barra(pagina):
    glovo = link_esterno(GLOVO, "Ordina", "", "scooter") if GLOVO else ""
    cur = lambda p: ' aria-current="page"' if p == pagina else ""
    voci = [
        f'<a href="tel:{TEL_L}">{icona("tel")}Chiama</a>',
        f'<a class="primario" href="prenota.html"{cur("prenota.html")}>{icona("calendario")}Prenota</a>',
        glovo,
        link_esterno(C["maps_link"], "Mappa", "", "pin"),
    ]
    voci = [v for v in voci if v]
    return f'<nav class="barra" aria-label="Azioni rapide" style="grid-template-columns:repeat({len(voci)},1fr)">{"".join(voci)}</nav>'


def footer():
    logo = (f'<img src="{e(C["logo_url"])}" alt="" width="48" height="48" loading="lazy" referrerpolicy="no-referrer" '
            f'onerror="this.remove()">') if C["logo_url"] else ""
    wa = f'<li>{link_esterno(f"https://wa.me/{WA_N}", "WhatsApp " + e(WA_V))}</li>' if WA_N else ""
    glovo = f'<li>{link_esterno(GLOVO, "Ordina su Glovo")}</li>' if GLOVO else ""
    return f"""<footer class="footer">
  <div class="contenitore">
    <div class="footer__griglia">
      <div>
        <a class="marchio" href="index.html">{logo}<span class="marchio__testo"><span class="marchio__nome">{e(C["nome"])}</span><span class="marchio__sotto">Pozzuoli · dal {C["anno_apertura"]}</span></span><span class="sr-only"> – torna alla home</span></a>
        <p>Nel centro storico di Pozzuoli dal {C["anno_apertura"]}. La verace pizza napoletana, cotta nel forno a&nbsp;legna.</p>
        {social_html()}
      </div>
      <div>
        <h2>Dove siamo</h2>
        <ul>
          <li>{via_unita()}<br>{citta_unita()}</li>
          <li>{link_esterno(C["maps_link"], "Indicazioni stradali")}</li>
        </ul>
      </div>
      <div>
        <h2>Contatti</h2>
        <ul>
          <li><a href="tel:{TEL_L}">Tel.&nbsp;{e(TEL_V)}</a></li>
          {wa}
          <li><a href="mailto:{e(C["email"])}">{e(C["email"])}</a></li>
          {glovo}
        </ul>
      </div>
      <div>
        <h2>Orari</h2>
        {orari_brevi()}
      </div>
    </div>
    <p class="footer__gigante" aria-hidden="true">{e(C["nome"])}</p>
    <div class="footer__fondo">
      <p>© <span data-anno>{OGGI.year}</span> {legale_riga()}</p>
      <p><a href="privacy.html">Privacy</a></p>
    </div>
  </div>
</footer>"""


def dalla_radice(doc):
    """Per la 404, che può essere mostrata a qualsiasi indirizzo: risorse e pagine con percorsi assoluti."""
    doc = re.sub(r'(?<=["\s,])assets/', "/assets/", doc)
    doc = doc.replace('href="index.html"', 'href="/"')
    return re.sub(r'href="(storia|prenota|contatti|privacy)\.html"', r'href="/\1.html"', doc)


def pagina(nome, titolo, descrizione, corpo, classe_body="", extra_head=""):
    doc = "\n".join([
        head(nome, titolo, descrizione, extra_head),
        f'<body class="{classe_body}">',
        header(nome),
        f'<main id="contenuto">\n{corpo}\n</main>',
        footer(),
        barra(nome),
        dati_js(),
        '<script src="assets/js/main.js" defer></script>',
        "</body>\n</html>\n",
    ])
    if nome == "404.html":
        doc = dalla_radice(doc)
    with open(os.path.join(OUT, nome), "w", encoding="utf-8") as f:
        f.write(doc)
    print("scritta", nome)


def stato_html(annuncia=True):
    ruolo = ' role="status"' if annuncia else ""
    return (f'<p class="stato" data-stato hidden{ruolo}><span class="stato__punto" aria-hidden="true"></span>'
            '<span data-stato-testo>&nbsp;</span></p>')


# ------------------------------------------------------------------ pagine
def home():
    NASTRO = "".join(f"<span>{v}</span>" for v in ['Verace pizza napoletana', 'Forno a legna', 'Centro storico di Pozzuoli', 'Dal 1996'])
    servizi = "".join(f'<li>{icona(s["icona"])}{e(s["nome"])}</li>' for s in C["servizi"])
    pagamenti = "".join(f"<li>{e(p)}</li>" for p in C["pagamenti"])
    glovo_hero = bottone_glovo()
    corpo = f"""
<section class="hero" aria-labelledby="titolo-home">
  {immagine("pizze", "Tre pizze napoletane di Picea viste dall’alto su un tavolo di legno", [800, 1280, 2000], "(max-aspect-ratio: 3/2) 150vh, 100vw", "hero__foto", lazy=False, priorita=True, w=2000, h=1333, verticale=[640, 960])}
  <div class="contenitore">
    {stato_html()}
    <p class="hero__epigrafe" aria-hidden="true">PVTEOLI · MCMXCVI</p>
    <h1 id="titolo-home">{e(C["nome"])}<span class="sr-only"> – pizzeria napoletana a Pozzuoli</span></h1>
    <p class="hero__sotto">La vera pizza napoletana, cotta nel forno a&nbsp;legna nel centro storico di&nbsp;Pozzuoli.</p>
    <div class="hero__azioni">
      <a class="btn" href="prenota.html">{icona("calendario")}Prenota un tavolo</a>
      {glovo_hero}
      <a class="btn btn--vuoto solo-desktop" href="tel:{TEL_L}">{icona("tel")}Chiama</a>
    </div>
  </div>
</section>

<section class="info-rapide" aria-label="Informazioni rapide">
  <div class="contenitore">
    <a class="info-rapide__voce" href="#orari">{icona("orologio")}<div><small>Oggi</small><span data-oggi-orari>Vedi gli orari</span></div></a>
    <a class="info-rapide__voce" href="{e(C["maps_link"])}" target="_blank" rel="noopener">{icona("pin")}<div><small>Dove siamo</small><span>{via_unita()}&nbsp;·&nbsp;{e(IND["citta"])}</span></div>{NUOVA_SCHEDA}</a>
    <a class="info-rapide__voce" href="tel:{TEL_L}">{icona("tel")}<div><small>Chiama</small><span>{e(TEL_V)}</span></div></a>
  </div>
</section>

<div class="nastro" aria-hidden="true"><div class="nastro__binario">{NASTRO}{NASTRO}</div></div>

<section class="sezione chiaro" aria-labelledby="titolo-intro">
  <span class="anno-sfondo" aria-hidden="true">MCMXCVI</span>
  <div class="contenitore intro-storia">
    <div class="rivela">
      <span class="occhiello">Dal {C["anno_apertura"]}</span>
      <h2 class="citazione" id="titolo-intro">Rispettare le origini per <em>esaltare i sapori</em>.</h2>
      <p class="dettaglio">Nel 1996, Giovanni Vanacore approda a Pozzuoli, una città dove ogni angolo o scavo riporta alla luce la memoria dell’antica Roma e del suo impero.</p>
      <a class="link-freccia" href="storia.html">Leggi la nostra storia {icona("freccia")}</a>
    </div>
  </div>
</section>

<section class="sezione metodo-sezione" aria-labelledby="titolo-metodo">
  <div class="contenitore">
    <div class="centro">
      <span class="occhiello rivela">La nostra pizza</span>
      <h2 class="titolo-sezione rivela" id="titolo-metodo">La verace pizza <em>napoletana</em></h2>
      <div class="strati" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="intro-sezione rivela" style="margin-inline:auto">Scorri la pagina o scegli una delle quattro fasi.</p>
    </div>
    <div class="laboratorio">
      <figure class="laboratorio__scena">
        <svg class="laboratorio__svg" viewBox="0 0 400 400" data-fase="1" role="img" aria-labelledby="lab-didascalia">
          <defs>
            <radialGradient id="g-impasto" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#f6e7c8"/><stop offset=".72" stop-color="#ecd3a2"/><stop offset="1" stop-color="#d9a866"/></radialGradient>
            <radialGradient id="g-bagliore" cx="50%" cy="80%" r="60%"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".55"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
          </defs>
          <g class="fx-forno">
            <path d="M30 392V236a170 170 0 0 1 340 0v156z" fill="#2a1e15" stroke="#c98b3e" stroke-width="2"/>
            <path d="M40 392V238a160 160 0 0 1 320 0v154" fill="none" stroke="#3a2a1d" stroke-width="10" stroke-dasharray="2 26"/>
            <path d="M92 392V262a108 108 0 0 1 216 0v130z" fill="#0b0806"/>
            <ellipse cx="200" cy="360" rx="150" ry="70" fill="url(#g-bagliore)"/>
            <g class="fiamme">
              <path class="fiamma" d="M118 392c-6-30 14-38 10-62 16 18 22 40 12 62z" fill="#ff8a2a"/>
              <path class="fiamma f2" d="M138 392c-4-24 10-30 8-48 12 14 14 32 8 48z" fill="#ffc35a"/>
              <path class="fiamma f3" d="M282 392c6-30-14-38-10-62-16 18-22 40-12 62z" fill="#ff8a2a"/>
              <path class="fiamma f2" d="M262 392c4-24-10-30-8-48-12 14-14 32-8 48z" fill="#ffc35a"/>
            </g>
          </g>
          <g class="fx-ingredienti">
            <g class="ingrediente" style="--d:0s"><circle cx="112" cy="128" r="34" fill="#c4372a"/><path d="M112 96l6 6 8-3-4 8 6 6-9-1-4 8-3-9-9-1 8-4z" fill="#3f7d3a"/><ellipse cx="100" cy="116" rx="9" ry="5" fill="#fff" opacity=".25"/></g>
            <g class="ingrediente" style="--d:.6s"><circle cx="290" cy="136" r="31" fill="#f5f1e8"/><ellipse cx="280" cy="126" rx="10" ry="6" fill="#fff"/></g>
            <g class="ingrediente" style="--d:1.2s"><path d="M96 286c22-34 70-30 78 2-24 26-62 26-78-2z" fill="#3f8a3a"/><path d="M98 286c26-6 50-6 74 2" stroke="#2c6a28" stroke-width="2" fill="none"/></g>
            <g class="ingrediente" style="--d:1.8s"><path d="M292 250c14 22 22 34 22 46a22 22 0 0 1-44 0c0-12 8-24 22-46z" fill="#d9b13b"/><ellipse cx="284" cy="294" rx="5" ry="8" fill="#fff" opacity=".35"/></g>
          </g>
          <g class="fx-pizza">
            <circle class="fx-impasto" cx="200" cy="215" r="132" fill="url(#g-impasto)"/>
            <circle class="fx-sugo" cx="200" cy="215" r="104" fill="#b5321f"/>
            <g class="fx-mozz" fill="#f7f3ea"><circle cx="160" cy="185" r="18"/><circle cx="238" cy="178" r="15"/><circle cx="214" cy="244" r="20"/><circle cx="160" cy="250" r="13"/><circle cx="254" cy="232" r="11"/><circle cx="196" cy="206" r="9"/></g>
            <g class="fx-basilico" fill="#2f7a2c"><ellipse cx="190" cy="160" rx="16" ry="8" transform="rotate(-25 190 160)"/><ellipse cx="246" cy="204" rx="15" ry="8" transform="rotate(35 246 204)"/><ellipse cx="176" cy="226" rx="14" ry="7" transform="rotate(10 176 226)"/></g>
            <g class="fx-macchie" fill="#5a3418"><circle cx="86" cy="190" r="5"/><circle cx="92" cy="258" r="4"/><circle cx="122" cy="306" r="6"/><circle cx="196" cy="341" r="4"/><circle cx="270" cy="322" r="6"/><circle cx="318" cy="262" r="4"/><circle cx="326" cy="196" r="6"/><circle cx="296" cy="122" r="4"/><circle cx="236" cy="90" r="6"/><circle cx="160" cy="92" r="5"/><circle cx="112" cy="128" r="4"/></g>
          </g>
        </svg>
        <figcaption id="lab-didascalia" class="laboratorio__didascalia"><span aria-hidden="true">I</span> La materia prima</figcaption>
      </figure>
      <ol class="passi passi--schede">
          <li class="rivela passo attivo" data-fase="1"><span class="num" aria-hidden="true">I</span><h3><button type="button" class="passo__btn" aria-pressed="true">La materia prima</button></h3><p>Solo eccellenze del territorio, selezionate senza compromessi.</p></li>
          <li class="rivela passo" data-fase="2"><span class="num" aria-hidden="true">II</span><h3><button type="button" class="passo__btn" aria-pressed="false">L’impasto</button></h3><p>Disciplinato da tempi di lievitazione rigorosi.</p></li>
          <li class="rivela passo" data-fase="3"><span class="num" aria-hidden="true">III</span><h3><button type="button" class="passo__btn" aria-pressed="false">La forma</button></h3><p>Cornicione contenuto e stesura della verace pizza napoletana.</p></li>
          <li class="rivela passo" data-fase="4"><span class="num" aria-hidden="true">IV</span><h3><button type="button" class="passo__btn" aria-pressed="false">La cottura</button></h3><p>Nel forno a legna, come vuole la tradizione della pizza partenopea.</p></li>
      </ol>
    </div>
  </div>
</section>

<section class="sezione scuro-2" aria-labelledby="titolo-servizi">
  <div class="contenitore">
    <span class="occhiello rivela">Da Picea</span>
    <h2 class="titolo-sezione rivela" id="titolo-servizi">Al tavolo, da asporto <em>o a casa tua</em></h2>
    <p class="intro-sezione rivela">Una delle storiche pizzerie di Pozzuoli, custode di una tradizione della pizza partenopea tramandata di generazione in generazione.</p>
    <ul class="servizi rivela">{servizi}</ul>
    <p class="sottotitolo-piccolo rivela">Pagamenti accettati</p>
    <ul class="pagamenti rivela">{pagamenti}</ul>
  </div>
</section>

<section class="banda" aria-labelledby="titolo-banda">
  {immagine("dettaglio-alto", "", None, "", "banda__foto", w=1600, h=960)}
  <div class="contenitore">
    <span class="occhiello rivela">Prenotazioni</span>
    <h2 class="titolo-sezione rivela" id="titolo-banda">Prenota il tuo tavolo <em>su WhatsApp</em></h2>
    <p class="intro-sezione rivela">Scegli giorno, orario e numero di persone: il messaggio si prepara da solo, tu devi solo inviarlo. Ti rispondiamo noi per confermare.</p>
    <div class="azioni rivela">
      <a class="btn" href="prenota.html">{icona("calendario")}Prenota un tavolo</a>
      <a class="btn btn--vuoto" href="tel:{TEL_L}">{icona("tel")}{e(TEL_V)}</a>
    </div>
    <a class="sigillo" href="prenota.html" aria-label="Prenota su WhatsApp">
      <svg class="sigillo__testo" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="cerchio" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs><text><textPath href="#cerchio" textLength="486" lengthAdjust="spacing">PRENOTA SU WHATSAPP · PRENOTA SU WHATSAPP · </textPath></text></svg>
      <span class="sigillo__centro">{icona("whatsapp")}</span>
    </a>
  </div>
</section>

<section class="sezione chiaro" id="orari" aria-labelledby="titolo-dove">
  <div class="contenitore">
    <div class="centro">
      <span class="occhiello rivela">Orari e indirizzo</span>
      <h2 class="titolo-sezione rivela" id="titolo-dove">Vieni a <em>trovarci</em></h2>
      <div class="rivela" style="margin-top:22px">{stato_html(annuncia=False)}</div>
    </div>
    <div class="rivela">{settimana_html()}</div>
    <div class="dove dove--home">
      <div class="dove__indirizzo rivela">
        <span class="dove__etichetta">Ci trovi qui</span>
        <address class="indirizzo">{via_unita()}<br>{citta_unita()}</address>
        <p class="dove__nota">Nel cuore del centro storico.</p>
        <div class="hero__azioni">{link_esterno(C["maps_link"], "Indicazioni", "btn", "pin")}<a class="btn btn--vuoto" href="contatti.html">Tutti i contatti</a></div>
      </div>
      <div class="rivela" data-ritardo="1">{mappa_html()}</div>
    </div>
  </div>
</section>

<section class="finale" aria-labelledby="titolo-finale">
  <div class="finale__luce" aria-hidden="true"></div>
  <div class="contenitore centro">
    <p class="hero__epigrafe rivela" aria-hidden="true">PVTEOLI · MCMXCVI</p>
    <h2 class="finale__titolo rivela" id="titolo-finale">Ti aspettiamo <em>a tavola</em></h2>
    <p class="intro-sezione rivela" style="margin-inline:auto">{via_unita()}&nbsp;·&nbsp;{e(IND["citta"])}. Prenota su WhatsApp, chiamaci o ordina a domicilio su&nbsp;Glovo.</p>
    <div class="finale__azioni rivela">
      <a class="btn" href="prenota.html">{icona("calendario")}Prenota un tavolo</a>
      <a class="btn btn--vuoto" href="tel:{TEL_L}">{icona("tel")}{e(TEL_V)}</a>
      {bottone_glovo()}
    </div>
  </div>
</section>
"""
    pagina("index.html", f"{C['nome_completo']} · Pizza napoletana a Pozzuoli dal {C['anno_apertura']}",
           "Picea, pizzeria napoletana nel centro storico di Pozzuoli dal 1996: verace pizza napoletana cotta nel forno a legna. Prenota su WhatsApp o ordina su Glovo.",
           corpo, "pagina-home", schema_ristorante())


def storia():
    corpo = f"""
<section class="testata">
  <div class="contenitore">
    <span class="occhiello">Dal {C["anno_apertura"]}</span>
    <h1>La nostra storia</h1>
  </div>
</section>

<section class="sezione chiaro">
  <div class="contenitore storia-testo">
    <div class="capitoli rivela">
      <ol class="capitoli__binario" tabindex="0" aria-label="La storia di Picea, da scorrere">
        <li class="capitolo-card attivo" id="cap-1"><span class="sr-only">Capitolo 1 di 4</span><span class="capitolo-card__num" aria-hidden="true">I</span><p>Nel 1996, Giovanni Vanacore approda a Pozzuoli, una città dove ogni angolo o scavo riporta alla luce la memoria dell’antica Roma e del suo impero: terme, <i lang="la">macellum</i>, ville, anfiteatri. Un luogo che respira archeologia.</p></li>
        <li class="capitolo-card" id="cap-2"><span class="sr-only">Capitolo 2 di 4</span><span class="capitolo-card__num" aria-hidden="true">II</span><p>Tra le fonti, Giovanni incrocia la <i lang="la">Picea abies</i>, un abete rosso: era il combustibile eletto dai romani per alimentare i loro forni pubblici. Una legna vigorosa, che sprigionava calore rapido e un profumo balsamico. Da quella intuizione nasce “Picea”.</p></li>
        <li class="capitolo-card" id="cap-3"><span class="sr-only">Capitolo 3 di 4</span><span class="capitolo-card__num" aria-hidden="true">III</span><p>Pioniere a Pozzuoli della pizza tradizionale napoletana, Giovanni sceglie una caratteristica ben precisa: cornicione contenuto e stesura della verace pizza napoletana, impasto disciplinato da tempi di lievitazione rigorosi. La materia prima? Solo eccellenze del territorio, selezionate senza compromessi.</p></li>
        <li class="capitolo-card" id="cap-4"><span class="sr-only">Capitolo 4 di 4</span><span class="capitolo-card__num" aria-hidden="true">IV</span><p>Diventa così più di una pizzeria: è una continuità. Un dialogo tra la fornace romana e il forno moderno.</p></li>
      </ol>
      <div class="capitoli__comandi">
        <button type="button" class="capitoli__freccia" data-dir="-1" aria-label="Capitolo precedente">{icona("freccia")}</button>
        <div class="capitoli__punti" aria-hidden="true"><span class="attivo"></span><span></span><span></span><span></span></div>
        <button type="button" class="capitoli__freccia" data-dir="1" aria-label="Capitolo successivo">{icona("freccia")}</button>
      </div>
      <p class="capitoli__aiuto">Scorri le schede o usa le frecce</p>
    </div>
    <blockquote class="estratto rivela">
      <p>Dal 1996 ad oggi la filosofia è immutata: rispettare le origini per esaltare i sapori.</p>
    </blockquote>
    <p class="rivela storia-chiusa">Entrare da Picea significa assaporare una pizza, ma anche una stratificazione di storia.</p>
    <div class="hero__azioni rivela" style="margin-top:48px;justify-content:center">
      <a class="btn" href="prenota.html">{icona("calendario")}Prenota un tavolo</a>
      <a class="btn btn--vuoto" href="contatti.html">Contatti</a>
    </div>
  </div>
</section>
"""
    pagina("storia.html", f"La nostra storia · {C['nome_completo']} a Pozzuoli",
           "La storia di Picea, pizzeria napoletana nel centro storico di Pozzuoli dal 1996.",
           corpo)


def prenota():
    pmax = C["prenotazioni"]["persone_max"]
    corpo = f"""
<section class="testata">
  <div class="contenitore">
    <span class="occhiello">Prenotazioni</span>
    <h1>Prenota un tavolo</h1>
    <p>Compila i campi e premi il pulsante: si apre WhatsApp con il messaggio già pronto da inviare a Picea. La prenotazione è confermata quando ti rispondiamo.</p>
  </div>
</section>
<section class="sezione chiaro">
  <div class="contenitore layout-prenota">
    <div class="scheda rivela">
      <noscript><p class="nota-modulo">Per prenotare scrivici su WhatsApp al {e(WA_V)} oppure chiamaci allo {e(TEL_V)}.</p></noscript>
      <form class="modulo" id="modulo-prenota" novalidate>
        <p class="errore" id="p-errore" role="alert"></p>
        <div class="campo">
          <label for="p-nome">Nome</label>
          <input id="p-nome" name="nome" type="text" autocomplete="name" required>
        </div>
        <div class="riga-campi">
          <div class="campo">
            <label for="p-data">Giorno</label>
            <input id="p-data" name="data" type="date" required>
          </div>
          <div class="campo">
            <label for="p-ora">Orario</label>
            <select id="p-ora" name="ora" required><option value="">Scegli prima il giorno</option></select>
          </div>
        </div>
        <div class="campo">
          <label for="p-persone">Persone</label>
          <div class="persone">
            <button type="button" data-persone="-1" aria-label="Una persona in meno">−</button>
            <input id="p-persone" name="persone" type="number" inputmode="numeric" min="1" max="{pmax}" value="2" required>
            <button type="button" data-persone="1" aria-label="Una persona in più">+</button>
          </div>
          <span class="aiuto">Per gruppi numerosi o eventi privati, chiamaci.</span>
        </div>
        <div class="campo">
          <label for="p-note">Note <span class="facoltativo">(facoltative)</span></label>
          <textarea id="p-note" name="note" placeholder="Tavolo all’aperto, una ricorrenza…"></textarea>
        </div>
        <button class="btn" type="submit">{icona("whatsapp")}Invia la richiesta su WhatsApp</button>
        <p class="nota-modulo">Il sito non salva i tuoi dati: vengono solo inseriti nel messaggio che invii tu. <a href="privacy.html">Privacy</a></p>
        <p class="nota-modulo" id="p-inviato" tabindex="-1" hidden><strong>Ora tocca a te:</strong> nella chat di WhatsApp che si è aperta premi invia. Ti rispondiamo per confermare il tavolo.</p>
        <p class="nota-modulo" id="p-wa" hidden><a class="btn" id="p-wa-link" href="https://wa.me/{WA_N}" target="_blank" rel="noopener">{icona("whatsapp")}Apri WhatsApp con il messaggio{NUOVA_SCHEDA}</a><br>WhatsApp non si è aperto? Usa il pulsante qui sopra.</p>
      </form>
    </div>
    <aside class="lato rivela" data-ritardo="1">
      <div class="biglietto" id="biglietto">
        <div class="biglietto__testa"><span>Picea</span><small>Richiesta di prenotazione</small></div>
        <dl class="biglietto__dati">
          <div><dt>Nome</dt><dd data-b="nome">—</dd></div>
          <div><dt>Giorno</dt><dd data-b="data">—</dd></div>
          <div><dt>Orario</dt><dd data-b="ora">—</dd></div>
          <div><dt>Persone</dt><dd data-b="persone">2</dd></div>
        </dl>
        <div class="biglietto__piede"><span>{via_unita()}<br>{e(IND["citta"])}</span><span class="biglietto__timbro" aria-hidden="true">Pronta</span></div>
      </div>
      <h2>Orari</h2>
      {tabella_orari()}
      <div class="alternativa">
        <small>Preferisci chiamare?</small>
        <a href="tel:{TEL_L}">{e(TEL_V)}</a>
      </div>
    </aside>
  </div>
</section>
"""
    pagina("prenota.html", f"Prenota un tavolo · {C['nome_completo']} a Pozzuoli",
           "Prenota il tuo tavolo da Picea a Pozzuoli: scegli giorno, orario e persone e invia la richiesta su WhatsApp.", corpo)


def contatti():
    wa = (f'<a class="canale" href="https://wa.me/{WA_N}" target="_blank" rel="noopener">{icona("whatsapp")}'
          f'<div><small>WhatsApp</small><span>{e(WA_V)}</span></div>{NUOVA_SCHEDA}</a>') if WA_N else ""
    corpo = f"""
<section class="testata">
  <div class="contenitore">
    <span class="occhiello">Contatti</span>
    <h1>Vieni a trovarci</h1>
    <p>Siamo nel centro storico di Pozzuoli, in {via_unita()}.</p>
  </div>
</section>
<section class="sezione chiaro">
  <div class="contenitore layout-contatti">
    <div>
      <div class="canali rivela">
        <a class="canale" href="tel:{TEL_L}">{icona("tel")}<div><small>Telefono</small><span>{e(TEL_V)}</span></div></a>
        {wa}
        <a class="canale" href="mailto:{e(C["email"])}">{icona("email")}<div><small>Email</small><span>{e(C["email"]).replace("@", "@<wbr>")}</span></div></a>
        <a class="canale" href="{e(C["maps_link"])}" target="_blank" rel="noopener">{icona("pin")}<div><small>Indirizzo</small><span>{via_unita()}<br>{citta_unita()}</span></div>{NUOVA_SCHEDA}</a>
      </div>
      <h2 class="titolo-sezione rivela" style="font-size:2rem;margin-top:48px">Orari</h2>
      <div class="rivela">{tabella_orari()}</div>
    </div>
    <div>
      <div class="rivela">{mappa_html()}</div>
      <div class="scheda rivela" style="margin-top:32px">
        <h2 style="font-size:1.8rem;margin-bottom:6px">Scrivici</h2>
        <p class="nota-modulo" style="margin-bottom:20px">Il messaggio si apre nella tua app di posta, pronto da inviare a {e(C["email"])}.</p>
        <noscript><p class="nota-modulo">Scrivici a <a href="mailto:{e(C["email"])}">{e(C["email"])}</a> oppure chiamaci allo {e(TEL_V)}.</p></noscript>
        <form class="modulo" id="modulo-contatti" novalidate>
          <p class="errore" id="c-errore" role="alert"></p>
          <div class="riga-campi">
            <div class="campo"><label for="c-nome">Nome</label><input id="c-nome" type="text" autocomplete="name" required></div>
            <div class="campo"><label for="c-telefono">Telefono <span class="facoltativo">(facoltativo)</span></label><input id="c-telefono" type="tel" autocomplete="tel"></div>
          </div>
          <div class="campo"><label for="c-messaggio">Messaggio</label><textarea id="c-messaggio" required></textarea></div>
          <p class="nota-modulo" id="c-stato" role="status" hidden>Si sta aprendo la tua app di posta con il messaggio pronto. Se non si apre, scrivici a <a href="mailto:{e(C["email"])}">{e(C["email"])}</a> oppure chiamaci al {e(TEL_V)}.</p>
          <button class="btn" type="submit">{icona("email")}Scrivi l’email</button>
          <p class="nota-modulo">Il sito non salva i tuoi dati. <a href="privacy.html">Privacy</a></p>
        </form>
      </div>
    </div>
  </div>
</section>
"""
    pagina("contatti.html", f"Contatti e orari · {C['nome_completo']} a Pozzuoli",
           f"Picea, {INDIRIZZO_RIGA}. Telefono {TEL_V}. Orari, indicazioni stradali e contatti.", corpo,
           extra_head=schema_ristorante())


def data_estesa(iso):
    d = datetime.date.fromisoformat(iso)
    mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
    return f"{d.day} {mesi[d.month - 1]} {d.year}"


def privacy():
    L = C["legale"]
    titolare = e(L["ragione_sociale"] or L["titolare"])
    ident = []
    if L["partita_iva"]:
        ident.append(f"<dt>Partita IVA</dt><dd>{e(L['partita_iva'])}</dd>")
    if L["codice_fiscale"] and L["codice_fiscale"] != L["partita_iva"]:
        ident.append(f"<dt>Codice fiscale</dt><dd>{e(L['codice_fiscale'])}</dd>")
    sede = e(L["sede_legale"] or INDIRIZZO_RIGA)
    nota_logo = ("\n    <p>Il logo viene caricato da un server esterno (DISH Digital Solutions), che può ricevere l’indirizzo IP del visitatore.</p>"
                 if C["logo_url"].startswith("http") else "")
    corpo = f"""
<section class="testata">
  <div class="contenitore">
    <span class="occhiello">Informativa</span>
    <h1>Privacy</h1>
    <p>Come questo sito tratta i dati di chi lo visita (Regolamento UE 2016/679, “GDPR”).</p>
  </div>
</section>
<section class="sezione chiaro">
  <div class="contenitore stretto legale-testo">
    <h2>Titolare del trattamento</h2>
    <dl>
      <dt>Titolare</dt><dd>{titolare}</dd>
      <dt>Indirizzo</dt><dd>{sede}</dd>
      {"".join(ident)}
      <dt>Email</dt><dd><a href="mailto:{e(C["email"])}">{e(C["email"])}</a></dd>
      <dt>Telefono</dt><dd><a href="tel:{TEL_L}">{e(TEL_V)}</a></dd>
    </dl>

    <h2>Cookie e statistiche</h2>
    <p>Questo sito non usa cookie né strumenti di statistica o pubblicità. I caratteri tipografici sono ospitati sul sito stesso.</p>{nota_logo}

    <h2>Prenotazioni e messaggi</h2>
    <p>I moduli “Prenota” e “Scrivici” non salvano dati sul sito. Servono solo a preparare un messaggio (con nome, giorno, orario, numero di persone, note o testo del messaggio) che invii tu tramite WhatsApp o la tua app di posta elettronica. Riceviamo questi dati soltanto se scegli di inviare il messaggio e li usiamo esclusivamente per rispondere alla tua richiesta e gestire la prenotazione (art. 6, par. 1, lett. b del GDPR). Li conserviamo per il tempo necessario a questo scopo.</p>
    <p>L’invio tramite WhatsApp o email avviene attraverso i servizi di Meta (WhatsApp) e del tuo fornitore di posta, secondo le rispettive informative.</p>

    <h2>Mappa</h2>
    <p>La mappa di Google si carica solo se premi “Mostra la mappa”. Da quel momento Google può raccogliere dati e usare cookie secondo la propria {link_esterno("https://policies.google.com/privacy?hl=it", "informativa sulla privacy")}.</p>

    <h2>Link ad altri siti</h2>
    <p>I collegamenti a Glovo, Instagram, Facebook e Google Maps portano a siti esterni, che trattano i dati secondo le proprie informative.</p>

    <h2>Dati di navigazione</h2>
    <p>Il servizio che ospita il sito può registrare automaticamente dati tecnici (come indirizzo IP, data e ora della visita) per garantirne il funzionamento e la sicurezza.</p>

    <h2>I tuoi diritti</h2>
    <p>Puoi chiedere in qualsiasi momento l’accesso, la rettifica o la cancellazione dei tuoi dati e la limitazione del trattamento, oppure opporti al trattamento, scrivendo a <a href="mailto:{e(C["email"])}">{e(C["email"])}</a> (artt. 15–22 GDPR). Puoi anche presentare reclamo al {link_esterno("https://www.garanteprivacy.it", "Garante per la protezione dei dati personali")}.</p>

    <p style="margin-top:40px;color:var(--grigio-scuro)">Ultimo aggiornamento: {data_estesa(C["privacy_aggiornata"])}.</p>
  </div>
</section>
"""
    pagina("privacy.html", f"Privacy · {C['nome_completo']}", "Informativa sulla privacy del sito di Picea, pizzeria a Pozzuoli.", corpo)


def non_trovata():
    corpo = f"""
<section class="vuoto">
  <div>
    <span class="occhiello">Errore 404</span>
    <h1>Pagina non trovata</h1>
    <p>La pagina che cerchi non esiste o è stata spostata.</p>
    <div class="hero__azioni" style="justify-content:center;margin-top:28px">
      <a class="btn" href="index.html">Torna alla home</a>
      <a class="btn btn--vuoto" href="contatti.html">Contatti</a>
    </div>
  </div>
</section>"""
    pagina("404.html", f"Pagina non trovata · {C['nome_completo']}", "Pagina non trovata.", corpo)


def extra():
    url = C["sito_url"].rstrip("/")
    robots = "User-agent: *\nAllow: /\n"
    if url:
        robots += f"\nSitemap: {url}/sitemap.xml\n"
        voci = "".join(f"  <url><loc>{url}/{'' if p == 'index.html' else p}</loc><lastmod>{OGGI.isoformat()}</lastmod></url>\n"
                       for p in ["index.html", "storia.html", "prenota.html", "contatti.html", "privacy.html"])
        with open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8") as f:
            f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{voci}</urlset>\n')
        print("scritta sitemap.xml")
    elif os.path.exists(os.path.join(OUT, "sitemap.xml")):
        os.remove(os.path.join(OUT, "sitemap.xml"))
    with open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(robots)
    print("scritto robots.txt")


if __name__ == "__main__":
    home()
    storia()
    prenota()
    contatti()
    privacy()
    non_trovata()
    extra()
