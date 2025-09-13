// mergeComponents.js
const fs = require("fs");
const path = require("path");

const componentsDir = path.join(__dirname,  "components");
const outputFile = path.join(__dirname,  "AllComponents.tsx");

// Read all files in the components folder
fs.readdir(componentsDir, (err, files) => {
  if (err) {
    console.error("Error reading components folder:", err);
    return;
  }

  // Filter for .tsx or .ts files
  const tsxFiles = files.filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));

  const contents = tsxFiles.map((file) => {
    const fullPath = path.join(componentsDir, file);
    const code = fs.readFileSync(fullPath, "utf-8");
    return `// ---- ${file} ----\n${code}\n`;
  });

  const mergedContent = contents.join("\n");

  fs.writeFileSync(outputFile, mergedContent, "utf-8");
  console.log(`✅ All components merged into ${outputFile}`);
});