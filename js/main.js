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

  /* ===== Модальное окно с пакетами (одно окно на 103.KZ и MedElement) ===== */
  // Чтобы изменить пакеты, цены или состав, правьте только объект CATALOGS.
  // Строка в items = обычный пункт; пара ["заголовок", "пояснение"] = пункт с пояснением.
  // Какой набор открыть, задаёт атрибут кнопки: data-tariffs="portal" или data-tariffs="mis".
  var START_ITEMS = [
    "размещение вашей клиники на 12 месяцев",
    "персональная страница клиники",
    "размещение до 5 рубрик на выбор",
    "интерактивное отображение на карте",
    "модерация отзывов",
    "доступ в личный кабинет для отслеживания результатов и эффективности",
    "сопровождение персональным менеджером",
    "до 10 специалистов",
  ];

  var MODULES = "Модули «Онлайн-запись» и «Телемедицина»";

  var CATALOGS = {
    // ---------- Портал 103.KZ ----------
    portal: {
      title: "Пакеты размещения на 103.KZ",
      target: "на 103.KZ", // для текста в WhatsApp
      btn: "btn-teal",
      plans: [
        { label: "Пакет", name: "START", price: "599 000 тг", items: START_ITEMS, note: "*единоразовое подключение" },
        { label: "Пакет", name: "START STOM", price: "399 000 тг", items: START_ITEMS, note: "*единоразовое подключение" },
        {
          name: "Мини+",
          price: "320 000 тг",
          period: "/ 12 месяцев",
          items: [
            ["Профиль клиники", "с описанием услуг и специалистов"],
            ["Кросс-продвижение клиники", "на страницах других клиник"],
            ["Отзывы о клинике", "с подтверждением"],
            ["Личный кабинет", "с аналитикой, отчётами"],
            "3–7 специалистов",
          ],
          gift: "В подарок отметка «Проверенный врач»",
          note: "*единоразовое подключение",
        },
      ],
    },

    // ---------- МИС MedElement ----------
    mis: {
      title: "Пакеты МИС MedElement",
      target: "в МИС MedElement",
      btn: "btn-accent",
      plans: [
        {
          label: "Пакет", name: "1+1", price: "136 000 тг", period: "за 1 год",
          items: ["1 рабочее место + 1 рабочее место в подарок"],
        },
        {
          label: "Пакет", name: "2+1", price: "230 000 тг", period: "за 1 год",
          items: ["2 рабочих места + 1 рабочее место в подарок", MODULES],
        },
        {
          label: "Пакет", name: "4+1", price: "396 000 тг", period: "за 1 год",
          items: ["4 рабочих места + 1 рабочее место в подарок", MODULES, "Сайт клиники на базе платформы"],
        },
      ],
      // Примечание под пакетами
      includes: {
        title: "Пакеты включают:",
        items: [
          "Аренда сервиса МИС в течение года",
          "Пусконаладка, настройка системы и обучение пользователей",
          "Плановые обновления системы (новые функции) в течение года",
          "Базовая консультационная поддержка",
        ],
      },
    },

    // ---------- MacDent ----------
    // prices = варианты срока оплаты (выбранный попадёт в WhatsApp), meta = строки «название: значение»
    macdent: {
      title: "Прайс-лист MacDent",
      lead: "Тарифы для клиники на 2 врача и неограниченное количество администраторов. По кнопке «Оставить заявку» откроется WhatsApp с готовым сообщением.",
      kind: "тариф",
      target: "в MacDent",
      btn: "btn-light",
      plans: [
        {
          label: "Тариф", name: "BRONZE",
          prices: [
            { p: "75 000 тг", per: "3 мес" },
            { p: "136 000 тг", per: "6 мес" },
            { p: "241 000 тг", per: "12 мес" },
          ],
          meta: [["Внедрение", "60 000 тг"], ["Пространство диска", "10 GB (KZ сервера)"]],
          items: [
            "Приёмы, пациенты, оплаты",
            "Расчёт доходности, отчёты, статистика",
            "Прейскурант и безопасность",
            "Рассылка через расширение WhatsApp",
          ],
        },
        {
          label: "Тариф", name: "SILVER", price: "345 000 тг", period: "/ 12 мес",
          meta: [["Внедрение", "60 000 тг"], ["Пространство диска", "20 GB (KZ сервера)"]],
          items: ["Всё из тарифа «BRONZE»", "+ Задачи, врачебная часть, страховая компания"],
        },
        {
          label: "Тариф", name: "GOLD", price: "432 000 тг", period: "/ 12 мес",
          meta: [["Внедрение", "110 000 тг"], ["Пространство диска", "50 GB (KZ сервера)"]],
          items: ["Всё из тарифов «BRONZE» и «SILVER»", "+ Финансы, учёт склада"],
        },
      ],
    },
  };

  var tariffModal = document.getElementById("tariffsModal");
  var tariffList = document.getElementById("tariffList");
  var tariffTitle = document.getElementById("tariffsTitle");
  var tariffNote = document.getElementById("tariffsNote");
  var tariffText = document.getElementById("tariffsText");
  var DEFAULT_LEAD = tariffText.textContent.trim().replace(/\s+/g, " ");
  var GIFT_ICON =
    '<svg class="ic" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="8" width="18" height="4" rx="1"></rect><path d="M5 12v8h14v-8M12 8v12M12 8S12 4 9.5 4a2 2 0 0 0 0 4M12 8s0-4 2.5-4a2 2 0 0 1 0 4"></path></svg>';
  var CHECK_ICON = '<svg class="ic" width="20" height="20" aria-hidden="true"><use href="#i-check"></use></svg>';

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function waLink(text) {
    return waBase + "?text=" + encodeURIComponent(text);
  }

  function renderCatalog(key) {
    var cat = CATALOGS[key] || CATALOGS.portal;
    tariffModal.setAttribute("data-theme", CATALOGS[key] ? key : "portal");
    tariffTitle.textContent = cat.title;
    tariffText.textContent = cat.lead || DEFAULT_LEAD;

    tariffList.innerHTML = cat.plans.map(function (t) {
      // Текст, который попадёт в WhatsApp: название пакета (тарифа) и цена
      function msg(price, period) {
        return (
          "Здравствуйте! Хочу подключить " + (cat.kind || "пакет") + " «" + t.name + "» (" + price +
          (period ? " " + period : "") + ") " + cat.target + "."
        );
      }
      var items = (t.items || []).map(function (it) {
        var isPair = Array.isArray(it);
        return (
          "<li>" + CHECK_ICON + "<span>" + esc(isPair ? it[0] : it) +
          (isPair ? "<small>" + esc(it[1]) + "</small>" : "") + "</span></li>"
        );
      }).join("");

      // Цена: один вариант или переключатель срока (по умолчанию выбран последний, самый длинный)
      var def, priceBlock;
      if (t.prices) {
        var last = t.prices.length - 1;
        def = msg(t.prices[last].p, "/ " + t.prices[last].per);
        priceBlock =
          '<div class="price-opts" role="group" aria-label="Срок оплаты">' +
          t.prices.map(function (o, i) {
            return (
              '<button type="button" class="price-opt" aria-pressed="' + (i === last) + '" data-href="' +
              esc(waLink(msg(o.p, "/ " + o.per))) + '"><span>' + esc(o.p) + "</span><small>" + esc(o.per) + "</small></button>"
            );
          }).join("") + "</div>";
      } else {
        def = msg(t.price, t.period);
        priceBlock =
          '<div class="plan-price">' + esc(t.price) + (t.period ? "<small>" + esc(t.period) + "</small>" : "") + "</div>";
      }

      var meta = t.meta
        ? '<dl class="plan-meta">' +
          t.meta.map(function (m) { return "<div><dt>" + esc(m[0]) + "</dt><dd>" + esc(m[1]) + "</dd></div>"; }).join("") +
          "</dl>"
        : "";

      return (
        '<article class="plan"><div class="plan-head">' +
        (t.label ? '<div class="plan-label">' + esc(t.label) + "</div>" : "") +
        "<h3>" + esc(t.name) + "</h3>" + priceBlock + "</div>" + meta +
        '<ul class="checks">' + items + "</ul>" +
        '<div class="plan-foot">' +
        (t.gift ? '<div class="plan-gift">' + GIFT_ICON + "<span>" + esc(t.gift) + "</span></div>" : "") +
        '<a class="btn ' + cat.btn + ' plan-cta" href="' + esc(waLink(def)) +
        '" target="_blank" rel="noopener">Оставить заявку</a>' +
        (t.note ? '<p class="plan-note">' + esc(t.note) + "</p>" : "") +
        "</div></article>"
      );
    }).join("");

    // Примечание под пакетами (есть не у всех наборов)
    if (cat.includes) {
      tariffNote.innerHTML =
        "<b>" + esc(cat.includes.title) + "</b><ul>" +
        cat.includes.items.map(function (it) { return "<li>" + CHECK_ICON + "<span>" + esc(it) + "</span></li>"; }).join("") +
        "</ul>";
      tariffNote.hidden = false;
    } else {
      tariffNote.innerHTML = "";
      tariffNote.hidden = true;
    }
  }

  function openTariffs(key) {
    setMenu(false);
    renderCatalog(key);
    if (typeof tariffModal.showModal === "function") tariffModal.showModal();
    else tariffModal.setAttribute("open", "");
    document.body.classList.add("modal-open");
    tariffList.scrollLeft = 0;
    tariffModal.scrollTop = 0;
  }

  function closeTariffs() {
    if (typeof tariffModal.close === "function") tariffModal.close();
    else tariffModal.removeAttribute("open");
    document.body.classList.remove("modal-open");
  }

  document.querySelectorAll("[data-tariffs]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openTariffs(el.getAttribute("data-tariffs") || "portal");
    });
  });
  tariffModal.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", closeTariffs);
  });
  tariffModal.addEventListener("click", function (e) {
    if (e.target === tariffModal) closeTariffs(); // клик по тёмному фону
  });
  tariffModal.addEventListener("close", function () {
    document.body.classList.remove("modal-open");
  });
  tariffList.addEventListener("click", function (e) {
    // Выбор срока оплаты: обновляем ссылку кнопки «Оставить заявку» этого тарифа
    var opt = e.target.closest(".price-opt");
    if (opt) {
      var plan = opt.closest(".plan");
      plan.querySelectorAll(".price-opt").forEach(function (o) {
        o.setAttribute("aria-pressed", o === opt ? "true" : "false");
      });
      plan.querySelector(".plan-cta").href = opt.getAttribute("data-href");
      return;
    }
    // После перехода в WhatsApp окно с пакетами закрываем
    if (e.target.closest(".plan-cta")) setTimeout(closeTariffs, 300);
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
