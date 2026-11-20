(function () {
  "use strict";

  var RELEASE_API_URL = "https://api.github.com/repos/drmvstafa/Midad-Releases/releases/latest";
  var THEME_STORAGE_KEY = "midad_site_theme";
  var ALLOWED_THEMES = ["sepia", "dark", "light"];

  var SCREENSHOTS = [
    {
      src: "assets/home.png",
      title: "الواجهة الرئيسية والمختارات الذكية",
      alt: "الواجهة الرئيسية في تطبيق مداد Midad لعرض المكتبة الشاملة ومختارات القراءة"
    },
    {
      src: "assets/book_detail.png",
      title: "صفحة الكتاب وأفضل 5 روابط تحميل",
      alt: "صفحة تفاصيل الكتاب وروابط التحميل المباشر من المكتبات في تطبيق مداد"
    },
    {
      src: "assets/audiobooks.png",
      title: "قسم الكتب المسموعة والاستكشاف",
      alt: "قسم الكتب المسموعة في تطبيق مداد Midad مع مشغّل صوتي متكامل"
    },
    {
      src: "assets/audiobook_chapters.png",
      title: "فصول الكتاب الصوتي والتحميل أوفلاين",
      alt: "صفحة فصول الكتاب الصوتي والتحميل للاستماع بدون إنترنت في تطبيق مداد"
    }
  ];

  var currentScreenIndex = 0;

  function applyTheme(theme) {
    var safeTheme = ALLOWED_THEMES.indexOf(theme) !== -1 ? theme : "sepia";
    document.documentElement.setAttribute("data-theme", safeTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
    } catch (_err) {
      // Ignore storage failures in private browsing modes.
    }

    var buttons = document.querySelectorAll(".theme-btn");
    buttons.forEach(function (btn) {
      var isSelected = btn.getAttribute("data-theme-value") === safeTheme;
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function initTheme() {
    var saved = "sepia";
    try {
      saved = localStorage.getItem(THEME_STORAGE_KEY) || "sepia";
    } catch (_err) {
      saved = "sepia";
    }
    applyTheme(saved);

    document.querySelectorAll(".theme-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyTheme(btn.getAttribute("data-theme-value"));
      });
    });
  }

  function hydrateLatestRelease() {
    if (typeof fetch !== "function") return;
    fetch(RELEASE_API_URL, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("Release fetch status " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.tag_name) return;

        document.querySelectorAll(".js-release-version").forEach(function (el) {
          el.textContent = data.tag_name;
        });

        if (data.html_url) {
          document.querySelectorAll(".js-release-page-link").forEach(function (link) {
            link.href = data.html_url;
          });
        }

        if (Array.isArray(data.assets)) {
          var apkAsset = data.assets.find(function (asset) {
            return asset && typeof asset.name === "string" && asset.name.toLowerCase().endsWith(".apk");
          });
          if (apkAsset && apkAsset.browser_download_url) {
            document.querySelectorAll(".js-apk-link").forEach(function (link) {
              link.href = apkAsset.browser_download_url;
            });
          }
        }
      })
      .catch(function () {
        // Keep static verified fallback metadata when offline or rate-limited.
      });
  }

  function initScrollHeader() {
    var header = document.getElementById("site-header");
    if (!header) return;

    var lastY = window.scrollY || 0;
    var ticking = false;

    function updateHeader() {
      var currentY = window.scrollY || 0;
      if (currentY <= 40) {
        header.classList.remove("is-hidden");
      } else if (currentY > lastY + 6 && currentY > 72) {
        header.classList.add("is-hidden");
      } else if (currentY < lastY - 6) {
        header.classList.remove("is-hidden");
      }
      lastY = currentY;
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateHeader);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  function initRevealAnimations() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  function setHeroScreenshot(index) {
    var safeIndex = (index + SCREENSHOTS.length) % SCREENSHOTS.length;
    currentScreenIndex = safeIndex;
    var item = SCREENSHOTS[safeIndex];
    var img = document.getElementById("hero-screen-img");
    if (img) {
      img.classList.add("is-switching");
      window.setTimeout(function () {
        img.src = item.src;
        img.alt = item.alt;
        img.classList.remove("is-switching");
      }, 110);
    }

    var tabs = document.querySelectorAll(".showcase-tab");
    tabs.forEach(function (tab, idx) {
      tab.setAttribute("aria-selected", idx === safeIndex ? "true" : "false");
    });
  }

  function initGalleryCarousel() {
    var track = document.getElementById("gallery-carousel");
    if (!track) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll(".gallery-card"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".gallery-dot"));
    var prevBtn = document.getElementById("gallery-prev-btn");
    var nextBtn = document.getElementById("gallery-next-btn");
    var activeSlide = 0;

    function updateDots(index) {
      activeSlide = index;
      dots.forEach(function (dot, idx) {
        dot.setAttribute("aria-current", idx === index ? "true" : "false");
      });
    }

    function goToSlide(index) {
      var safeIdx = (index + slides.length) % slides.length;
      updateDots(safeIdx);
      if (slides[safeIdx] && slides[safeIdx].scrollIntoView) {
        slides[safeIdx].scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest"
        });
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        goToSlide(activeSlide - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        goToSlide(activeSlide + 1);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var idx = parseInt(dot.getAttribute("data-slide") || "0", 10);
        goToSlide(idx);
      });
    });

    // Update active dot while user swipes horizontally
    var scrollTimer = null;
    track.addEventListener(
      "scroll",
      function () {
        if (scrollTimer) window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(function () {
          var trackRect = track.getBoundingClientRect();
          var trackCenter = trackRect.left + trackRect.width / 2;
          var bestIdx = 0;
          var bestDist = Infinity;

          slides.forEach(function (slide, idx) {
            var rect = slide.getBoundingClientRect();
            var center = rect.left + rect.width / 2;
            var dist = Math.abs(center - trackCenter);
            if (dist < bestDist) {
              bestDist = dist;
              bestIdx = idx;
            }
          });
          updateDots(bestIdx);
        }, 70);
      },
      { passive: true }
    );

    // Mouse drag support on desktop trackpads/mice
    var isDragging = false;
    var dragStartX = 0;
    var dragStartScroll = 0;
    var moved = false;

    track.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      isDragging = true;
      moved = false;
      dragStartX = e.pageX;
      dragStartScroll = track.scrollLeft;
    });

    window.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      var delta = e.pageX - dragStartX;
      if (Math.abs(delta) > 6) moved = true;
      track.scrollLeft = dragStartScroll - delta;
    });

    window.addEventListener("mouseup", function () {
      if (!isDragging) return;
      isDragging = false;
      if (moved) {
        track.dataset.justDragged = "1";
        window.setTimeout(function () {
          delete track.dataset.justDragged;
        }, 80);
      }
    });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSlide(activeSlide + 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToSlide(activeSlide - 1);
      }
    });
  }

  function renderLightboxImage() {
    var item = SCREENSHOTS[currentScreenIndex];
    var titleEl = document.getElementById("lightbox-title");
    var imgEl = document.getElementById("lightbox-img");
    var counterEl = document.getElementById("lightbox-counter");

    if (titleEl) titleEl.textContent = item.title;
    if (imgEl) {
      imgEl.src = item.src;
      imgEl.alt = item.alt;
    }
    if (counterEl) {
      counterEl.textContent = currentScreenIndex + 1 + " / " + SCREENSHOTS.length;
    }
  }

  function openLightbox(index) {
    currentScreenIndex = (index + SCREENSHOTS.length) % SCREENSHOTS.length;
    renderLightboxImage();

    var dialog = document.getElementById("lightbox-dialog");
    var closeBtn = document.getElementById("lightbox-close-btn");
    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    var dialog = document.getElementById("lightbox-dialog");
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function initShowcaseAndGallery() {
    var tabs = document.querySelectorAll(".showcase-tab");
    tabs.forEach(function (tab, idx) {
      tab.addEventListener("click", function () {
        setHeroScreenshot(idx);
      });
    });

    var heroTrigger = document.getElementById("hero-screen-trigger");
    if (heroTrigger) {
      heroTrigger.addEventListener("click", function () {
        openLightbox(currentScreenIndex);
      });
    }

    document.querySelectorAll(".js-open-lightbox").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var track = document.getElementById("gallery-carousel");
        if (track && track.dataset.justDragged === "1") return;
        var idx = parseInt(btn.getAttribute("data-index") || "0", 10);
        openLightbox(idx);
      });
    });

    var closeBtn = document.getElementById("lightbox-close-btn");
    var prevBtn = document.getElementById("lightbox-prev-btn");
    var nextBtn = document.getElementById("lightbox-next-btn");
    var dialog = document.getElementById("lightbox-dialog");

    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        currentScreenIndex = (currentScreenIndex - 1 + SCREENSHOTS.length) % SCREENSHOTS.length;
        renderLightboxImage();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        currentScreenIndex = (currentScreenIndex + 1) % SCREENSHOTS.length;
        renderLightboxImage();
      });
    }
    if (dialog) {
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) {
          closeLightbox();
        }
      });
    }
  }

  function initFaqAccordion() {
    var triggers = document.querySelectorAll(".faq-trigger");
    triggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var panelId = btn.getAttribute("aria-controls");
        var panel = panelId ? document.getElementById(panelId) : null;
        if (!panel) return;

        var isExpanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", isExpanded ? "false" : "true");
        panel.hidden = isExpanded;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initScrollHeader();
    initRevealAnimations();
    hydrateLatestRelease();
    initShowcaseAndGallery();
    initGalleryCarousel();
    initFaqAccordion();
  });
})();
