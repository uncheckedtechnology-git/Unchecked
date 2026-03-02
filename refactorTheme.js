const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            walk(path.join(dir, file), fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(path.join(dir, file));
        }
    }
    return fileList;
}

const targetDirs = [
    path.join(__dirname, 'src', 'screens'),
    path.join(__dirname, 'src', 'navigation')
];

let files = [];
for (const dir of targetDirs) {
    if (fs.existsSync(dir)) walk(dir, files);
}

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Check if it imports colors from theme
    if (content.includes('colors') && /from ['"](?:\.\.\/)+theme['"]/.test(content)) {
        // Replace `colors,` or `, colors` or `{ colors }` in imports
        // Safest way: replace `colors` with `useTheme` in the theme import line.

        // Find the import line
        const importRegex = /import\s+\{([^}]*)\}\s+from\s+['"](?:\.\.\/)+theme['"];/g;
        content = content.replace(importRegex, (match, p1) => {
            if (p1.includes('colors')) {
                let newP1 = p1.replace(/\bcolors\b/, 'useTheme');
                return match.replace(p1, newP1);
            }
            return match;
        });

        // 2. Inject const { colors } = useTheme(); into the component definition
        // Usually it's `export default function ScreenName(...) {`
        // Or `function ScreenName(...) {`
        // Or `const ScreenName = (...) => {`

        // We only want to inject it ONCE per file, inside the main exported component.
        const funcRegex = /export\s+default\s+(?:function|const)\s+([A-Za-z0-9_]+)\s*(?:=|)\s*(?:\([^)]*\))?\s*(?:=>\s*)?\{/;

        if (funcRegex.test(content) && !content.includes('const { colors } = useTheme();')) {
            content = content.replace(funcRegex, (match) => {
                return match + '\n  const { colors } = useTheme();';
            });
            changed = true;
        } else {
            // Fallback: just look for `function Name() {` that matches the filename
            const basename = path.basename(file, '.js');
            const fallbackRegex = new RegExp(`function\\s+${basename}\\s*\\([^)]*\\)\\s*\\{`);
            if (fallbackRegex.test(content) && !content.includes('const { colors } = useTheme();')) {
                content = content.replace(fallbackRegex, (match) => {
                    return match + '\n  const { colors } = useTheme();';
                });
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated:', file);
        }
    }
}
