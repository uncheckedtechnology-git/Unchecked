const fs = require("fs");
const path = require("path");

function fixThemeImport(content) {
  // Finds `import { ... } from "../../theme";` where `useTheme` is imported, but `colors` is not.
  // And we will append `colors` to it.
  if (!content.includes("from ") || !content.includes("theme")) return content;
  
  // Regex to match the import statement
  const regex = /import\s*\{([^}]*useTheme[^}]*)\}\s*from\s*(['"].*?theme.*?['"]);?/g;
  
  return content.replace(regex, (match, importsStr, modulePath) => {
    if (importsStr.includes("colors")) return match; // Already has colors
    return `import { colors, ${importsStr.trim()} } from ${modulePath};`;
  });
}

function crawl(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      crawl(fullPath);
    } else if (f.endsWith(".js")) {
      const original = fs.readFileSync(fullPath, "utf8");
      
      // Try to fix useTheme imports first
      let updated = fixThemeImport(original);
      
      // If the file STILL uses `colors.` but doesn't import `colors` anywhere, 
      // we just inject it at the top of the file as a fallback, assuming it's in a screen or component.
      if (updated.includes("colors.") && !updated.includes("colors")) {
           // wait, if it includes colors., it includes "colors" so the above check is flawed.
      }
      
      // Check if `colors.` is used but `colors` isn't imported from theme
      if (updated.includes("colors.") && !updated.match(/import\s*\{.*?\bcolors\b.*?\}\s*from\s*['"].*?theme.*?['"]/)) {
           // We just prepend the import if it's not there.
           // How many ../s?
           const depth = fullPath.split("/").length - 2; // e.g. src/screens/X.js -> 3 -> depth 1 -> ../
           const prefix = depth === 1 ? "../" : "../../";
           updated = `import { colors } from "${prefix}theme";\n` + updated;
      }
      
      if (original !== updated) {
        fs.writeFileSync(fullPath, updated, "utf8");
        console.log("Fixed " + fullPath);
      }
    }
  }
}

try {
  crawl("src/screens");
  crawl("src/components");
  crawl("src/navigation");
  console.log("Done");
} catch(e) {
  console.error(e);
}
