#!/usr/bin/env python3
"""Re-scrape general/core rules and crusade rules from downloaded wahapedia HTML."""

from bs4 import BeautifulSoup, Tag, NavigableString
import json
import re
import os

def clean_text(text):
    """Clean up extracted text."""
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove ad-related text
    text = re.sub(r'Advertisement\s*', '', text)
    return text

def get_section_text(el):
    """Get clean text from an element, handling tables specially."""
    if el.name == 'table':
        rows = []
        for tr in el.select('tr'):
            cells = [clean_text(td.get_text()) for td in tr.select('td, th')]
            if any(c for c in cells):
                rows.append(cells)
        if rows:
            return "[TABLE: " + json.dumps(rows) + "]"
        return ""

    text = clean_text(el.get_text())
    return text if len(text) > 2 else ""

def extract_section_content(start_el, stop_tags=None):
    """Extract all content from start element until next h2."""
    parts = []
    subsections = []
    el = start_el.next_sibling

    while el:
        if isinstance(el, Tag):
            cls = ' '.join(el.get('class', []))

            # Skip fluff and ads
            if any(skip in cls for skip in ['ShowFluff', 'noprint', 'page_breaker', 'page_ads']):
                el = el.next_sibling
                continue

            # Stop at next h2
            if el.name == 'h2':
                break

            # h3 = subsection header
            if el.name in ('h3', 'h4'):
                sub_name = clean_text(el.get_text())
                if sub_name:
                    subsections.append(sub_name)
                    parts.append(f"[{sub_name}]")
            elif el.name == 'table':
                table_text = get_section_text(el)
                if table_text:
                    parts.append(table_text)
            elif el.name == 'div':
                # Recurse into divs
                div_cls = ' '.join(el.get('class', []))
                if any(skip in div_cls for skip in ['ShowFluff', 'noprint', 'page_breaker', 'page_ads', 'legend2']):
                    el = el.next_sibling
                    continue
                div_text = extract_div_content(el)
                if div_text:
                    parts.extend(div_text)
            elif el.name == 'p':
                text = clean_text(el.get_text())
                if text and len(text) > 2:
                    parts.append(text)
            elif el.name in ('ul', 'ol'):
                items = []
                for li in el.find_all('li', recursive=False):
                    item_text = clean_text(li.get_text())
                    if item_text:
                        items.append(f"- {item_text}")
                if items:
                    parts.append(" ".join(items))

        el = el.next_sibling

    return " ".join(parts), subsections

def extract_div_content(div):
    """Recursively extract content from a div."""
    parts = []
    cls = ' '.join(div.get('class', []))

    if any(skip in cls for skip in ['ShowFluff', 'noprint', 'page_breaker', 'page_ads', 'legend2']):
        return parts

    for child in div.children:
        if isinstance(child, NavigableString):
            text = clean_text(str(child))
            if text and len(text) > 3:
                parts.append(text)
        elif isinstance(child, Tag):
            child_cls = ' '.join(child.get('class', []))
            if any(skip in child_cls for skip in ['ShowFluff', 'noprint', 'page_breaker', 'page_ads', 'legend2']):
                continue

            if child.name in ('h3', 'h4'):
                text = clean_text(child.get_text())
                if text:
                    parts.append(f"[{text}]")
            elif child.name == 'table':
                table_text = get_section_text(child)
                if table_text:
                    parts.append(table_text)
            elif child.name == 'p':
                text = clean_text(child.get_text())
                if text and len(text) > 2:
                    parts.append(text)
            elif child.name in ('ul', 'ol'):
                for li in child.find_all('li', recursive=False):
                    item_text = clean_text(li.get_text())
                    if item_text:
                        parts.append(f"- {item_text}")
            elif child.name in ('div', 'span', 'section'):
                sub = extract_div_content(child)
                parts.extend(sub)
            elif child.name in ('b', 'strong', 'i', 'em'):
                text = clean_text(child.get_text())
                if text and len(text) > 2:
                    parts.append(text)

    return parts


def scrape_core_rules(html_path):
    """Scrape core rules from downloaded HTML."""
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    sections = []

    # Special handling: Introduction comes before the first h2
    # Find all content before the first h2
    intro_parts = []
    body = soup.find('body') or soup
    first_h2 = body.find('h2')

    # Get h2 elements (these are section headers)
    h2s = soup.find_all('h2')

    # Add Introduction section
    intro_section = {"name": "Introduction", "text": "", "subsections": []}

    for h2 in h2s:
        cls = ' '.join(h2.get('class', []))
        name = clean_text(h2.get_text())

        if not name or name == 'Books':
            # Books section - extract book info
            if name == 'Books':
                # Get the parent's content
                parent = h2.parent
                text, subs = extract_section_content(h2)
                if not text or len(text) < 20:
                    # Try getting from parent div
                    div_parts = extract_div_content(parent)
                    text = " ".join(div_parts)
                sections.append({
                    "name": "Books",
                    "text": text,
                    "subsections": subs
                })
            continue

        # Extract content after this h2 until next h2
        text, subs = extract_section_content(h2)

        # If text is empty, try parent div
        if not text or len(text) < 10:
            parent = h2.parent
            if parent and parent.name == 'div':
                div_parts = extract_div_content(parent)
                # Filter out the header name itself
                div_parts = [p for p in div_parts if p != name and p != f"[{name}]"]
                text = " ".join(div_parts)
                # Extract subsection names from bracketed items
                for part in div_parts:
                    if part.startswith('[') and part.endswith(']'):
                        sub_name = part[1:-1]
                        if sub_name not in subs:
                            subs.append(sub_name)

        sections.append({
            "name": name,
            "text": text,
            "subsections": subs
        })

    # If Introduction is still empty, add a placeholder
    if not any(s['name'] == 'Introduction' for s in sections):
        sections.insert(0, intro_section)

    return sections


def scrape_crusade_rules(html_path):
    """Scrape crusade rules from downloaded HTML."""
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    sections = []
    h2s = soup.find_all('h2')

    for h2 in h2s:
        cls = ' '.join(h2.get('class', []))
        name = clean_text(h2.get_text())

        if not name:
            continue
        if name == 'Books' or 'outline_header' in cls:
            continue

        text, subs = extract_section_content(h2)

        if not text or len(text) < 10:
            parent = h2.parent
            if parent and parent.name == 'div':
                div_parts = extract_div_content(parent)
                div_parts = [p for p in div_parts if p != name and p != f"[{name}]"]
                text = " ".join(div_parts)

        sections.append({
            "name": name,
            "text": text,
            "subsections": subs
        })

    return sections


if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(base_dir) if base_dir.endswith('scripts') else base_dir

    core_html = os.path.join(project_dir, 'core_rules.html')
    crusade_html = os.path.join(project_dir, 'crusade_rules.html')

    print("=== Scraping Core Rules ===")
    core_sections = scrape_core_rules(core_html)
    print(f"Extracted {len(core_sections)} sections:")
    for s in core_sections:
        text_len = len(s['text']) if s['text'] else 0
        status = "OK" if text_len > 20 else "SHORT" if text_len > 0 else "EMPTY"
        print(f"  [{status}] {s['name']} ({text_len} chars, {len(s.get('subsections',[]))} subsections)")

    print("\n=== Scraping Crusade Rules ===")
    crusade_sections = scrape_crusade_rules(crusade_html)
    print(f"Extracted {len(crusade_sections)} sections:")
    for s in crusade_sections:
        text_len = len(s['text']) if s['text'] else 0
        status = "OK" if text_len > 20 else "SHORT" if text_len > 0 else "EMPTY"
        print(f"  [{status}] {s['name']} ({text_len} chars, {len(s.get('subsections',[]))} subsections)")

    # Save to source JSON for build-data.ts
    output_dir = os.path.join(project_dir, '..', '_backlog', 'Warhammer', 'datasheets', '_general')

    core_out = os.path.join(output_dir, 'core-rules.json')
    with open(core_out, 'w', encoding='utf-8') as f:
        json.dump({"name": "core-rules", "sections": core_sections}, f, indent=2, ensure_ascii=False)
    print(f"\nSaved core rules to {core_out}")

    crusade_out = os.path.join(output_dir, 'crusade-rules.json')
    with open(crusade_out, 'w', encoding='utf-8') as f:
        json.dump({"name": "crusade-rules", "sections": crusade_sections}, f, indent=2, ensure_ascii=False)
    print(f"Saved crusade rules to {crusade_out}")

    # Also output as a JS-friendly format that can update general.ts directly
    result = {
        "core_rules": {"name": "core-rules", "sections": core_sections},
        "crusade_rules": {"name": "crusade-rules", "sections": crusade_sections}
    }

    combined_out = os.path.join(project_dir, 'scripts', 'general-rules-data.json')
    with open(combined_out, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"Saved combined data to {combined_out}")
