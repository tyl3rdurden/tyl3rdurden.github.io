'use strict';

const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const inputs = ['src', 'assets', 'templates', 'localization.json', 'content'];
const watcher = chokidar.watch(inputs, { cwd: root, ignoreInitial: true });

let timer;
let building = false;
let pendingCommand;
let activeCommand;

function build() {
    if (building || !pendingCommand) return;

    building = true;
    const command = pendingCommand;
    activeCommand = command;
    pendingCommand = undefined;
    const child = spawn(command, { cwd: root, shell: true, stdio: 'inherit' });
    child.on('error', error => {
        console.error('Build could not start:', error);
        building = false;
    });
    child.on('exit', code => {
        building = false;
        activeCommand = undefined;
        if (code !== 0) console.error(`Build failed with exit code ${code}`);
        if (pendingCommand) build();
    });
}

watcher.on('all', (event, filePath) => {
    if (!['add', 'change', 'unlink'].includes(event)) return;
    if (activeCommand === 'npm run build' && /^templates[\\/]/.test(filePath)) return;
    console.log(`### INFO: ${event}: ${filePath}`);
    const command = /^(templates[\\/]|localization\.json$)/.test(filePath)
        ? 'npm run build:locales'
        : 'npm run build';
    if (command === 'npm run build' || !pendingCommand) pendingCommand = command;
    clearTimeout(timer);
    timer = setTimeout(build, 200);
});

watcher.on('ready', () => console.log(`Watching ${inputs.join(', ')}`));
watcher.on('error', error => console.error('Watcher error:', error));
