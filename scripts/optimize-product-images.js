const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const INPUT_DIR = path.resolve(process.env.INPUT_DIR || path.join(process.cwd(), "assets-raw"));
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || path.join(process.cwd(), "assets-optimized"));

const SIZES = {
    thumb: { width: 700, height: 900, quality: 82 },
    medium: { width: 1200, height: 1600, quality: 84 },
    large: { width: 1800, height: 2400, quality: 86 },
};

const VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function getAllFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(getAllFiles(fullPath));
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

function slugifyFileName(fileName) {
    return fileName
        .toLowerCase()
        .trim()
        .replace(/\.[^/.]+$/, "")
        .replace(/\s+/g, "-")
        .replace(/_+/g, "-")
        .replace(/[^\w-]+/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function detectKind(baseName, folderName) {
    const v = `${folderName} ${baseName}`.toLowerCase();

    if (v.includes("combo")) return "box";
    if (v.includes("model") || v.includes("modelo")) return "model";
    if (v.includes("nota") || v.includes("notas")) return "lifestyle";
    if (v.includes("bg")) return "hero";
    if (v.includes("arriba")) return "hero";
    if (v.includes("individual")) return "packshot";

    return "gallery";
}

async function processImage(inputFile, topFolderName) {
    const ext = path.extname(inputFile).toLowerCase();
    if (!VALID_EXTENSIONS.includes(ext)) return;

    const originalBaseName = path.basename(inputFile, ext);
    const safeBaseName = slugifyFileName(originalBaseName);
    const kind = detectKind(safeBaseName, topFolderName);

    for (const [sizeKey, config] of Object.entries(SIZES)) {
        const outDir = path.join(OUTPUT_DIR, topFolderName, sizeKey);
        ensureDir(outDir);

        const outPath = path.join(outDir, `${safeBaseName}.webp`);

        await sharp(inputFile)
            .rotate()
            .resize(config.width, config.height, {
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({ quality: config.quality })
            .toFile(outPath);

        console.log(`✔ ${topFolderName}/${sizeKey}/${safeBaseName}.webp [${kind}]`);
    }
}

async function main() {
    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`No existe la carpeta de entrada: ${INPUT_DIR}`);
        process.exit(1);
    }

    ensureDir(OUTPUT_DIR);

    const topFolders = fs.readdirSync(INPUT_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

    for (const folderName of topFolders) {
        const folderPath = path.join(INPUT_DIR, folderName);
        const files = getAllFiles(folderPath);

        for (const file of files) {
            await processImage(file, folderName);
        }
    }

    console.log("\n✅ Optimización terminada");
    console.log(`Entrada: ${INPUT_DIR}`);
    console.log(`Salida: ${OUTPUT_DIR}`);
}

main().catch((err) => {
    console.error("Error en optimización:", err);
    process.exit(1);
});