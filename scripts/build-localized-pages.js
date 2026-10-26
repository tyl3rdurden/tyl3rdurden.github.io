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
    },
    ko: {
        output: path.join(__dirname, '..', 'kr', 'index.html'),
    }
};

const TEXT_ONLY_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

function applyLocalization(html, lang, strings) {
    const $ = cheerio.load(html, { decodeEntities: false });

    $('html').attr('lang', lang);

    Object.entries(strings).forEach(([key, value]) => {
        const el = $(`#${key}`);
        if (typeof value !== 'string' || el.length === 0) {
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
        } else if (hasChildren && !TEXT_ONLY_TAGS.has(tagName)) {
            // Preserve nested links and icons while replacing the element's own text.
            const textNodes = el.contents().filter((_, node) => node.type === 'text' && node.data.trim());
            if (textNodes.length) {
                const node = textNodes.get(0);
                node.data = node.data.replace(/\S(?:[\s\S]*\S)?/, () => value);
            }
        }
    });

    const siteUrl = 'https://tyl3rdurden.github.io';
    const pageUrl = `${siteUrl}${lang === 'ko' ? '/kr/' : '/'}`;
    const description = strings['page-description'] || strings['statement-line1'];
    $('meta[name="description"]').attr('content', description);
    $('meta[name="author"]').attr('content', lang === 'ko' ? '이준렬' : 'Joon Ryul Lee');
    $('<link>').attr({ rel: 'canonical', href: pageUrl }).appendTo('head');
    const metadata = {
        'og:type': 'website',
        'og:title': strings['page-title'],
        'og:description': description,
        'og:url': pageUrl,
        'og:locale': lang === 'ko' ? 'ko_KR' : 'en_US',
        'og:image': `${siteUrl}/assets/img/profile.jpg`,
        'og:image:alt': lang === 'ko' ? '이준렬 프로필 사진' : 'Joon Ryul Lee profile photo',
    };
    Object.entries(metadata).forEach(([property, content]) => {
        $('<meta>').attr({ property, content }).appendTo('head');
    });
    $('<meta>').attr({ name: 'twitter:card', content: 'summary' }).appendTo('head');

    $('#profile-image-container img').attr('alt', lang === 'ko' ? '이준렬 프로필 사진' : 'Joon Ryul Lee profile photo');
    $('#portfolio-image-hexgem').attr({ alt: lang === 'ko' ? 'HexGem 매치 3 퍼즐 게임 플레이' : 'HexGem match-3 puzzle gameplay', loading: 'lazy', decoding: 'async' });
    if (!strings['statement-line2']) {
        $('#statement-line2').remove();
        $('#personal-statement br').remove();
    }
    $('#portfolio-content-hexgem:empty').remove();

    if (lang === 'ko') {
        $('#status, #phone-address, .resume-download').remove();
        $('<link>').attr({ rel: 'preconnect', href: 'https://fonts.googleapis.com' }).appendTo('head');
        $('<link>').attr({ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }).appendTo('head');
        $('<link>').attr({ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap' }).appendTo('head');
        $('.navbar-toggler').attr('aria-label', '메뉴 열기 및 닫기');
        // Keep the Korean family and given name together without a layout whitespace gap.
        $('#main-name-heading').contents().filter((_, node) => node.type === 'text').remove();
        const labels = strings['media-labels'];
        $('.experience-media-chip, .experience-media-links a').each((_, element) => {
            const el = $(element);
            if (labels[el.text()]) el.text(labels[el.text()]);
        });
        $('#experience a').each((_, element) => {
            const el = $(element);
            if (el.text().trim() === 'Video') el.text('영상 보기');
        });
        $('.experience-media').each((_, element) => {
            const el = $(element);
            const experience = el.closest('[id^="experience-"]');
            const title = experience.attr('id') === 'experience-minlab'
                ? '5민랩 프로젝트'
                : experience.find('[id^="project-title-"]').first().text();
            el.attr('aria-label', `${title} 이미지`);
            el.find('.carousel-control-prev').attr('aria-label', `${title} 이전 이미지`);
            el.find('.carousel-control-next').attr('aria-label', `${title} 다음 이미지`);
            el.find('.carousel-control-prev .visually-hidden').text('이전');
            el.find('.carousel-control-next .visually-hidden').text('다음');
            el.find('[data-bs-slide-to]').each((index, button) => $(button).attr('aria-label', `이미지 ${index + 1}`));
            el.find('img').each((_, image) => {
                const img = $(image);
                const caption = img.siblings('.experience-media-chip').text();
                const imageTitle = experience.attr('id') === 'experience-minlab'
                    ? (img.attr('src').includes('dinkum') ? strings['project-title-dingcom'] : strings['project-title-openworld'])
                    : title;
                img.attr('alt', `${imageTitle} — ${caption}`);
            });
        });
    }

    return $.html().replace(/^[ \t]+$/gm, '');
}

Object.entries(languages).forEach(([lang, config]) => {
    const strings = localization[lang];

    if (!strings) {
        throw new Error(`Missing localization for language: ${lang}`);
    }

    const localizedHtml = applyLocalization(templateHtml, lang, strings);

    fs.mkdirSync(path.dirname(config.output), { recursive: true });
    fs.writeFileSync(config.output, localizedHtml);
});
