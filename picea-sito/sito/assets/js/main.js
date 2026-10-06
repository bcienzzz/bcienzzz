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
      el.textContent = f.length ? f.map(function (x) { return hhmm(x[0]) + "–" + hhmm(x[1]); }).join(" · ") : "Chiuso";
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
    document.querySelectorAll("main, footer, .barra").forEach(function (el) { if ("inert" in el) el.inert = si; });
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
    rivela.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.94) el.classList.add("visto");
      else io.observe(el);
    });
  } else rivela.forEach(function (el) { el.classList.add("visto"); });

  /* ---------- Mappa: si carica solo al clic (niente cookie di Google prima) ---------- */
  document.querySelectorAll("[data-carica-mappa]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = btn.closest(".mappa");
      var f = document.createElement("iframe");
      f.src = D.mapsEmbed; f.title = "Mappa: " + (D.indirizzo || "Picea"); f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade"; f.allowFullscreen = true;
      box.innerHTML = ""; box.appendChild(f);
    });
  });

  /* ---------- Menu: categoria attiva ---------- */
  var linkCat = document.querySelectorAll(".menu-nav a");
  if (linkCat.length && "IntersectionObserver" in window) {
    var ioCat = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        linkCat.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + v.target.id;
          a.classList.toggle("attivo", on);
          if (on && a.scrollIntoView && window.innerWidth < 1024) a.parentNode.parentNode.scrollTo({ left: a.offsetLeft - 20, behavior: ridotto ? "auto" : "smooth" });
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll(".categoria[id]").forEach(function (c) { ioCat.observe(c); });
    var primaCat = document.querySelector(".categoria[id]");
    window.addEventListener("scroll", function () {
      if (primaCat && primaCat.getBoundingClientRect().top > window.innerHeight * 0.45) linkCat.forEach(function (a) { a.classList.remove("attivo"); });
    }, { passive: true });
  }

  function apri(url) {
    var a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  }

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
      if (!lista.length) { cOra.appendChild(new Option("Nessun orario disponibile in questo giorno", "")); cOra.disabled = true; return; }
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

    fp.querySelectorAll("[data-persone]").forEach(function (b) {
      b.addEventListener("click", function () {
        var n = parseInt(cPers.value, 10);
        if (!(n >= 1)) { cPers.value = 1; return; }
        n = Math.min(cfg.personeMax, Math.max(1, n + parseInt(b.getAttribute("data-persone"), 10)));
        cPers.value = n;
      });
    });

    function elenco(a) { return a.length > 1 ? a.slice(0, -1).join(", ") + " e " + a[a.length - 1] : a[0]; }

    fp.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = document.getElementById("p-inviato");
      if (ok) ok.hidden = true;
      // Se la pagina è rimasta aperta a lungo, aggiorna data e orari disponibili prima di controllare.
      var ora = adessoRoma();
      if (ora) { adesso = ora; cData.min = ora.data; riempiOrari(); }
      var problemi = [], fuori = [];
      [cNome, cData, cOra, cPers].forEach(function (c) { c.removeAttribute("aria-invalid"); });
      if (!cNome.value.trim()) { problemi.push("il nome"); cNome.setAttribute("aria-invalid", "true"); }
      if (!cData.value) { problemi.push("il giorno"); cData.setAttribute("aria-invalid", "true"); }
      else if (cData.value < cData.min || cData.value > cData.max) { fuori.push("Scegli un giorno da oggi ai prossimi tre mesi."); cData.setAttribute("aria-invalid", "true"); }
      if (!cOra.value) { problemi.push("l’orario"); cOra.setAttribute("aria-invalid", "true"); }
      var n = /^\d+$/.test(cPers.value.trim()) ? parseInt(cPers.value, 10) : NaN;
      if (!cPers.value.trim()) { problemi.push("il numero di persone"); cPers.setAttribute("aria-invalid", "true"); }
      else if (!(n >= 1 && n <= cfg.personeMax)) { fuori.push("Il numero di persone deve essere da 1 a " + cfg.personeMax + "."); cPers.setAttribute("aria-invalid", "true"); }
      if (problemi.length || fuori.length) {
        var msg = problemi.length ? (problemi.length > 1 ? "Mancano " : "Manca ") + elenco(problemi) + "." : "";
        erroreP.textContent = (msg + " " + fuori.join(" ")).trim();
        var primo = fp.querySelector('[aria-invalid="true"]'); if (primo) primo.focus(); return;
      }
      erroreP.textContent = "";
      var testo = "Ciao Picea! Vorrei prenotare un tavolo.\n\n" +
        "Nome: " + cNome.value.trim() + "\n" +
        "Giorno: " + dataEstesa(cData.value) + "\n" +
        "Orario: " + cOra.value + "\n" +
        "Persone: " + n +
        (cNote.value.trim() ? "\nNote: " + cNote.value.trim() : "") +
        "\n\nAttendo la vostra conferma. Grazie!";
      apri("https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(testo));
      if (ok) { ok.hidden = false; ok.focus(); }
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
      if (manca.length) { err.textContent = (manca.length > 1 ? "Mancano " : "Manca ") + manca.join(" e ") + "."; fc.querySelector('[aria-invalid="true"]').focus(); return; }
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
    var cx = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, braci = [], visibile = true;
    function misura() { W = hero.clientWidth; H = hero.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function nuova(iniziale) {
      return { x: Math.random() * W, y: iniziale ? Math.random() * H : H + 10, r: .6 + Math.random() * 1.8,
        v: .25 + Math.random() * .7, o: Math.random() * Math.PI * 2, a: .35 + Math.random() * .5, vita: 0 };
    }
    misura();
    var n = Math.round(Math.min(46, W / 28));
    for (var i = 0; i < n; i++) braci.push(nuova(true));
    window.addEventListener("resize", misura);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (v) { visibile = v[0].isIntersecting; }).observe(hero);
    (function anima() {
      if (visibile && !document.hidden) {
        cx.clearRect(0, 0, W, H);
        braci.forEach(function (b, k) {
          b.y -= b.v; b.o += .02; b.x += Math.sin(b.o) * .35; b.vita++;
          var alto = b.y / H, alfa = b.a * Math.min(1, b.vita / 60) * Math.max(0, alto);
          if (b.y < -10 || alfa <= 0.01 && b.vita > 60) { braci[k] = nuova(false); return; }
          var g = cx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 4);
          g.addColorStop(0, "rgba(255, 196, 120," + alfa + ")");
          g.addColorStop(.4, "rgba(232, 128, 48," + alfa * .55 + ")");
          g.addColorStop(1, "rgba(232, 128, 48, 0)");
          cx.fillStyle = g; cx.beginPath(); cx.arc(b.x, b.y, b.r * 4, 0, Math.PI * 2); cx.fill();
        });
      }
      requestAnimationFrame(anima);
    })();
    var heroImg = hero.querySelector(".hero__foto img"), bandaImg = document.querySelector(".banda__foto img"), banda = document.querySelector(".banda");
    var inAttesa = false;
    window.addEventListener("scroll", function () {
      if (inAttesa) return; inAttesa = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (heroImg && y < hero.offsetHeight) heroImg.style.transform = "translate3d(0," + (y * .25).toFixed(1) + "px,0) scale(1.04)";
        if (bandaImg && banda) { var r = banda.getBoundingClientRect(); if (r.bottom > 0 && r.top < window.innerHeight) bandaImg.style.transform = "translate3d(0," + ((r.top - window.innerHeight / 2) * -.12).toFixed(1) + "px,0) scale(1.15)"; }
        inAttesa = false;
      });
    }, { passive: true });
  }

  /* ---------- Servizi: luce che segue il puntatore ---------- */
  document.querySelectorAll(".servizi li").forEach(function (li) {
    li.addEventListener("pointermove", function (e) {
      var r = li.getBoundingClientRect();
      li.style.setProperty("--x", (e.clientX - r.left) + "px"); li.style.setProperty("--y", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Anno nel footer ---------- */
  document.querySelectorAll("[data-anno]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
