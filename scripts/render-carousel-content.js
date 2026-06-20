'use strict';

const projectImagePath = '/assets/img/projects/';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderThumb(slide, priority = false) {
    const classes = ['experience-media-thumb'];
    if (slide.fit === 'contain') classes.push('is-contain');
    if (!slide.image) classes.push('experience-media-empty');

    const media = slide.image
        ? `<img src="${projectImagePath}${escapeHtml(slide.image)}" alt="${escapeHtml(slide.alt || '')}" loading="eager" decoding="async"${priority ? ' fetchpriority="high"' : ''}>`
        : `<i class="${escapeHtml(slide.icon)}" aria-hidden="true"></i>`;

    return `<div class="${classes.join(' ')}">${media}<span class="experience-media-chip">${escapeHtml(slide.label)}</span></div>`;
}

function renderLinks(links = []) {
    return links.map(link =>
        `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`
    ).join('');
}

function renderMedia(media) {
    const links = renderLinks(media.links);

    if (media.slides.length === 1) {
        return `<aside class="experience-media" aria-label="${escapeHtml(media.ariaLabel)}">${renderThumb(media.slides[0], true)}<div class="experience-media-links">${links}</div></aside>`;
    }

    const indicators = media.slides.map((slide, index) =>
        `<li data-target="#${escapeHtml(media.id)}" data-slide-to="${index}"${index === 0 ? ' class="active"' : ''}></li>`
    ).join('');

    const slides = media.slides.map((slide, index) =>
        `<div class="carousel-item${index === 0 ? ' active' : ''}">${renderThumb(slide, index === 0)}</div>`
    ).join('');

    return `<aside class="experience-media" aria-label="${escapeHtml(media.ariaLabel)}"><div id="${escapeHtml(media.id)}" class="carousel slide experience-carousel" data-ride="carousel" data-interval="false"><ol class="carousel-indicators">${indicators}</ol><div class="carousel-inner">${slides}</div><a class="carousel-control-prev" href="#${escapeHtml(media.id)}" role="button" data-slide="prev" aria-label="${escapeHtml(media.previousLabel)}"><span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="sr-only">Previous</span></a><a class="carousel-control-next" href="#${escapeHtml(media.id)}" role="button" data-slide="next" aria-label="${escapeHtml(media.nextLabel)}"><span class="carousel-control-next-icon" aria-hidden="true"></span><span class="sr-only">Next</span></a></div><div class="experience-media-links">${links}</div></aside>`;
}

module.exports = function renderCarouselContent(carouselData) {
    const renderedCarousels = Object.keys(carouselData).reduce((rendered, key) => {
        rendered[key] = renderMedia(carouselData[key]);
        return rendered;
    }, {});

    const carouselPreloads = Object.values(carouselData)
        .flatMap(carousel => carousel.slides)
        .filter(slide => slide.image)
        .map(slide => `<link rel="preload" as="image" href="${projectImagePath}${escapeHtml(slide.image)}">`)
        .join('');

    return { carouselPreloads, renderedCarousels };
};
