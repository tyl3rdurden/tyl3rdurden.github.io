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

function syncDirectory(source, destination) {
    if (!sh.test('-e', source)) {
        return;
    }

    sh.rm('-rf', destination);
    sh.mkdir('-p', path.dirname(destination));
    sh.cp('-R', source, destination);
}

copyFile(
    path.join(rootPath, 'dist', 'css', 'styles.css'),
    path.join(rootPath, 'css', 'styles.css')
);

copyFile(
    path.join(rootPath, 'dist', 'js', 'scripts.js'),
    path.join(rootPath, 'js', 'scripts.js')
);

syncDirectory(
    path.join(rootPath, 'dist', 'assets', 'img', 'projects'),
    path.join(rootPath, 'assets', 'img', 'projects')
);
