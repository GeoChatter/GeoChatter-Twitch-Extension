if (typeof require === "undefined")
    throw new Error("node is required to build");

/** Building Tool Dependencies */
const fs = require('fs');
const archiver = require('archiver');
const esbuild = require('esbuild');

/** lib files to copy to dist */
const filesToCopy = [
    "component.html",
    "config.html",
    
    "jquery-3.6.0.min.js",

    "leaflet.css",
    "overlay.css"
];

/** build directories to be removed before build */
const buildDirs = [
    "./dist",
    "./build",
    "./decl"
];

/** Main app build meta path */
const MAIN_META = './meta-main.json';
/** App config file build meta path */
const CONFIG_META = './meta-config.json';
/** App config file build meta path */
const DIST_ZIP = './dist.zip';

/** Copy file to ./dist */
function copyFileToDist(libfilename)
{
    try 
    {
        console.log(`\r\nTRY  Copy file '${libfilename}' to dist`)
        const data = fs.readFileSync(`./lib/${libfilename}`);
        fs.writeFileSync(`./dist/${libfilename}`, data);
        console.log(`OKAY Copy file '${libfilename}' to dist\r\n`)
    } 
    catch(err) 
    {
        console.error(`FAIL Copy file '${libfilename}'. ${err}\r\n`)
    }
}

/** Remove given directory and its contents */
function forceRemoveDirectory(directory)
{
    try 
    {
        console.log(`\r\nTRY  Remove directory '${directory}'`)
        fs.rmSync(directory, { recursive: true, force: true });
        console.log(`OKAY Remove directory '${directory}'\r\n`)
    } 
    catch(err) 
    {
        console.error(`FAIL Remove directory '${directory}'. ${err}\r\n`)
    }
}

/** Remove the file at given path */
function removeFile(filepath)
{
    try 
    {
        console.log(`\r\nTRY  Remove file '${filepath}'`)
        fs.unlinkSync(filepath)
        console.log(`OKAY Remove file '${filepath}'\r\n`)
    } 
    catch(err) 
    {
        console.error(`FAIL Remove file '${filepath}'. ${err}\r\n`)
    }
}

/** Create dist.zip for Twitch */
function zipDist()
{
    var output = fs.createWriteStream(DIST_ZIP);
    var archive = archiver('zip');

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('Archiver has been finalized and the output file descriptor has closed.');
    });

    archive.on('error', function(err){
        throw err;
    });

    archive.pipe(output);

    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory("./dist", false);

    archive.finalize();
}

/** Entry point */
async function Build()
{
    /** Clean build folders */
    buildDirs.map(forceRemoveDirectory);
    removeFile(MAIN_META);
    removeFile(CONFIG_META);
    removeFile(DIST_ZIP);

    /** Sleep for a second */
    await new Promise((res) => setTimeout(res, 1000));

    /** Build the extension source */
    console.log(`Building main.ts...`)
    const main = esbuild.buildSync({
        entryPoints: ['src/main.ts'],
        outdir: './dist',
        target: ['ES6'],
        color: true,
        metafile: true,
        bundle: true
    });

    /** Build the extension config */
    console.log(`Building config.ts...`)
    const config = esbuild.buildSync({
        entryPoints: ['src/config/config.ts'],
        outdir: './dist',
        target: ['ES6'],
        tsconfig: 'tsconfig.other.json',
        color: true,
        metafile: true,
        bundle: true
    });

    /** Copy rest of the files to dist */
    filesToCopy.map(copyFileToDist);

    /** Write build meta files */
    console.log(`Writing main meta '${MAIN_META}'`)
    fs.writeFileSync(MAIN_META, JSON.stringify(main.metafile));

    console.log(`Writing config meta '${CONFIG_META}'`)
    fs.writeFileSync(CONFIG_META, JSON.stringify(config.metafile));

    /** Create a zip archive of the output for Twitch */
    zipDist()
}

Build()
    .then(() => console.log("Build succeeded"))
    .catch(() => console.error("Build FAILED!"));