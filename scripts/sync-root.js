'use strict';

const fs = require('fs');
const path = require('path');
const sh = require('shelljs');

const rootPath = path.resolve(path.dirname(__filename), '..');

function copyFile(source, destination) {
    const destinationDir = path.dirname(destination);

    if (!sh.test('-e', destinationDir)) {
        sh.mkdir('-p', destinationDir);
    }

    fs.copyFileSync(source, destination);
}

copyFile(
    path.join(rootPath, 'dist', 'css', 'styles.css'),
    path.join(rootPath, 'css', 'styles.css')
);

copyFile(
    path.join(rootPath, 'dist', 'js', 'scripts.js'),
    path.join(rootPath, 'js', 'scripts.js')
);

