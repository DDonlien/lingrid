const fs = require("fs");
const path = require("path");

/**
 * Build script for Lingrid marketing site.
 * Copies website/ into dist/ (GitHub Actions) or dist-site/ (local).
 * In CI, this produces a combined output where:
 *   dist/           = website (landing page)
 *   dist/app/       = React application
 */

const isCI = process.env.GITHUB_ACTIONS === "true";
const srcDir = path.resolve(__dirname, "..", "website");
const outDir = isCI
  ? path.resolve(__dirname, "..", "dist")
  : path.resolve(__dirname, "..", "dist-site");

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// In CI, dist/ already contains the app at dist/app/ from vite build.
// We copy website files into dist/ root, which provides the landing page.
// If dist/ doesn't have app/ yet (local dev), we just copy to dist-site/.
copyDir(srcDir, outDir);

console.log(`Site built: ${srcDir} → ${outDir}`);
if (isCI) {
  console.log("  App remains at dist/app/");
  console.log("  Landing page served from dist/");
} else {
  console.log("  Run npx serve dist-site/ to preview locally");
}
