// Antica Pasticceria Minicucci — interazioni della bozza
document.documentElement.classList.remove("no-js");

// Menu mobile
const burger = document.querySelector(".burger");
const menu = document.getElementById("menu-mobile");
if (burger && menu) {
  const chiudi = () => {
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Apri il menu");
    menu.classList.remove("aperto");
    document.body.style.overflow = "";
  };
  burger.addEventListener("click", () => {
    const aperto = burger.getAttribute("aria-expanded") === "true";
    if (aperto) return chiudi();
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Chiudi il menu");
    menu.classList.add("aperto");
    document.body.style.overflow = "hidden";
  });
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", chiudi));
  addEventListener("keydown", e => { if (e.key === "Escape") chiudi(); });
  matchMedia("(min-width: 1000px)").addEventListener("change", chiudi);
}

// Modulo richieste: nella bozza non è collegato a nessun servizio di invio
const form = document.querySelector(".form");
if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.querySelector(".form-esito").textContent =
      "Grazie! (Bozza: il modulo non invia ancora i dati. Per ora chiamaci allo 081 991337.)";
    form.reset();
  });
}

// Animazioni in entrata
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("visto"); io.unobserve(en.target); }
  }), { threshold: .12 });
  document.querySelectorAll(".rivela").forEach(el => io.observe(el));
} else {
  document.querySelectorAll(".rivela").forEach(el => el.classList.add("visto"));
}
