const result = require('esbuild').buildSync({
    entryPoints: ['src/app.ts'],
    outdir: './dist',
    target: ['ES6'],
    color: true,
    metafile: true,
    bundle: true
});

const fs = require('fs');
const filesToCopy = [
    "component.html",
    "config.html",
    
    "jquery-3.6.0.min.js",

    "leaflet.css",
    "overlay.css"
]

function copyFileToDist(libfilename)
{
    const data = fs.readFileSync(`./lib/${libfilename}`);
    fs.writeFileSync(`./dist/${libfilename}`, data);
}

filesToCopy.map(copyFileToDist)

fs.writeFileSync('./meta.json', JSON.stringify(result.metafile));