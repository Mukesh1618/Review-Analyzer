import os
import re

def parse_html_to_jsx(html_content, component_name):
    # Very basic conversion for React
    jsx = html_content
    jsx = jsx.replace('class=', 'className=')
    jsx = jsx.replace('for=', 'htmlFor=')
    jsx = jsx.replace('<!--', '{/*')
    jsx = jsx.replace('-->', '*/}')
    
    # Fix self closing tags like img, input, hr, br
    jsx = re.sub(r'<img([^>]*?)(?<!/)>', r'<img\1 />', jsx)
    jsx = re.sub(r'<input([^>]*?)(?<!/)>', r'<input\1 />', jsx)
    jsx = re.sub(r'<hr([^>]*?)(?<!/)>', r'<hr\1 />', jsx)
    jsx = re.sub(r'<br([^>]*?)(?<!/)>', r'<br\1 />', jsx)

    # Remove HTML, HEAD, BODY tags
    body_match = re.search(r'<body[^>]*>(.*?)</body>', jsx, re.DOTALL | re.IGNORECASE)
    if body_match:
        jsx = body_match.group(1)
    
    # We will wrap it in a functional component
    react_code = f"""import React from 'react';

const {component_name} = () => {{
  return (
    <div className="{component_name.lower()}-container">
      {jsx}
    </div>
  );
}};

export default {component_name};
"""
    return react_code

def main():
    files = [
        "Landing_Dark", "Dashboard_Dark", "FileUpload_Dark",
        "AnalysisResults_Dark", "ChatInterface_Dark", "ReviewDetail_Dark"
    ]
    
    os.makedirs('src/screens', exist_ok=True)
    
    for f in files:
        html_path = f"{f}.html"
        if not os.path.exists(html_path):
            continue
            
        with open(html_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        jsx_content = parse_html_to_jsx(content, f)
        
        with open(f"src/pages/{f}.jsx", 'w', encoding='utf-8') as out_file:
            out_file.write(jsx_content)

if __name__ == "__main__":
    main()
