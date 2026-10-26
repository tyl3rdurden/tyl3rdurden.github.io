/*!
    * Start Bootstrap - Resume v6.0.2 (https://startbootstrap.com/theme/resume)
    * Copyright 2013-2026 Start Bootstrap
    * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
    */
    (function () {
    "use strict";

    document.querySelectorAll('a.js-scroll-trigger[href*="#"]:not([href="#"])').forEach(function (link) {
        link.addEventListener("click", function (event) {
            if (link.pathname.replace(/^\//, "") !== location.pathname.replace(/^\//, "") ||
                link.hostname !== location.hostname) return;

            var target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? "auto" : "smooth" });

            var menu = document.getElementById("navbarSupportedContent");
            if (menu && menu.classList.contains("show")) {
                bootstrap.Collapse.getOrCreateInstance(menu).hide();
            }
        });
    });

    bootstrap.ScrollSpy.getOrCreateInstance(document.body, { target: "#sideNav" });
})();

(function () {
    "use strict";

    var images = document.querySelectorAll(".experience-media-thumb img");
    if (!images.length) return;
    var korean = document.documentElement.lang === "ko";
    var labels = korean
        ? { dialog: "프로젝트 이미지 확대 보기", close: "확대 이미지 닫기", previous: "이전 이미지", next: "다음 이미지", view: "확대 보기: ", image: "프로젝트 이미지" }
        : { dialog: "Expanded project image", close: "Close expanded image", previous: "Previous image", next: "Next image", view: "View larger: ", image: "project image" };

    var lightbox = document.createElement("div");
    lightbox.className = "experience-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", labels.dialog);
    lightbox.hidden = true;
    lightbox.innerHTML =
        '<button class="experience-lightbox-close" type="button" aria-label="Close expanded image"><i class="fas fa-times" aria-hidden="true"></i></button>' +
        '<button class="experience-lightbox-nav experience-lightbox-prev" type="button" aria-label="Previous image"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>' +
        '<img class="experience-lightbox-image" alt="">' +
        '<button class="experience-lightbox-nav experience-lightbox-next" type="button" aria-label="Next image"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>';
    document.body.appendChild(lightbox);

    var closeButton = lightbox.querySelector(".experience-lightbox-close");
    var previousButton = lightbox.querySelector(".experience-lightbox-prev");
    var nextButton = lightbox.querySelector(".experience-lightbox-next");
    var lightboxImage = lightbox.querySelector(".experience-lightbox-image");
    closeButton.setAttribute("aria-label", labels.close);
    previousButton.setAttribute("aria-label", labels.previous);
    nextButton.setAttribute("aria-label", labels.next);
    var lastTrigger = null;
    var currentImages = [];
    var currentIndex = 0;

    function showImage(index) {
        currentIndex = (index + currentImages.length) % currentImages.length;
        var image = currentImages[currentIndex];
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt;
        previousButton.hidden = currentImages.length < 2;
        nextButton.hidden = currentImages.length < 2;
    }

    function closeLightbox() {
        lightbox.hidden = true;
        lightboxImage.removeAttribute("src");
        document.body.classList.remove("experience-lightbox-open");
        if (lastTrigger) lastTrigger.focus();
        currentImages = [];
    }

    function openLightbox(image) {
        lastTrigger = image;
        currentImages = Array.prototype.slice.call(
            image.closest(".experience-media").querySelectorAll(".experience-media-thumb img")
        );
        showImage(currentImages.indexOf(image));
        lightbox.hidden = false;
        document.body.classList.add("experience-lightbox-open");
        closeButton.focus();
    }

    images.forEach(function (image) {
        image.tabIndex = 0;
        image.setAttribute("role", "button");
        image.setAttribute("aria-label", labels.view + (image.alt || labels.image));
        image.addEventListener("click", function () {
            openLightbox(image);
        });
        image.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openLightbox(image);
            }
        });
    });

    closeButton.addEventListener("click", closeLightbox);
    previousButton.addEventListener("click", function () {
        showImage(currentIndex - 1);
    });
    nextButton.addEventListener("click", function () {
        showImage(currentIndex + 1);
    });
    lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (event) {
        if (lightbox.hidden) return;
        if (event.key === "Escape") closeLightbox();
        if (event.key === "ArrowLeft") showImage(currentIndex - 1);
        if (event.key === "ArrowRight") showImage(currentIndex + 1);
        if (event.key === "Tab") {
            var buttons = Array.prototype.filter.call(lightbox.querySelectorAll("button"), function (button) { return !button.hidden; });
            var index = buttons.indexOf(document.activeElement);
            event.preventDefault();
            buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
        }
    });
})();
