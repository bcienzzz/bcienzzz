/* Picea – script del sito. I dati (orari, numeri) arrivano da window.PICEA,
   generato da sorgente/config.json. */
(function () {
  "use strict";
  var D = window.PICEA || {};
  var GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

  /* ---------- Utilità orari (fuso orario di Pozzuoli) ---------- */
  function minuti(hhmm) { var p = hhmm.split(":"); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function hhmm(min) { min = ((min % 1440) + 1440) % 1440; var h = Math.floor(min / 60), m = min % 60; return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m; }
  // Fasce del giorno in minuti; la chiusura dopo mezzanotte diventa > 1440.
  function fasce(giorno) {
    var f = (D.orari && D.orari[String(giorno)]) || [];
    return f.map(function (x) { var a = minuti(x[0]), c = minuti(x[1]); if (c <= a) c += 1440; return [a, c]; });
  }
  function adessoRoma() {
    try {
      var parti = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
      var v = {}; parti.forEach(function (p) { v[p.type] = p.value; });
      var g = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[v.weekday];
      if (g === undefined) return null;
      return { giorno: g, minuti: (parseInt(v.hour, 10) % 24) * 60 + parseInt(v.minute, 10), data: v.year + "-" + v.month + "-" + v.day };
    } catch (e) { return null; }
  }
  function statoApertura(a) {
    var ieri = (a.giorno + 6) % 7, chiude = null;
    fasce(a.giorno).forEach(function (f) { if (a.minuti >= f[0] && a.minuti < f[1]) chiude = f[1]; });
    fasce(ieri).forEach(function (f) { if (f[1] > 1440 && a.minuti + 1440 >= f[0] && a.minuti + 1440 < f[1]) chiude = f[1] - 1440; });
    if (chiude !== null) return { aperto: true, chiude: chiude };
    for (var d = 0; d < 8; d++) {
      var g = (a.giorno + d) % 7, ff = fasce(g);
      for (var i = 0; i < ff.length; i++) if (d > 0 || ff[i][0] > a.minuti) return { aperto: false, giorni: d, giorno: g, apre: ff[i][0] };
    }
    return null;
  }

  var adesso = adessoRoma();

  /* ---------- Stato "aperto ora" ---------- */
  function aggiornaStato() {
    adesso = adessoRoma();
    if (!adesso) return;
    var s = statoApertura(adesso);
    if (!s) return;
    var testo;
    if (s.aperto) testo = "<strong>Aperto ora</strong> · chiude " + (s.chiude % 1440 === 0 ? "a mezzanotte" : "alle " + hhmm(s.chiude));
    else testo = "<strong>Ora chiuso</strong> · apre " + (s.giorni === 0 ? "oggi" : s.giorni === 1 ? "domani" : GIORNI[s.giorno]) + " alle " + hhmm(s.apre);
    document.querySelectorAll("[data-stato]").forEach(function (el) {
      var t = el.querySelector("[data-stato-testo]");
      if (t && t.innerHTML !== testo) t.innerHTML = testo;
      el.classList.toggle("aperto", s.aperto);
      el.hidden = false;
    });
    // Dopo mezzanotte, finché è aperta la fascia della sera prima, "oggi" è ancora quella giornata.
    var giornoServizio = adesso.giorno;
    if (s.aperto && fasce(adesso.giorno).every(function (f) { return adesso.minuti < f[0]; })) giornoServizio = (adesso.giorno + 6) % 7;
    document.querySelectorAll("[data-oggi-orari]").forEach(function (el) {
      var f = fasce(giornoServizio);
      // ogni fascia oraria resta su una riga sola
      el.innerHTML = f.length ? f.map(function (x) { return '<span class="fascia">' + hhmm(x[0]) + "–" + hhmm(x[1]) + "</span>"; }).join(" · ") : "Chiuso";
    });
    document.querySelectorAll("[data-giorni]").forEach(function (riga) {
      var oggi = riga.getAttribute("data-giorni").split(",").indexOf(String(giornoServizio)) !== -1;
      riga.classList.toggle("oggi", oggi);
      var b = riga.querySelector(".badge-oggi");
      if (b) b.hidden = !oggi;
    });
  }
  aggiornaStato();
  setInterval(aggiornaStato, 60000);

  /* ---------- Header e menu mobile ---------- */
  var header = document.querySelector(".header");
  var burger = document.querySelector(".burger");
  var menu = document.getElementById("menu-mobile");
  function scroll() { if (header) header.classList.toggle("solido", window.scrollY > 30 || (menu && menu.classList.contains("aperto"))); }
  function apriMenu(si) {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", String(si));
    burger.setAttribute("aria-label", si ? "Chiudi il menu" : "Apri il menu");
    menu.classList.toggle("aperto", si);
    if ("inert" in menu) menu.inert = !si;
    document.querySelectorAll("main, footer").forEach(function (el) { if ("inert" in el) el.inert = si; });
    document.body.style.overflow = si ? "hidden" : "";
    scroll();
  }
  if (burger && menu) {
    if ("inert" in menu) menu.inert = true;
    burger.addEventListener("click", function () { apriMenu(burger.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) apriMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("aperto")) { apriMenu(false); burger.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1024 && menu.classList.contains("aperto")) apriMenu(false); });
  }
  window.addEventListener("scroll", scroll, { passive: true });
  scroll();

  /* ---------- Animazioni in entrata (solo per ciò che è sotto la piega) ---------- */
  var rivela = Array.prototype.slice.call(document.querySelectorAll(".rivela"));
  var ridotto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !ridotto) {
    var io = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) { v.target.classList.add("visto"); io.unobserve(v.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    var inAttesaRivela = rivela.filter(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.94) { el.classList.add("visto"); return false; }
      io.observe(el); return true;
    });
    // Rete di sicurezza: con uno scorrimento velocissimo (o un salto dal menu delle categorie)
    // un elemento può passare sullo schermo tra due controlli; ciò che è già sopra si mostra comunque.
    var attesaControllo = false;
    window.addEventListener("scroll", function () {
      if (attesaControllo || !inAttesaRivela.length) return;
      attesaControllo = true;
      setTimeout(function () {
        attesaControllo = false;
        inAttesaRivela = inAttesaRivela.filter(function (el) {
          if (el.classList.contains("visto")) return false;
          if (el.getBoundingClientRect().top < window.innerHeight * 0.94) { el.classList.add("visto"); io.unobserve(el); return false; }
          return true;
        });
      }, 150);
    }, { passive: true });
  } else rivela.forEach(function (el) { el.classList.add("visto"); });

  /* ---------- Mappa: si carica solo al clic (niente cookie di Google prima) ---------- */
  document.querySelectorAll("[data-carica-mappa]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = btn.closest(".mappa"), testo = box.querySelector(".mappa__copertina p");
      // Nell'anteprima a file unico i visualizzatori bloccano le pagine esterne: niente riquadro bianco.
      if (document.documentElement.hasAttribute("data-anteprima")) {
        testo.textContent = "Nell’anteprima la mappa interattiva non si può caricare: sul sito online compare qui. Intanto puoi aprirla in Google Maps.";
        btn.remove(); return;
      }
      var esterno = box.querySelector('a[href*="google.com/maps"]');
      esterno = esterno ? esterno.cloneNode(true) : null;
      box.style.minHeight = box.offsetHeight + "px"; // la mappa prende esattamente il posto della copertina
      var f = document.createElement("iframe");
      f.src = D.mapsEmbed; f.title = "Mappa: " + (D.indirizzo || "Picea"); f.loading = "eager";
      f.referrerPolicy = "no-referrer-when-downgrade"; f.allowFullscreen = true;
      f.addEventListener("load", function () { f.classList.add("pronta"); });
      box.innerHTML = '<p class="mappa__carica" aria-hidden="true">Caricamento della mappa…</p>';
      box.appendChild(f);
      if (esterno) { esterno.className = "btn mappa__esterna"; box.appendChild(esterno); }
      box.classList.add("caricata");
      f.focus();
    });
  });

  /* ---------- Prenotazione via WhatsApp ---------- */
  var fp = document.getElementById("modulo-prenota");
  if (fp) {
    var cData = fp.querySelector("#p-data"), cOra = fp.querySelector("#p-ora"), cPers = fp.querySelector("#p-persone");
    var cNome = fp.querySelector("#p-nome"), cNote = fp.querySelector("#p-note"), erroreP = fp.querySelector("#p-errore");
    var cfg = D.prenotazioni || { intervallo: 30, margine: 30, personeMax: 20 };

    function dataLocale(iso) { var p = iso.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
    function isoDa(d) { return d.toISOString().slice(0, 10); }
    function giornoSett(iso) { return dataLocale(iso).getUTCDay(); }
    function dataEstesa(iso) { var d = dataLocale(iso); return GIORNI[d.getUTCDay()] + " " + d.getUTCDate() + " " + MESI[d.getUTCMonth()] + " " + d.getUTCFullYear(); }

    function orariDisponibili(iso) {
      var g = giornoSett(iso), lista = [];
      fasce(g).forEach(function (f) {
        // Le prenotazioni si fermano a mezzanotte, così giorno e ora del messaggio non sono ambigui.
        var ultimo = Math.min(f[1], 1440) - cfg.margine;
        for (var m = f[0]; m <= ultimo; m += cfg.intervallo) lista.push(m);
      });
      if (adesso && iso === adesso.data) lista = lista.filter(function (m) { return m > adesso.minuti + 15; });
      return lista;
    }
    function riempiOrari() {
      var scelto = cOra.value;
      cOra.innerHTML = "";
      if (!cData.value) { cOra.appendChild(new Option("Scegli prima il giorno", "")); cOra.disabled = true; return; }
      var lista = orariDisponibili(cData.value);
      if (!lista.length) {
        var g = giornoSett(cData.value);
        cOra.appendChild(new Option(!fasce(g).length ? "Il " + GIORNI[g] + " siamo chiusi" : adesso && cData.value === adesso.data ? "Per oggi non ci sono più orari disponibili" : "Nessun orario disponibile in questo giorno", ""));
        cOra.disabled = true; return;
      }
      cOra.disabled = false;
      cOra.appendChild(new Option("Scegli l’orario", ""));
      var pranzo = document.createElement("optgroup"); pranzo.label = "Pranzo";
      var cena = document.createElement("optgroup"); cena.label = "Cena";
      lista.forEach(function (m) {
        var o = new Option(hhmm(m), hhmm(m));
        (m < 17 * 60 ? pranzo : cena).appendChild(o);
      });
      if (pranzo.children.length) cOra.appendChild(pranzo);
      if (cena.children.length) cOra.appendChild(cena);
      if (scelto && Array.prototype.some.call(cOra.options, function (o) { return o.value === scelto; })) cOra.value = scelto;
    }
    var oggiIso = adesso ? adesso.data : isoDa(new Date());
    cData.min = oggiIso;
    var max = dataLocale(oggiIso); max.setUTCDate(max.getUTCDate() + 90); cData.max = isoDa(max);
    cData.addEventListener("change", riempiOrari);
    riempiOrari();

    // Se dopo l'invio si cambia qualcosa, il pulsante di riserva non deve aprire WhatsApp con i dati vecchi.
    var big = document.getElementById("biglietto");
    function invalidaInvio() {
      ["p-inviato"].forEach(function (id) { var el = document.getElementById(id); if (el) el.hidden = true; });
    }
    fp.addEventListener("input", invalidaInvio);
    fp.addEventListener("change", invalidaInvio);

    fp.querySelectorAll("[data-persone]").forEach(function (b) {
      b.addEventListener("click", function () {
        invalidaInvio();
        var n = parseInt(cPers.value, 10);
        if (!(n >= 1)) { cPers.value = 1; return; }
        n = Math.min(cfg.personeMax, Math.max(1, n + parseInt(b.getAttribute("data-persone"), 10)));
        cPers.value = n;
      });
    });

    function elenco(a) { return a.length > 1 ? a.slice(0, -1).join(", ") + " e " + a[a.length - 1] : a[0]; }

    // Il pulsante è un vero link a WhatsApp: al tocco si apre la chat (niente aperture automatiche
    // che browser e app bloccano). Qui si controllano i dati e si scrive il messaggio nel link.
    var invia = document.getElementById("p-invia");
    function preparaInvio() {
      var ok = document.getElementById("p-inviato");
      if (ok) ok.hidden = true;
      // Se la pagina è rimasta aperta a lungo, aggiorna data e orari disponibili prima di controllare.
      var ora = adessoRoma(), oraScelta = cOra.value;
      if (ora) { adesso = ora; cData.min = ora.data; riempiOrari(); cOra.dispatchEvent(new Event("change", { bubbles: true })); }
      var problemi = [], fuori = [];
      [cNome, cData, cOra, cPers].forEach(function (c) { c.removeAttribute("aria-invalid"); });
      if (!cNome.value.trim()) { problemi.push("il nome"); cNome.setAttribute("aria-invalid", "true"); }
      if (!cData.value) { problemi.push("il giorno"); cData.setAttribute("aria-invalid", "true"); }
      else if (cData.value < cData.min || cData.value > cData.max) { fuori.push("Scegli un giorno entro i prossimi tre mesi."); cData.setAttribute("aria-invalid", "true"); }
      else if (cOra.disabled) { fuori.push(cOra.options[0].text + ": scegli un altro giorno."); cData.setAttribute("aria-invalid", "true"); }
      else if (!cOra.value && oraScelta) { fuori.push("L’orario " + oraScelta + " non è più disponibile: scegline un altro."); cOra.setAttribute("aria-invalid", "true"); }
      if (cData.value && !cOra.disabled && !cOra.value && !oraScelta) { problemi.push("l’orario"); cOra.setAttribute("aria-invalid", "true"); }
      var n = /^\d+$/.test(cPers.value.trim()) ? parseInt(cPers.value, 10) : NaN;
      if (!cPers.value.trim()) { problemi.push("il numero di persone"); cPers.setAttribute("aria-invalid", "true"); }
      else if (!(n >= 1 && n <= cfg.personeMax)) { fuori.push("Il numero di persone deve essere da 1 a " + cfg.personeMax + "."); cPers.setAttribute("aria-invalid", "true"); }
      if (problemi.length || fuori.length) {
        var msg = problemi.length ? (problemi.length > 1 ? "Mancano " : "Manca ") + elenco(problemi) + "." : "";
        erroreP.textContent = (msg + " " + fuori.join(" ")).trim();
        var primo = fp.querySelector('[aria-invalid="true"]'); if (primo) primo.focus();
        erroreP.scrollIntoView({ block: "nearest" }); // il messaggio non resta nascosto sotto l'header
        return null;
      }
      erroreP.textContent = "";
      return linkMessaggio();
    }
    // Il messaggio viene scritto nel link a ogni modifica del modulo: così anche le app e i
    // visualizzatori che leggono il link prima del tocco aprono la chat con il testo già pronto.
    function linkMessaggio() {
      var righe = ["Ciao Picea! Vorrei prenotare un tavolo.", ""];
      if (cNome.value.trim()) righe.push("Nome: " + cNome.value.trim());
      if (cData.value) righe.push("Giorno: " + dataEstesa(cData.value));
      if (cOra.value) righe.push("Orario: " + cOra.value);
      if (cPers.value.trim()) righe.push("Persone: " + cPers.value.trim());
      if (cNote.value.trim()) righe.push("Note: " + cNote.value.trim());
      righe.push("", "Attendo la vostra conferma. Grazie!");
      return "https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(righe.join("\n"));
    }
    function aggiornaLink() { invia.href = linkMessaggio(); }
    fp.addEventListener("input", aggiornaLink);
    fp.addEventListener("change", aggiornaLink);
    fp.querySelectorAll("[data-persone]").forEach(function (b) { b.addEventListener("click", function () { setTimeout(aggiornaLink, 0); }); });
    aggiornaLink();
    function inviato() {
      var ok = document.getElementById("p-inviato");
      setTimeout(function () { if (ok) { ok.hidden = false; ok.focus({ preventScroll: true }); } if (big) big.classList.add("pronto"); }, 0);
    }
    invia.addEventListener("click", function (e) {
      var url = preparaInvio();
      if (!url) { e.preventDefault(); return; }
      invia.href = url; // il browser apre questo indirizzo subito dopo: è un tocco vero, non un'apertura automatica
      inviato();
    });
    // Invio dalla tastiera dentro un campo: stesso controllo, poi si apre la chat
    fp.addEventListener("submit", function (e) {
      e.preventDefault();
      var url = preparaInvio();
      if (!url) return;
      invia.href = url;
      var w = null;
      try { w = window.open(url, "_blank", "noopener"); } catch (err) {}
      if (!w) invia.focus(); // se il browser blocca la finestra, il pulsante è già pronto da toccare
      inviato();
    });
  }

  /* ---------- Modulo contatti: apre l'email già scritta ---------- */
  var fc = document.getElementById("modulo-contatti");
  if (fc) {
    fc.addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = fc.querySelector("#c-nome"), msg = fc.querySelector("#c-messaggio"), tel = fc.querySelector("#c-telefono"), err = fc.querySelector("#c-errore");
      [nome, msg].forEach(function (c) { c.removeAttribute("aria-invalid"); });
      var manca = [];
      if (!nome.value.trim()) { manca.push("il nome"); nome.setAttribute("aria-invalid", "true"); }
      if (!msg.value.trim()) { manca.push("il messaggio"); msg.setAttribute("aria-invalid", "true"); }
      var stato = fc.querySelector("#c-stato");
      if (stato) stato.hidden = true;
      if (manca.length) {
        err.textContent = (manca.length > 1 ? "Mancano " : "Manca ") + manca.join(" e ") + ".";
        fc.querySelector('[aria-invalid="true"]').focus();
        err.scrollIntoView({ block: "nearest" });
        return;
      }
      err.textContent = "";
      var corpo = msg.value.trim() + "\n\n— " + nome.value.trim() + (tel.value.trim() ? "\nTelefono: " + tel.value.trim() : "");
      window.location.href = "mailto:" + D.email + "?subject=" + encodeURIComponent("Messaggio dal sito – " + nome.value.trim()) + "&body=" + encodeURIComponent(corpo);
      if (stato) stato.hidden = false;
    });
  }

  /* ---------- Hero: braci che salgono dal forno e leggero parallasse ---------- */
  var hero = document.querySelector(".hero");
  if (hero && !ridotto) {
    var cv = document.createElement("canvas");
    cv.className = "braci"; cv.setAttribute("aria-hidden", "true");
    hero.insertBefore(cv, hero.querySelector(".contenitore"));
    var cx = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, braci = [], visibile = true, raf = 0;
    function misura() {
      if (hero.clientWidth === W && hero.clientHeight === H) return;
      W = hero.clientWidth; H = hero.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // Una brace disegnata una volta sola e poi riusata (più leggero di un gradiente per ogni brace a ogni fotogramma).
    var sprite = document.createElement("canvas"); sprite.width = sprite.height = 64;
    var sx = sprite.getContext("2d"), sg = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0, "rgba(255, 196, 120, 1)"); sg.addColorStop(.4, "rgba(232, 128, 48, .55)"); sg.addColorStop(1, "rgba(232, 128, 48, 0)");
    sx.fillStyle = sg; sx.fillRect(0, 0, 64, 64);
    function nuova(iniziale) {
      return { x: Math.random() * W, y: iniziale ? Math.random() * H : H + 10, r: .6 + Math.random() * 1.8,
        v: .25 + Math.random() * .7, o: Math.random() * Math.PI * 2, a: .35 + Math.random() * .5, vita: 0 };
    }
    misura();
    hero.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a, button")) return;
      var r = hero.getBoundingClientRect();
      for (var k = 0; k < 22; k++) {
        var b = nuova(false); b.x = e.clientX - r.left; b.y = e.clientY - r.top;
        b.v = 1 + Math.random() * 2.2; b.vx = (Math.random() - .5) * 3; b.a = .9; b.vita = 60; b.scintilla = true;
        braci.push(b);
      }
    });
    var n = Math.round(Math.min(46, W / 28));
    for (var i = 0; i < n; i++) braci.push(nuova(true));
    window.addEventListener("resize", misura);
    function anima() {
      raf = 0;
      if (!visibile || document.hidden) return;
      cx.clearRect(0, 0, W, H);
      for (var k = braci.length - 1; k >= 0; k--) {
        var b = braci[k];
        b.y -= b.v; b.o += .02; b.x += Math.sin(b.o) * .35 + (b.vx || 0); b.vita++;
        if (b.scintilla) { b.vx *= .96; b.v *= .985; b.a *= .985; if (b.a < .05) { braci.splice(k, 1); continue; } }
        var alfa = b.a * Math.min(1, b.vita / 60) * Math.max(0, b.y / H);
        if (b.y < -10 || alfa <= 0.01 && b.vita > 60) { if (b.scintilla) braci.splice(k, 1); else braci[k] = nuova(false); continue; }
        cx.globalAlpha = alfa;
        cx.drawImage(sprite, b.x - b.r * 4, b.y - b.r * 4, b.r * 8, b.r * 8);
      }
      cx.globalAlpha = 1;
      raf = requestAnimationFrame(anima);
    }
    function avvia() { if (!raf && visibile && !document.hidden) raf = requestAnimationFrame(anima); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (v) { visibile = v[0].isIntersecting; avvia(); }).observe(hero);
    document.addEventListener("visibilitychange", avvia);
    avvia();
    var heroImg = hero.querySelector(".hero__foto img"), bandaImg = document.querySelector(".banda__foto img"), banda = document.querySelector(".banda");
    var inAttesa = false;
    window.addEventListener("scroll", function () {
      if (inAttesa) return; inAttesa = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (heroImg && y < hero.offsetHeight) heroImg.style.transform = "translate3d(0," + (y * .25).toFixed(1) + "px,0) scale(1.04)";
        if (bandaImg && banda) {
          var r = banda.getBoundingClientRect();
          if (r.bottom > 0 && r.top < window.innerHeight) {
            var lim = banda.offsetHeight * .07, t = Math.max(-lim, Math.min(lim, (r.top - window.innerHeight / 2) * -.12));
            bandaImg.style.transform = "translate3d(0," + t.toFixed(1) + "px,0) scale(1.15)";
          }
        }
        inAttesa = false;
      });
    }, { passive: true });
  }

  /* ---------- Laboratorio della pizza: le fasi seguono lo scorrimento o il tocco ---------- */
  var lab = document.querySelector(".laboratorio__svg");
  if (lab) {
    var passi = Array.prototype.slice.call(document.querySelectorAll(".passo"));
    var didascalia = document.getElementById("lab-didascalia");
    var ROMANI = ["I", "II", "III", "IV"];
    var bloccoFinoA = 0, faseAttiva = 0;
    function fase(n) {
      if (faseAttiva === n) return;
      faseAttiva = n;
      lab.setAttribute("data-fase", n);
      passi.forEach(function (p) {
        var on = p.getAttribute("data-fase") === String(n), btn = p.querySelector(".passo__btn");
        p.classList.toggle("attivo", on);
        if (btn) btn.setAttribute("aria-pressed", String(on));
      });
      var t = passi[n - 1] && passi[n - 1].querySelector("h3");
      if (didascalia && t) didascalia.innerHTML = '<span aria-hidden="true">' + ROMANI[n - 1] + "</span> " + t.textContent;
    }
    // Il pulsante nel titolo gestisce tastiera e lettori di schermo; il clic su tutta la scheda arriva qui.
    passi.forEach(function (p) {
      p.addEventListener("click", function () { bloccoFinoA = Date.now() + 1200; fase(+p.getAttribute("data-fase")); });
    });
    if ("IntersectionObserver" in window) {
      // Sul telefono in verticale la scena occupa la metà alta dello schermo: la fase attiva è
      // quella della scheda che si legge sotto la scena, non quella che le sta passando dietro.
      var verticale = window.matchMedia("(max-width: 899px) and (orientation: portrait)"), ioLab;
      function osserva() {
        if (ioLab) ioLab.disconnect();
        ioLab = new IntersectionObserver(function (voci) {
          if (Date.now() < bloccoFinoA) return;
          voci.forEach(function (v) { if (v.isIntersecting) fase(+v.target.getAttribute("data-fase")); });
        }, { rootMargin: verticale.matches ? "-68% 0px -28% 0px" : "-48% 0px -48% 0px" });
        passi.forEach(function (p) { ioLab.observe(p); });
      }
      osserva();
      if (verticale.addEventListener) verticale.addEventListener("change", osserva);
    }
    fase(1);
  }

  /* ---------- Servizi: luce che segue il puntatore ---------- */
  document.querySelectorAll(".servizi li").forEach(function (li) {
    li.addEventListener("pointermove", function (e) {
      var r = li.getBoundingClientRect();
      li.style.setProperty("--x", (e.clientX - r.left) + "px"); li.style.setProperty("--y", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Biglietto di prenotazione che si compone mentre scrivi ---------- */
  var big = document.getElementById("biglietto");
  if (big && fp) {
    function mostra(chiave, valore) {
      var dd = big.querySelector('[data-b="' + chiave + '"]');
      if (!dd || dd.textContent === valore) return;
      dd.textContent = valore; dd.classList.remove("cambiato"); void dd.offsetWidth; dd.classList.add("cambiato");
    }
    function aggiornaBiglietto() {
      var d = fp.querySelector("#p-data").value;
      mostra("nome", fp.querySelector("#p-nome").value.trim() || "—");
      mostra("data", d ? (function () { var p = d.split("-"), x = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); return GIORNI[x.getUTCDay()] + " " + x.getUTCDate() + " " + MESI[x.getUTCMonth()]; })() : "—");
      mostra("ora", fp.querySelector("#p-ora").value || "—");
      mostra("persone", fp.querySelector("#p-persone").value || "—");
      big.classList.remove("pronto");
    }
    fp.addEventListener("input", aggiornaBiglietto);
    fp.addEventListener("change", aggiornaBiglietto);
    fp.querySelectorAll("[data-persone]").forEach(function (b) { b.addEventListener("click", function () { setTimeout(aggiornaBiglietto, 0); }); });
  }

  /* ---------- Storia: capitoli da scorrere (dito, mouse, frecce) ---------- */
  var binario = document.querySelector(".capitoli__binario");
  if (binario) {
    var schede = Array.prototype.slice.call(binario.children);
    var punti = document.querySelectorAll(".capitoli__punti span");
    var frecce = document.querySelectorAll(".capitoli__freccia");
    var attuale = 0;
    function segna(i) {
      attuale = i;
      schede.forEach(function (c, k) { c.classList.toggle("attivo", k === i); });
      punti.forEach(function (p, k) { p.classList.toggle("attivo", k === i); });
      frecce[0].disabled = i === 0; frecce[1].disabled = i === schede.length - 1;
    }
    function vai(i) {
      i = Math.max(0, Math.min(schede.length - 1, i));
      var fine = binario.scrollWidth - binario.clientWidth;
      binario.scrollTo({ left: Math.min(schede[i].offsetLeft - schede[0].offsetLeft, fine), behavior: ridotto ? "auto" : "smooth" });
      segna(i);
    }
    frecce.forEach(function (f) { f.addEventListener("click", function () { vai(attuale + +f.getAttribute("data-dir")); }); });
    binario.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { e.preventDefault(); vai(attuale + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); vai(attuale - 1); } });
    var tScroll;
    binario.addEventListener("scroll", function () {
      clearTimeout(tScroll);
      tScroll = setTimeout(function () {
        var x = binario.scrollLeft, migliore = 0, dist = Infinity;
        // A fine corsa l'ultima scheda è tutta visibile anche se non arriva al bordo sinistro.
        if (x >= binario.scrollWidth - binario.clientWidth - 4) { segna(schede.length - 1); return; }
        schede.forEach(function (c, k) { var d = Math.abs(c.offsetLeft - schede[0].offsetLeft - x); if (d < dist) { dist = d; migliore = k; } });
        segna(migliore);
      }, 80);
    }, { passive: true });
    // trascinamento con il mouse
    var giu = false, x0 = 0, s0 = 0, mosso = false;
    binario.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; giu = true; mosso = false; x0 = e.clientX; s0 = binario.scrollLeft; binario.classList.add("trascina"); });
    window.addEventListener("pointermove", function (e) { if (!giu) return; var dx = e.clientX - x0; if (Math.abs(dx) > 4) mosso = true; binario.scrollLeft = s0 - dx; });
    window.addEventListener("pointerup", function () {
      if (!giu) return; giu = false;
      var dx = binario.scrollLeft - s0; // letto prima che lo snap riporti la scheda al suo posto
      binario.classList.remove("trascina");
      if (mosso) vai(attuale + (dx > 60 ? 1 : dx < -60 ? -1 : 0));
    });
    segna(0);
  }

  /* ---------- Movimento legato allo scorrimento: nastro e sigillo ---------- */
  // Si muovono solo mentre si scorre la pagina (niente animazioni infinite che distraggono).
  var nastro = document.querySelector(".nastro__binario"), sigillo = document.querySelector(".sigillo__testo");
  if ((nastro || sigillo) && !ridotto) {
    var attesaScroll = false;
    function muovi() {
      attesaScroll = false;
      var y = window.scrollY;
      if (nastro) {
        var meta = nastro.scrollWidth / 2, r = nastro.getBoundingClientRect();
        if (meta && r.bottom > 0 && r.top < window.innerHeight) nastro.style.transform = "translate3d(" + (-((y * .35) % meta)).toFixed(1) + "px,0,0)";
      }
      if (sigillo) {
        var rs = sigillo.getBoundingClientRect();
        if (rs.bottom > 0 && rs.top < window.innerHeight) sigillo.style.transform = "rotate(" + (y * .12).toFixed(1) + "deg)";
      }
    }
    window.addEventListener("scroll", function () { if (!attesaScroll) { attesaScroll = true; requestAnimationFrame(muovi); } }, { passive: true });
    muovi();
  }

  /* ---------- Animazioni decorative ferme quando sono fuori schermo ---------- */
  var animate = document.querySelectorAll(".laboratorio, .finale, .mappa");
  if ("IntersectionObserver" in window) {
    var ioVista = new IntersectionObserver(function (voci) { voci.forEach(function (v) { v.target.classList.toggle("in-vista", v.isIntersecting); }); });
    animate.forEach(function (el) { ioVista.observe(el); });
  } else animate.forEach(function (el) { el.classList.add("in-vista"); });

  /* ---------- Foto principale: entra in dissolvenza anche se era già in cache ---------- */
  document.querySelectorAll(".hero__foto img").forEach(function (img) {
    if (!img.complete || !img.naturalWidth) return;
    (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
      requestAnimationFrame(function () { img.classList.add("caricata"); });
    });
  });

  /* ---------- Galleria: foto a tutto schermo (frecce, tastiera, dito) ---------- */
  var galleria = document.querySelector(".galleria"), lb = document.querySelector(".lightbox");
  if (galleria && lb && typeof lb.showModal === "function") {
    var foto = Array.prototype.slice.call(galleria.querySelectorAll("a[data-indice]"));
    var lbImg = lb.querySelector("img"), lbDid = lb.querySelector(".lightbox__did"), lbConta = lb.querySelector(".lightbox__conta"), corrente = 0;
    function mostraFoto(n) {
      corrente = (n + foto.length) % foto.length;
      var a = foto[corrente], mini = a.querySelector("img");
      lbImg.classList.remove("pronta");
      lbImg.onload = function () { lbImg.classList.add("pronta"); };
      // se la versione grande non c'è (es. anteprima a file unico) si usa quella già caricata
      lbImg.onerror = function () { lbImg.onerror = null; lbImg.src = mini.currentSrc || mini.src; };
      lbImg.src = a.getAttribute("data-grande");
      lbImg.alt = mini.alt;
      lbDid.textContent = a.parentNode.querySelector(".galleria__did").textContent;
      lbConta.textContent = (corrente + 1) + " / " + foto.length;
    }
    foto.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        mostraFoto(+a.getAttribute("data-indice"));
        lb.showModal(); document.body.style.overflow = "hidden";
      });
    });
    lb.querySelectorAll(".lightbox__freccia").forEach(function (b) {
      if (foto.length < 2) { b.hidden = true; return; } // con una sola foto le frecce non servono
      b.addEventListener("click", function () { mostraFoto(corrente + +b.getAttribute("data-dir")); });
    });
    lb.querySelector(".lightbox__chiudi").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lightbox__foto")) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); mostraFoto(corrente + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); mostraFoto(corrente - 1); }
    });
    lb.addEventListener("close", function () { document.body.style.overflow = ""; foto[corrente].focus(); });
    var xInizio = null;
    lb.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") xInizio = e.clientX; });
    lb.addEventListener("pointerup", function (e) {
      if (xInizio === null) return;
      var dx = e.clientX - xInizio; xInizio = null;
      if (Math.abs(dx) > 50 && foto.length > 1) mostraFoto(corrente + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- Menu: la categoria che stai leggendo si accende nella barra ---------- */
  var linkCat = Array.prototype.slice.call(document.querySelectorAll(".menu-nav a"));
  if (linkCat.length && "IntersectionObserver" in window) {
    var barraCat = document.querySelector(".menu-nav ul");
    var ioCat = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        linkCat.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + v.target.id;
          a.classList.toggle("attivo", on);
          if (on) { a.setAttribute("aria-current", "true"); if (barraCat.scrollWidth > barraCat.clientWidth) barraCat.scrollTo({ left: a.offsetLeft - 16, behavior: ridotto ? "auto" : "smooth" }); }
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    document.querySelectorAll(".categoria[id]").forEach(function (c) { ioCat.observe(c); });
  }

  /* ---------- Anno nel footer ---------- */
  document.querySelectorAll("[data-anno]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
