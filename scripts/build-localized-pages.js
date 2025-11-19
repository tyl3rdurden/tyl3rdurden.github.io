const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const localizationPath = path.join(__dirname, '..', 'localization.json');
const templatePath = path.join(__dirname, '..', 'templates', 'index.template.html');

const localization = JSON.parse(fs.readFileSync(localizationPath, 'utf8'));
const templateHtml = fs.readFileSync(templatePath, 'utf8');

const languages = {
    en: {
        output: path.join(__dirname, '..', 'index.html'),
        altHref: '/kr/',
        altLabel: '한국어'
    },
    ko: {
        output: path.join(__dirname, '..', 'kr', 'index.html'),
        altHref: '/',
        altLabel: 'English'
    }
};

const TEXT_ONLY_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

function applyLocalization(html, lang, strings, alternateConfig) {
    const $ = cheerio.load(html, { decodeEntities: false });

    $('html').attr('lang', lang);

    Object.entries(strings).forEach(([key, value]) => {
        const el = $(`#${key}`);
        if (el.length === 0) {
            return;
        }

        const tagName = (el.get(0).tagName || '').toUpperCase();
        const hasChildren = el.children().length > 0;

        if (tagName === 'A' || (!hasChildren && !TEXT_ONLY_TAGS.has(tagName))) {
            el.text(value);

            if (tagName === 'A') {
                const href = el.attr('href') || '';
                if (href.startsWith('mailto:')) {
                    el.attr('href', `mailto:${value}`);
                }
            }
        }
    });

    $('[data-lang-link="alternate"]').each((_, element) => {
        const $link = $(element);
        $link.attr('href', alternateConfig.altHref);
        const label = $link.find('span').first();
        if (label.length) {
            label.text(alternateConfig.altLabel);
        }
    });

    return $.html();
}

Object.entries(languages).forEach(([lang, config]) => {
    const strings = localization[lang];

    if (!strings) {
        throw new Error(`Missing localization for language: ${lang}`);
    }

    const localizedHtml = applyLocalization(templateHtml, lang, strings, config);

    fs.mkdirSync(path.dirname(config.output), { recursive: true });
    fs.writeFileSync(config.output, localizedHtml);
});
