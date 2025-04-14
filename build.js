const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const chokidar = require('chokidar');

// Configuration
const config = {
    contentDir: 'content',
    outputDir: 'docs',
    templateFile: 'template.html',
    siteName: 'Sol Good Media' // Updated site name
};

// Ensure output directory exists
fs.ensureDirSync(config.outputDir);
fs.ensureDirSync(path.join(config.outputDir, 'css'));
fs.ensureDirSync(path.join(config.outputDir, 'js'));

// Copy static assets
fs.copySync('css', path.join(config.outputDir, 'css'));
fs.copySync('js', path.join(config.outputDir, 'js'));

// Read template
const template = fs.readFileSync(config.templateFile, 'utf8');

function buildPage(markdownPath) {
    const content = fs.readFileSync(markdownPath, 'utf8');
    const html = marked(content);
    
    // Extract title from first h1
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled';
    
    // Replace template placeholders
    let page = template
        .replace('{{title}}', title)
        .replace('{{site_name}}', config.siteName)
        .replace('{{content}}', html);
    
    // Determine output path
    const relativePath = path.relative(config.contentDir, markdownPath);
    let outputPath;
    
    // Special handling for index.md
    if (path.basename(markdownPath) === 'index.md') {
        outputPath = path.join(config.outputDir, 'index.html');
    } else {
        outputPath = path.join(
            config.outputDir,
            relativePath.replace(/\.md$/, '.html')
        );
    }
    
    // Ensure directory exists
    fs.ensureDirSync(path.dirname(outputPath));
    
    // Write file
    fs.writeFileSync(outputPath, page);
    console.log(`Built: ${outputPath}`);
}

function buildAll() {
    // Find all markdown files
    const files = fs.readdirSync(config.contentDir, { recursive: true })
        .filter(file => file.endsWith('.md'));
    
    // Build each file
    files.forEach(file => {
        buildPage(path.join(config.contentDir, file));
    });
}

// Check if watch mode is enabled
const isWatchMode = process.argv.includes('--watch');

if (isWatchMode) {
    console.log('Watching for changes...');
    chokidar.watch([config.contentDir, config.templateFile]).on('change', (path) => {
        console.log(`Change detected in ${path}`);
        if (path.endsWith('.md')) {
            buildPage(path);
        } else {
            buildAll();
        }
    });
} else {
    buildAll();
} 