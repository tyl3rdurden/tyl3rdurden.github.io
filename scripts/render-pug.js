'use strict';
const fs = require('fs');
const path = require('path');
const pug = require('pug');
const sh = require('shelljs');
const prettier = require('prettier');
const renderCarouselContent = require('./render-carousel-content');

module.exports = function renderPug(filePath) {
    const destPath = filePath.replace(/src[\/\\]pug[\/\\]/, 'dist/').replace(/\.pug$/, '.html');
    const destPaths = [destPath];
    const srcPath = path.resolve(path.dirname(__filename), '../src');
    const templatePath = path.resolve(path.dirname(__filename), '../templates/index.template.html');
    const carouselDataPath = path.resolve(path.dirname(__filename), '../content/carousels.json');
    const carouselData = JSON.parse(fs.readFileSync(carouselDataPath, 'utf8'));
    const { carouselPreloads, renderedCarousels } = renderCarouselContent(carouselData);

    if (path.basename(filePath) === 'index.pug') {
        destPaths.push(templatePath);
    }

    console.log(`### INFO: Rendering ${filePath} to ${destPaths.join(', ')}`);
    const html = pug.renderFile(filePath, {
        doctype: 'html',
        filename: filePath,
        basedir: srcPath,
        carouselPreloads,
        renderedCarousels
    });

    const prettified = prettier.format(html, {
        printWidth: 1000,
        tabWidth: 4,
        singleQuote: true,
        proseWrap: 'preserve',
        endOfLine: 'lf',
        parser: 'html',
        htmlWhitespaceSensitivity: 'ignore'
    });

    destPaths.forEach(destPath => {
        const destPathDirname = path.dirname(destPath);
        if (!sh.test('-e', destPathDirname)) {
            sh.mkdir('-p', destPathDirname);
        }

        fs.writeFileSync(destPath, prettified);
    });
};
