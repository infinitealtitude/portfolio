"""Check generated HTML and local references in the GitHub Pages build."""

from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids = set()
        self.references = []
        self.id_references = []
        self.errors = []
        if re.search(r"\{\{[A-Z_]+\}\}", source):
            self.errors.append("unresolved template placeholder")
        self.feed(source)
        self.close()

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if "id" in attributes:
            identifier = attributes["id"]
            if not identifier or identifier in self.ids:
                self.errors.append(f"missing or duplicate id {identifier!r}")
            self.ids.add(identifier)
        if tag == "img" and "alt" not in attributes:
            self.errors.append(f"{attributes.get('src', '<img>')!r} has no alt attribute")
        for name in ("href", "src"):
            if attributes.get(name):
                self.references.append(attributes[name])
        for candidate in (attributes.get("srcset") or "").split(","):
            if candidate.strip():
                self.references.append(candidate.split()[0])
        for name in ("aria-controls", "aria-describedby", "aria-labelledby"):
            self.id_references.extend((attributes.get(name) or "").split())


def validate_build(root):
    root = root.resolve()
    if not (root / "index.html").is_file():
        raise ValueError(f"{root}: missing index.html; run python3 build.py first")
    pages = {file: Page(file.read_text(encoding="utf-8")) for file in root.rglob("*.html")}
    errors = []
    for file, page in pages.items():
        prefix = str(file.relative_to(root))
        errors.extend(f"{prefix}: {error}" for error in page.errors)
        for identifier in page.id_references:
            if identifier not in page.ids:
                errors.append(f"{prefix}: missing ARIA target {identifier!r}")
        for reference in page.references:
            parts = urlsplit(reference)
            if parts.scheme or parts.netloc:
                continue
            path = unquote(parts.path)
            target = (file.parent / path).resolve() if path else file
            if target.is_dir():
                target /= "index.html"
            if path.startswith("/") or not target.is_relative_to(root) or not target.is_file():
                errors.append(f"{prefix}: invalid local reference {reference!r}")
            elif parts.fragment and target in pages and unquote(parts.fragment) not in pages[target].ids:
                errors.append(f"{prefix}: missing anchor {reference!r}")
    if errors:
        raise ValueError("\n".join(errors))
    return len(pages)


if __name__ == "__main__":
    try:
        count = validate_build(Path(__file__).resolve().parents[1] / "dist")
    except ValueError as error:
        raise SystemExit(str(error)) from None
    print(f"Validated {count} HTML pages, local assets, anchors and ARIA references.")
