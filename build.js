const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const chokidar = require('chokidar');

// Configuration
const config = {
    contentDir: 'content',
    outputDir: 'docs',
    templateFile: 'template.html',
    blogTemplateFile: 'blog-template.html',
    blogDir: 'content/blog',
    siteName: 'Sol Good Media'
};

// Ensure output directory exists
fs.ensureDirSync(config.outputDir);
fs.ensureDirSync(path.join(config.outputDir, 'css'));
fs.ensureDirSync(path.join(config.outputDir, 'js'));
fs.ensureDirSync(path.join(config.outputDir, 'blog'));

// Copy static assets
fs.copySync('css', path.join(config.outputDir, 'css'));
fs.copySync('js', path.join(config.outputDir, 'js'));

// Read templates
const template = fs.readFileSync(config.templateFile, 'utf8');
const blogTemplate = fs.readFileSync(config.blogTemplateFile, 'utf8');

// Configure marked for syntax highlighting
marked.setOptions({
    highlight: function(code, lang) {
        return code;
    }
});

function extractFrontMatter(content) {
    const frontMatter = {};
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (frontMatterMatch) {
        const frontMatterContent = frontMatterMatch[1];
        frontMatterContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                frontMatter[key.trim()] = valueParts.join(':').trim();
            }
        });
        content = content.slice(frontMatterMatch[0].length).trim();
    }
    
    return { frontMatter, content };
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function buildBlogPost(markdownPath) {
    const content = fs.readFileSync(markdownPath, 'utf8');
    const { frontMatter, content: markdownContent } = extractFrontMatter(content);
    
    // Remove the title from the content since it's in the header
    const contentWithoutTitle = markdownContent.replace(/^#\s+.*$/m, '').trim();
    const html = marked(contentWithoutTitle);
    
    const title = frontMatter.title || 'Untitled';
    const date = frontMatter.date || new Date().toISOString().split('T')[0];
    const formattedDate = formatDate(date);
    const author = frontMatter.author || 'Sol Good Media';
    const description = frontMatter.description || '';
    
    let page = blogTemplate
        .replace(/\{\{title\}\}/g, title)
        .replace(/\{\{site_name\}\}/g, config.siteName)
        .replace(/\{\{content\}\}/g, html)
        .replace(/\{\{date\}\}/g, formattedDate)
        .replace(/\{\{author\}\}/g, author)
        .replace(/\{\{description\}\}/g, description);
    
    const relativePath = path.relative(config.blogDir, markdownPath);
    const outputPath = path.join(
        config.outputDir,
        'blog',
        relativePath.replace(/\.md$/, '.html')
    );
    
    fs.ensureDirSync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, page);
    console.log(`Built blog post: ${outputPath}`);
    
    return {
        title,
        date: formattedDate,
        author,
        description,
        url: path.join('blog', relativePath.replace(/\.md$/, '.html'))
    };
}

function buildPage(markdownPath) {
    const content = fs.readFileSync(markdownPath, 'utf8');
    const html = marked(content);
    
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled';
    
    let page = template
        .replace(/\{\{title\}\}/g, title)
        .replace(/\{\{site_name\}\}/g, config.siteName)
        .replace(/\{\{content\}\}/g, html);
    
    const relativePath = path.relative(config.contentDir, markdownPath);
    let outputPath;
    
    if (path.basename(markdownPath) === 'index.md') {
        outputPath = path.join(config.outputDir, 'index.html');
    } else {
        outputPath = path.join(
            config.outputDir,
            relativePath.replace(/\.md$/, '.html')
        );
    }
    
    fs.ensureDirSync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, page);
    console.log(`Built: ${outputPath}`);
}

function buildBlogIndex() {
    const blogPosts = fs.readdirSync(config.blogDir)
        .filter(file => file.endsWith('.md') && file !== 'index.md')
        .map(file => buildBlogPost(path.join(config.blogDir, file)))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const blogList = blogPosts.map(post => `
        <article class="blog-preview">
            <h2><a href="${post.url}">${post.title}</a></h2>
            <div class="blog-meta">
                <time datetime="${post.date}">${post.date}</time>
                <span class="author">By ${post.author}</span>
            </div>
            <p>${post.description}</p>
            <a href="${post.url}" class="read-more">Read more</a>
        </article>
    `).join('\n');
    
    let blogIndexContent = fs.readFileSync(path.join(config.contentDir, 'blog.md'), 'utf8');
    
    // Split the content at the blog posts placeholder
    const parts = blogIndexContent.split('{{blog_posts}}');
    
    // Convert the markdown parts to HTML
    const beforePosts = marked(parts[0]);
    const afterPosts = marked(parts[1] || '');
    
    // Combine everything
    const blogIndexHtml = beforePosts + blogList + afterPosts;
    
    let page = template
        .replace(/\{\{title\}\}/g, 'Blog')
        .replace(/\{\{site_name\}\}/g, config.siteName)
        .replace(/\{\{content\}\}/g, blogIndexHtml);
    
    const outputPath = path.join(config.outputDir, 'blog.html');
    fs.writeFileSync(outputPath, page);
    console.log(`Built blog index: ${outputPath}`);
}

function buildAll() {
    // Build regular pages
    const files = fs.readdirSync(config.contentDir, { recursive: true })
        .filter(file => file.endsWith('.md') && !file.startsWith('blog/'));
    
    files.forEach(file => {
        buildPage(path.join(config.contentDir, file));
    });
    
    // Build blog
    buildBlogIndex();
}

// Check if watch mode is enabled
const isWatchMode = process.argv.includes('--watch');

if (isWatchMode) {
    console.log('Watching for changes...');
    chokidar.watch([config.contentDir, config.templateFile, config.blogTemplateFile]).on('change', (path) => {
        console.log(`Change detected in ${path}`);
        if (path.startsWith(config.blogDir)) {
            buildBlogIndex();
        } else if (path.endsWith('.md')) {
            buildPage(path);
        } else {
            buildAll();
        }
    });
} else {
    buildAll();
} 