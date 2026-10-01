(function () {
  "use strict";

  /* ===== НАСТРОЙКИ ===== */
  // Номер WhatsApp в международном формате, только цифры (Казахстан: 7XXXXXXXXXX)
  var WA_NUMBER = "+77076744565";

  var waBase = "https://wa.me/" + WA_NUMBER;

  // Все ссылки на WhatsApp
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href =
      waBase +
      "?text=" +
      encodeURIComponent(
        "Здравствуйте! Хочу узнать про продвижение клиники на 103.KZ.",
      );
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* ===== Мобильное меню ===== */
  var btn = document.getElementById("menuBtn");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  btn.addEventListener("click", function () {
    setMenu(!nav.classList.contains("open"));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  /* ===== Форма -> WhatsApp ===== */
  var form = document.getElementById("leadForm");
  var msg = document.getElementById("formMsg");
  var phone = form.elements.phone;
  var topic = "";

  // Запоминаем, с какой кнопки пришли («Запросить демо» и т.п.)
  document.querySelectorAll("[data-topic]").forEach(function (a) {
    a.addEventListener("click", function () {
      topic = a.getAttribute("data-topic");
    });
  });

  // Простая маска телефона: +7 (XXX) XXX-XX-XX
  phone.addEventListener("input", function () {
    var d = phone.value.replace(/\D/g, "");
    if (d[0] === "8") d = "7" + d.slice(1);
    if (d && d[0] !== "7") d = "7" + d;
    d = d.slice(0, 11);
    var s = d ? "+7" : "";
    if (d.length > 1) s += " (" + d.slice(1, 4);
    if (d.length >= 5) s += ") " + d.slice(4, 7);
    if (d.length >= 8) s += "-" + d.slice(7, 9);
    if (d.length >= 10) s += "-" + d.slice(9, 11);
    phone.value = s;
  });

  function fail(field, text) {
    field.classList.add("err");
    msg.textContent = text;
    field.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    form.querySelectorAll(".err").forEach(function (el) {
      el.classList.remove("err");
    });
    msg.textContent = "";

    var name = form.elements.name.value.trim();
    var tel = phone.value.trim();
    var clinic = form.elements.clinic.value.trim();

    if (!name)
      return fail(form.elements.name, "Укажите, как к вам обращаться.");
    if (tel.replace(/\D/g, "").length < 11)
      return fail(phone, "Введите телефон полностью.");
    if (!form.elements.agree.checked) {
      msg.textContent = "Подтвердите согласие на обработку данных.";
      return;
    }

    var lines = [
      "Новая заявка с medca.kz",
      "Имя: " + name,
      "Телефон: " + tel,
      "Клиника: " + (clinic || "—"),
    ];
    if (topic) lines.push("Интерес: " + topic);

    var url = waBase + "?text=" + encodeURIComponent(lines.join("\n"));
    var w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url; // если браузер заблокировал новое окно

    form.reset();
    topic = "";
    msg.style.color = "var(--teal)";
    msg.textContent = "Открываем WhatsApp — нажмите «Отправить» в чате.";
  });

  /* ===== Плавное появление блоков ===== */
  if (
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    document
      .querySelectorAll(
        "section:not(.hero) h2, .tile, .product, .step, .quote, .faq-item, .form",
      )
      .forEach(function (el) {
        el.classList.add("reveal");
        io.observe(el);
      });
  }
})();
