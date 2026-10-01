(function () {
  "use strict";

  /* ===== НАСТРОЙКИ ===== */
  // Номер WhatsApp в международном формате, только цифры (Казахстан: 7XXXXXXXXXX)
  var WA_NUMBER = "77076744565";

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

  /* ===== Формы -> WhatsApp (нижняя и в модальном окне) ===== */
  var modal = document.getElementById("leadModal");
  var topic = ""; // тема заявки (только для формы в окне)
  var closeTimer;

  function initForm(form, afterSend) {
    var msg = form.querySelector(".form-msg");
    var phone = form.elements.phone;

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
      msg.style.color = "";
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
      if (modal.contains(form) && topic) lines.push("Интерес: " + topic);

      var url = waBase + "?text=" + encodeURIComponent(lines.join("\n"));
      var w = window.open(url, "_blank", "noopener");
      if (!w) window.location.href = url; // если браузер заблокировал новое окно

      form.reset();
      msg.style.color = "var(--teal)";
      msg.textContent = "Открываем WhatsApp — нажмите «Отправить» в чате.";
      if (afterSend) afterSend();
    });
  }

  /* ===== Модальное окно ===== */
  var modalForm = modal.querySelector("[data-lead-form]");

  function openModal(trigger) {
    clearTimeout(closeTimer);
    topic = (trigger && trigger.getAttribute("data-topic")) || "";
    var msg = modalForm.querySelector(".form-msg");
    msg.textContent = "";
    msg.style.color = "";
    modalForm.querySelectorAll(".err").forEach(function (el) {
      el.classList.remove("err");
    });
    setMenu(false);
    if (typeof modal.showModal === "function") {
      modal.showModal();
      document.body.classList.add("modal-open");
    } else {
      modal.setAttribute("open", ""); // старые браузеры без <dialog>
    }
  }

  function closeModal() {
    clearTimeout(closeTimer);
    topic = "";
    if (typeof modal.close === "function") modal.close();
    else modal.removeAttribute("open");
    document.body.classList.remove("modal-open");
  }

  // Все кнопки и ссылки с атрибутом data-modal открывают окно вместо скролла
  document.querySelectorAll("[data-modal]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(el);
    });
  });
  modal.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });
  // клик по тёмному фону (вне окна) закрывает его
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });
  // Esc закрывает окно штатно, поэтому класс блокировки скролла снимаем по событию close
  modal.addEventListener("close", function () {
    document.body.classList.remove("modal-open");
  });

  // Подключаем все формы: у формы в окне после отправки окно закрывается само
  document.querySelectorAll("[data-lead-form]").forEach(function (f) {
    initForm(
      f,
      modal.contains(f)
        ? function () {
            closeTimer = setTimeout(closeModal, 2500);
          }
        : null,
    );
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
        "section:not(.hero) h2, .tile, .product, .step, .quote, .faq-item, .contact .form",
      )
      .forEach(function (el) {
        el.classList.add("reveal");
        io.observe(el);
      });
  }
})();
