import fs from 'fs';
import path from 'path';

function parseHtmlToJsx(htmlContent, componentName) {
    let jsx = htmlContent;
    jsx = jsx.replace(/class=/g, 'className=');
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    jsx = jsx.replace(/<!--/g, '{/*');
    jsx = jsx.replace(/-->/g, '*/}');
    
    // Fix self closing tags
    jsx = jsx.replace(/<img([^>]*?)(?<!\/)>/g, '<img$1 />');
    jsx = jsx.replace(/<input([^>]*?)(?<!\/)>/g, '<input$1 />');
    jsx = jsx.replace(/<hr([^>]*?)(?<!\/)>/g, '<hr$1 />');
    jsx = jsx.replace(/<br([^>]*?)(?<!\/)>/g, '<br$1 />');

    // Remove inline styles since React inline style needs object
    // For simplicity, we just strip style attribute if it's there
    jsx = jsx.replace(/style="[^"]*"/g, '');

    const bodyMatch = jsx.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
        jsx = bodyMatch[1];
    }
    
    const reactCode = `import React from 'react';

const ${componentName} = () => {
  return (
    <div className="${componentName.toLowerCase()}-container">
      ${jsx}
    </div>
  );
};

export default ${componentName};
`;
    return reactCode;
}

const files = [
    "Landing_Dark", "Dashboard_Dark", "FileUpload_Dark",
    "AnalysisResults_Dark", "ChatInterface_Dark", "ReviewDetail_Dark"
];

if (!fs.existsSync('src/screens')) {
    fs.mkdirSync('src/screens', { recursive: true });
}

files.forEach(f => {
    const htmlPath = `${f}.html`;
    if (fs.existsSync(htmlPath)) {
        const content = fs.readFileSync(htmlPath, 'utf8');
        const jsxContent = parseHtmlToJsx(content, f);
        fs.writeFileSync(`src/screens/${f}.jsx`, jsxContent, 'utf8');
    }
});
