'use strict';
const path = require('path');
const sh = require('shelljs');

module.exports = function renderAssets() {
    const sourcePath = path.resolve(path.dirname(__filename), '../assets');
    const destPath = path.resolve(path.dirname(__filename), '../dist/.');
    
    sh.cp('-R', sourcePath, destPath)
};
