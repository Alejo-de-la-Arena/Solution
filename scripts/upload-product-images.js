require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = process.env.SUPABASE_BUCKET || "solution-products";
const INPUT_DIR = path.resolve(process.env.INPUT_DIR || path.join(process.cwd(), "assets-optimized"));

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

async function uploadFile(localPath) {
    const relativePath = path.relative(INPUT_DIR, localPath).replace(/\\/g, "/");
    const fileBuffer = fs.readFileSync(localPath);

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(relativePath, fileBuffer, {
            contentType: "image/webp",
            upsert: true,
        });

    if (error) {
        console.error(`✘ Error subiendo ${relativePath}: ${error.message}`);
        return;
    }

    console.log(`✔ Subido: ${relativePath}`);
}

async function main() {
    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`No existe la carpeta de entrada: ${INPUT_DIR}`);
        process.exit(1);
    }

    const files = getAllFiles(INPUT_DIR).filter((file) => file.endsWith(".webp"));

    for (const file of files) {
        await uploadFile(file);
    }

    console.log("\n✅ Upload terminado");
}

main().catch((err) => {
    console.error("Error en upload:", err);
    process.exit(1);
});