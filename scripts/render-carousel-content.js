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

function renderThumb(slide) {
    const classes = ['experience-media-thumb'];
    if (slide.fit === 'contain') classes.push('is-contain');
    if (!slide.image) classes.push('experience-media-empty');

    const media = slide.image
        ? `<img src="${projectImagePath}${escapeHtml(slide.image)}" alt="${escapeHtml(slide.alt || '')}" loading="lazy" decoding="async">`
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
        return `<aside class="experience-media" aria-label="${escapeHtml(media.ariaLabel)}">${renderThumb(media.slides[0])}<div class="experience-media-links">${links}</div></aside>`;
    }

    const indicators = media.slides.map((slide, index) =>
        `<button type="button" data-bs-target="#${escapeHtml(media.id)}" data-bs-slide-to="${index}" aria-label="Slide ${index + 1}"${index === 0 ? ' class="active" aria-current="true"' : ''}></button>`
    ).join('');

    const slides = media.slides.map((slide, index) =>
        `<div class="carousel-item${index === 0 ? ' active' : ''}">${renderThumb(slide)}</div>`
    ).join('');

    return `<aside class="experience-media" aria-label="${escapeHtml(media.ariaLabel)}"><div id="${escapeHtml(media.id)}" class="carousel slide experience-carousel" data-bs-interval="false"><div class="carousel-indicators">${indicators}</div><div class="carousel-inner">${slides}</div><button class="carousel-control-prev" type="button" data-bs-target="#${escapeHtml(media.id)}" data-bs-slide="prev" aria-label="${escapeHtml(media.previousLabel)}"><span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous</span></button><button class="carousel-control-next" type="button" data-bs-target="#${escapeHtml(media.id)}" data-bs-slide="next" aria-label="${escapeHtml(media.nextLabel)}"><span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next</span></button></div><div class="experience-media-links">${links}</div></aside>`;
}

module.exports = function renderCarouselContent(carouselData) {
    const renderedCarousels = Object.keys(carouselData).reduce((rendered, key) => {
        rendered[key] = renderMedia(carouselData[key]);
        return rendered;
    }, {});

    // Project galleries sit below the introduction; let the browser load them on demand.
    const carouselPreloads = '';

    return { carouselPreloads, renderedCarousels };
};
