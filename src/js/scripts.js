(function ($) {
    "use strict"; // Start of use strict

    // Smooth scrolling using jQuery easing
    $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function () {
        if (
            location.pathname.replace(/^\//, "") ==
                this.pathname.replace(/^\//, "") &&
            location.hostname == this.hostname
        ) {
            var target = $(this.hash);
            target = target.length
                ? target
                : $("[name=" + this.hash.slice(1) + "]");
            if (target.length) {
                $("html, body").animate(
                    {
                        scrollTop: target.offset().top,
                    },
                    1000,
                    "easeInOutExpo"
                );
                return false;
            }
        }
    });

    // Closes responsive menu when a scroll trigger link is clicked
    $(".js-scroll-trigger").click(function () {
        $(".navbar-collapse").collapse("hide");
    });

    // Activate scrollspy to add active class to navbar items on scroll
    $("body").scrollspy({
        target: "#sideNav",
    });
})(jQuery); // End of use strict

(function () {
    "use strict";

    var images = document.querySelectorAll(".experience-media-thumb img");
    if (!images.length) return;

    var lightbox = document.createElement("div");
    lightbox.className = "experience-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Expanded project image");
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
        image.setAttribute("aria-label", "View larger: " + (image.alt || "project image"));
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
    });
})();
