(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Mobile navigation ---------------- */
  var navToggle = document.getElementById("navToggle");
  var navMobile = document.getElementById("navMobile");

  function closeNav() {
    navMobile.setAttribute("data-open", "false");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Открыть меню");
  }

  function openNav() {
    navMobile.setAttribute("data-open", "true");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Закрыть меню");
  }

  if (navToggle && navMobile) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMobile.getAttribute("data-open") === "true";
      if (isOpen) { closeNav(); } else { openNav(); }
    });

    navMobile.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navMobile.getAttribute("data-open") === "true") {
        closeNav();
        navToggle.focus();
      }
    });
  }

  /* ---------------- Reveal-on-scroll ---------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reducedMotion && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- 3D tilt for menu cards ---------------- */
  var tiltCards = document.querySelectorAll(".menu-card");
  var rootStyles = getComputedStyle(document.documentElement);
  var TILT_MAX = parseFloat(rootStyles.getPropertyValue("--tilt-max-deg")) || 6;
  var canHover = window.matchMedia("(pointer: fine)").matches;

  if (!reducedMotion && canHover && tiltCards.length) {
    tiltCards.forEach(function (card) {
      var raf = null;

      function handleMove(e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        var rotateY = (x - 0.5) * 2 * TILT_MAX;
        var rotateX = (0.5 - y) * 2 * TILT_MAX;

        if (raf) { cancelAnimationFrame(raf); }
        raf = requestAnimationFrame(function () {
          card.style.transition = "box-shadow var(--dur-med) var(--ease)";
          card.style.transform = "rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg)";
        });
        card.classList.add("is-tilted");
      }

      function handleLeave() {
        if (raf) { cancelAnimationFrame(raf); }
        card.style.transition = "transform var(--dur-med) var(--ease), box-shadow var(--dur-med) var(--ease)";
        card.style.transform = "";
        card.classList.remove("is-tilted");
      }

      card.addEventListener("mousemove", handleMove);
      card.addEventListener("mouseleave", handleLeave);
      card.addEventListener("blur", handleLeave);
    });
  }

  /* ---------------- Hero background parallax ---------------- */
  var heroSection = document.querySelector(".hero");
  var heroVisual = document.querySelector(".hero__visual svg");
  var PARALLAX_FACTOR = parseFloat(rootStyles.getPropertyValue("--parallax-factor")) || 0.12;

  if (!reducedMotion && heroSection && heroVisual) {
    var parallaxTicking = false;

    function updateParallax() {
      parallaxTicking = false;
      var rect = heroSection.getBoundingClientRect();
      // Skip work once the hero has scrolled well out of view.
      if (rect.bottom < 0 || rect.top > window.innerHeight) { return; }
      var offset = window.scrollY * PARALLAX_FACTOR;
      heroVisual.style.transform = "translate3d(0, " + offset.toFixed(1) + "px, 0)";
    }

    window.addEventListener("scroll", function () {
      if (!parallaxTicking) {
        parallaxTicking = true;
        requestAnimationFrame(updateParallax);
      }
    }, { passive: true });

    updateParallax();
  }

  /* ---------------- Footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  /* ---------------- Booking form -> WhatsApp ---------------- */
  var WHATSAPP_NUMBER = "79912278777"; // +7 991 227-87-77, digits only, RU country code

  var bookingForm = document.getElementById("bookingForm");
  var formStatus = document.getElementById("formStatus");
  var DEFAULT_HINT = "Заявка откроется в WhatsApp — там останется только нажать «Отправить».";

  function buildMessage(data) {
    var lines = ["Здравствуйте! Хочу оставить заявку в кофейне «Другая».", ""];
    if (data.name) lines.push("Имя: " + data.name);
    if (data.phone) lines.push("Телефон: " + data.phone);
    if (data.date) lines.push("Дата: " + data.date);
    if (data.time) lines.push("Время: " + data.time);
    if (data.guests) lines.push("Количество гостей: " + data.guests);
    if (data.comment) lines.push("Комментарий: " + data.comment);
    return lines.join("\n");
  }

  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = bookingForm.elements["name"].value.trim();
      var phone = bookingForm.elements["phone"].value.trim();

      if (!name || !phone) {
        formStatus.textContent = "Укажите имя и телефон — так мы точно сможем с вами связаться.";
        if (!name) { bookingForm.elements["name"].focus(); }
        else { bookingForm.elements["phone"].focus(); }
        return;
      }

      var data = {
        name: name,
        phone: phone,
        date: bookingForm.elements["date"].value,
        time: bookingForm.elements["time"].value,
        guests: bookingForm.elements["guests"].value.trim(),
        comment: bookingForm.elements["comment"].value.trim()
      };

      var message = buildMessage(data);
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);

      window.open(url, "_blank", "noopener,noreferrer");
      formStatus.textContent = "Готово — заявка открылась в WhatsApp, там останется только нажать «Отправить».";
    });
  }
})();
