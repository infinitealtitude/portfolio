"""Render the public static portfolio, optionally for a canonical deployment URL."""
import argparse
from datetime import date
import html
import json
import random
import shutil
from pathlib import Path
from urllib.parse import urlsplit

from tools.validate_content import load_content

ROOT = Path(__file__).resolve().parent
LINKEDIN = "https://www.linkedin.com/in/andy-elangovan-76a68b31/"
INSTAGRAM = "https://www.instagram.com/inf_altitude/"
NAME = "Anand Elangovan"
TITLE = f"{NAME} | Enterprise AI Architect, Technology Strategist & Startup Advisor"
DESCRIPTION = "Explore the work, ideas and experience of Anand Elangovan, connecting enterprise AI, technology strategy and startup go-to-market."
NAV = [("Home", "home"), ("About", "about-me"), ("Selected Work", "work"), ("Lab", "lab"),
       ("Writing", "writing"), ("Advisory", "advisory"), ("Beyond Work", "infinite-altitude"), ("Contact", "contact")]


def esc(value):
    return html.escape(value, quote=True)


def work_entries(items):
    entries = []
    for item in sorted(items, key=lambda item: item["id"] != "workflows"):
        featured = item["id"] == "workflows"
        diagram = "".join(f"<li>{esc(step)}</li>" for step in item["diagram"])
        entries.append(f"""
        <article id="{esc(item['id'])}" class="case{" featured-case" if featured else ""}">
          <p class="eyebrow">{esc(item['category'])} · {esc(item['type'])}</p>
          <h3>{esc(item['title'])}</h3>
          <dl class="case-evidence">
            <div><dt>Challenge</dt><dd>{esc(item['challenge'])}</dd></div>
            <div><dt>Responsibility</dt><dd>{esc(item['role'])}</dd></div>
            <div><dt>Result</dt><dd>{esc(item['outcome'])}</dd></div>
          </dl>
          <details{" open" if featured else ""}>
            <summary>Approach &amp; technical detail</summary>
            <p>{esc(item['approach'])}</p>
            <ol class="diagram" aria-label="Workflow schematic">{diagram}</ol>
          </details>
        </article>""")
    return "".join(entries)


def ambient_sky(count=96, twinkle=True):
    rng = random.Random(26 if twinkle else 42)
    points = []
    for index in range(count):
        x, y = rng.randrange(1200), rng.randrange(750)
        radius, opacity = rng.uniform(.42, 1.08), rng.uniform(.22, .78)
        motion = ""
        if twinkle and index % 12 == 0:
            motion = (f' class="sky-twinkle" style="--period:{rng.uniform(7, 14):.1f}s;'
                      f'--phase:-{rng.uniform(0, 7):.1f}s"')
        points.append(f'<circle cx="{x}" cy="{y}" r="{radius:.2f}" opacity="{opacity:.2f}"{motion}/>')
    return ('<svg viewBox="0 0 1200 750" preserveAspectRatio="xMidYMid slice" focusable="false">'
            + "".join(points) + '</svg>')


def sky_entries(stars, themes):
    by_hip = {star["hip"]: star for star in stars}
    points = "".join(
        f'<circle cx="{star["x"]}" cy="{star["y"]}" r="{max(0.72, 2.35 - star["mag"] * .47):.2f}" opacity="{min(1, .94 - star["mag"] * .15):.2f}"/>'
        for star in stars
    )

    # A recognisable Orion stick figure, using the catalogue stars at each endpoint.
    orion_paths = [(25336, 27989, 26727, 27366, 24436, 25930, 25336), (25930, 26311, 26727)]
    traces = "".join(
        '<polyline pathLength="1" points="' + " ".join(f'{by_hip[hip]["x"]},{by_hip[hip]["y"]}' for hip in path) + '"/>'
        for path in orion_paths if all(hip in by_hip for hip in path)
    )
    names = {24608: "Capella", 32349: "Sirius", 21421: "Aldebaran", 37826: "Pollux"}
    labels = "".join(
        f'<text x="{by_hip[hip]["x"] + 7}" y="{by_hip[hip]["y"] - 5}">{name}</text>'
        for hip, name in names.items() if hip in by_hip
    )
    if traces:
        labels += '<text x="155" y="235">Orion</text>'

    markers, links, overlay_lines = [], [], []
    for index, item in enumerate(themes, 1):
        theme = esc(item["id"])
        target = esc(item["target"])
        name = esc(item["name"])
        current = ' class="active"' if index == 1 else ''
        markers.append(f'<a class="sky-marker{" active" if index == 1 else ""}" href="#{target}" data-sky-theme="{theme}" '
                       f'style="--x:{item["x"] / 4.8:.3f}%;--y:{item["y"] / 4.8:.3f}%" aria-label="{name}">{index}</a>')
        links.append(f'<li{current}><a href="#{target}" data-sky-theme="{theme}"><span aria-hidden="true">{index:02d}</span>{name}</a></li>')
        overlay_lines.append(f'<line x1="240" y1="240" x2="{item["x"]}" y2="{item["y"]}" data-sky-line="{theme}"{current}/>')

    panels = "".join(
        f'<div data-sky-panel="{esc(item["id"])}"{ " hidden" if index else ""}>'
        f'<p>{esc(item["copy"])}</p><a href="#{esc(item["target"])}">{esc(item["evidence"])}</a></div>' 
        for index, item in enumerate(themes)
    )
    return f"""
      <figure class="sky-chart">
        <div class="sky-plot">
          <div class="celestial-flight sky-flight" data-meteor="sky" aria-hidden="true"><span class="celestial-meteor"></span></div>
          <svg viewBox="0 0 480 480" role="img" aria-label="Projected northern and southern sky above the local horizon, with an Orion trace">
            <g class="sky-guides"><circle cx="240" cy="240" r="214"/><circle cx="240" cy="240" r="142.67"/><circle cx="240" cy="240" r="71.33"/></g>
            <g class="sky-traces">{traces}</g>
            <g class="sky-stars">{points}</g>
            <g class="sky-labels">{labels}</g>
            <g class="sky-lines" aria-hidden="true">{"".join(overlay_lines)}</g>
          </svg>
          {"".join(markers)}
        </div>
        <figcaption class="sr-only">Selected stars above the geometric horizon</figcaption>
      </figure>
      <div class="sky-explorer">
        <p class="eyebrow">Explore my work</p>
        <ul class="sky-links" aria-label="Work themes">{"".join(links)}</ul>
        <div class="sky-reading" aria-live="polite">{panels}</div>
      </div>"""


def expertise_entries(items):
    rows = []
    for item in items:
        skills = "".join(f"<li>{esc(skill)}</li>" for skill in item["capabilities"])
        tools = item.get("tools")
        tools_html = (f'<p class="expertise-tools"><strong>Tools</strong> {esc(" · ".join(tools))}</p>'
                      if tools else "")
        evidence = "".join(f'<a href="{esc(link["href"])}">{esc(link["label"])}</a>'
                           for link in item["evidence"])
        rows.append(f"""
        <div class="expertise-row">
          <h3>{esc(item["category"])}</h3>
          <div>
            <ul class="expertise-list" role="list">{skills}</ul>
            {tools_html}
            <p class="expertise-evidence">{evidence}</p>
          </div>
        </div>""")
    return "".join(rows)


def journey_entries(items):
    entries = []
    for item in items:
        background = item.get("background")
        background_html = f'<p class="timeline-background">{esc(background)}</p>' if background else ""
        links = "".join(
            f'<a href="{esc(work["href"])}">{esc(work["label"])}</a>'
            for work in item.get("related_work", [])
        )
        related = f'<p class="timeline-links">{links}</p>' if links else ""
        entries.append(f"""
      <li class="timeline-entry">
        <p class="timeline-date"><span>{esc(item['dates'])}</span> <span>{esc(item['region'])}</span></p>
        {background_html}
        <h3>{esc(item['company'])}</h3>
        <p class="timeline-role">{esc(item['role'])}</p>
        <p>{esc(item['scope'])}</p>
        <p class="timeline-contribution"><strong>Selected contribution</strong> {esc(item['contribution'])}</p>
        {related}
      </li>""")
    return "".join(entries)



def advisory_entries(items):
    return "".join(f"""
      <details{' open' if index == 0 else ''}><summary>{esc(item['stage'])}</summary>
        <div><h3>{esc(item['title'])}</h3><p>{esc(item['copy'])}</p><p><strong>Possible output</strong> · {esc(item['output'])}</p></div>
      </details>""" for index, item in enumerate(items))


def lab_entries(items):
    entries = []
    for item in items:
        shot = item["screenshot"]
        image = f'assets/{esc(shot["file"])}'
        label = shot.get("label")
        note = f'<p class="lab-demo-note">{esc(label)}</p>' if label else ""
        entries.append(f"""
        <article class="lab-project" id="{esc(item['id'])}">
          <div>
          <a class="lab-screenshot" href="{image}" data-caption="{esc(shot['caption'])}"
             aria-label="Enlarge screenshot of {esc(item['name'])}">
            <img src="{image}" alt="{esc(shot['alt'])}" width="{shot['width']}"
                 height="{shot['height']}" loading="lazy" decoding="async">
          </a>
          {note}
          </div>
          <p class="eyebrow">{esc(item['status'])} · {esc(item['category'])}</p>
          <h3>{esc(item['name'])}</h3>
          <p>{esc(item['summary'])}</p>
          <p>{esc(item['built'])}</p>
          <a class="lab-action" href="projects/{esc(item['id'])}.html"
             aria-label="Explore Project: {esc(item['name'])}">Explore Project</a>
        </article>""")
    return f'<div class="lab-projects">{"".join(entries)}</div>'


def study_blocks(entries, disclosure=False):
    if disclosure:
        return "".join(f"<details><summary>{esc(title)}</summary><p>{esc(copy)}</p></details>"
                       for title, copy in entries)
    return "".join(f"<div><h3>{esc(title)}</h3><p>{esc(copy)}</p></div>"
                   for title, copy in entries)


def write_project_pages(output, indexable, projects, studies):
    folder = output / "projects"
    folder.mkdir(exist_ok=True)
    for index, item in enumerate(projects):
        study = studies[item["id"]]
        metadata = [
            ("Project type", study["status"]), ("My contribution", item["built"]),
            ("Core technologies", study["technologies"]), ("Key focus", study["focus"]),
        ]
        facts = "".join(f"<div><dt>{esc(label)}</dt><dd>{esc(value)}</dd></div>" for label, value in metadata)
        opening, *intro_paragraphs = study["intro"].split("\n\n")
        intro = f'<p class="lead">{esc(opening)}</p>' + "".join(
            f"<p>{esc(paragraph)}</p>" for paragraph in intro_paragraphs
        )
        challenge = "".join(f"<p>{esc(paragraph)}</p>" for paragraph in study["challenge"])
        architecture = "".join(
            f"<li><strong>{esc(title)}</strong><p>{esc(copy)}</p></li>"
            for title, copy in study["architecture"]
        )
        model = study.get("model")
        model_section = (f'<section class="study-section study-model"><h2>How the model works</h2>'
                         f'<div class="study-cards">{study_blocks(model)}</div></section>' if model else "")
        related = []
        for label, neighbour in (("Previous project", index - 1), ("Next project", index + 1)):
            if 0 <= neighbour < len(projects):
                project = projects[neighbour]
                related.append(f'<a href="{esc(project["id"])}.html"><span>{label}</span>{esc(project["name"])}</a>')
        shot = item["screenshot"]
        image = f'../assets/{esc(shot["file"])}'
        robots = "" if indexable else '<meta name="robots" content="noindex,nofollow">'
        (folder / f'{item["id"]}.html').write_text(f"""<!doctype html>
<html lang="en-GB">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(item['name'])} | {NAME}</title>{robots}
<link rel="icon" href="../assets/ae.svg"><link rel="stylesheet" href="../style.css">
<script src="../image-preview.js" defer></script></head>
<body>
<main class="wrap section project-detail">
  <header class="project-header">
    <a href="../index.html#{esc(item['id'])}">Back to Projects</a>
    <p class="eyebrow">{esc(study['category'])}</p>
    <h1>{esc(item['name'])}</h1>
    <p class="project-status">{esc(study['status'])}</p>
    <div class="project-intro">{intro}</div>
  </header>
  <figure>
    <a class="lab-screenshot" href="{image}" data-caption="{esc(shot['caption'])}"
       aria-label="Enlarge screenshot of {esc(item['name'])}">
      <img src="{image}" alt="{esc(shot['alt'])}" width="{shot['width']}" height="{shot['height']}" decoding="async">
    </a>
    <figcaption>{esc(shot['caption'])}</figcaption>
  </figure>
  <section class="study-section" aria-labelledby="overview"><h2 id="overview">At a glance</h2><dl class="study-facts">{facts}</dl></section>
  <section class="study-section study-prose"><h2>The challenge</h2>{challenge}</section>
  <section class="study-section"><h2>What I built</h2><div class="study-cards">{study_blocks(study['solution'])}</div></section>
  {model_section}
  <section class="study-section"><h2>System architecture</h2>
    <figure class="study-architecture">
      <figcaption>{esc(study['architecture_label'])}</figcaption>
      <ol class="study-flow">{architecture}</ol>
      <p>{esc(study['boundary'])}</p>
    </figure>
  </section>
  <section class="study-section"><h2>Key capabilities</h2><div class="study-cards">{study_blocks(study['capabilities'])}</div></section>
  <section class="study-section"><h2>Engineering decisions</h2>{study_blocks(study['decisions'], disclosure=True)}</section>
  <section class="study-section study-prose"><h2>What it demonstrated</h2><p>{esc(study['outcome'])}</p></section>
  <nav class="study-navigation" aria-label="Project navigation">
    <a href="../index.html#{esc(item['id'])}">Back to Projects</a>{"".join(related)}
  </nav>
</main>
</body></html>""")


def writing_entries(items):
    articles = []
    for item in items:
        published = date.fromisoformat(item["date"])
        title = esc(item["title"])
        source = esc(item["source"])
        articles.append(f"""
          <article class="writing-card" id="writing-{esc(item['id'])}">
            <p class="eyebrow writing-kicker">{esc(item['category'])}</p>
            <time datetime="{published.isoformat()}">{published.day} {published:%B %Y}</time>
            <h3>{title}</h3>
            <p>{esc(item['summary'])}</p>
            <a class="writing-link" href="{esc(item['url'])}" target="_blank" rel="noopener noreferrer"
               aria-label="Read on {source}: {title} (opens in a new tab)">Read on {source}</a>
          </article>""")
    return "".join(articles)


def perspective_entries(items):
    return "".join(f"<article><h3>{esc(item['title'])}</h3><p>{esc(item['copy'])}</p></article>"
                   for item in items)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", help="Canonical URL for the portfolio homepage")
    parser.add_argument("--index", action="store_true", help="Allow search indexing")
    args = parser.parse_args()
    url = args.url.rstrip("/") + "/" if args.url else None
    if url and (urlsplit(url).scheme != "https" or not urlsplit(url).netloc or urlsplit(url).query or urlsplit(url).fragment):
        parser.error("--url requires an absolute HTTPS homepage URL")
    if args.index and not url:
        parser.error("--index requires --url")

    try:
        content, studies, stars = load_content(ROOT)
    except ValueError as error:
        parser.error(str(error))

    template = (ROOT / "page.html").read_text()
    image = f"{url}assets/social.png" if url else "assets/social.png"
    person = {"@context": "https://schema.org", "@type": "Person", "name": NAME, "sameAs": [LINKEDIN],
              "knowsAbout": ["Enterprise AI", "Technology strategy", "Solution engineering", "Startup go-to-market"]}
    metadata = [
        f'<title>{esc(TITLE)}</title>',
        f'<meta name="description" content="{esc(DESCRIPTION)}">',
        '<meta property="og:type" content="profile">',
        f'<meta property="og:title" content="{esc(TITLE)}">',
        f'<meta property="og:description" content="{esc(DESCRIPTION)}">',
        f'<meta property="og:image" content="{esc(image)}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="Anand Elangovan, Enterprise AI, technology and business strategy.">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="robots" content="index,follow">' if args.index else '<meta name="robots" content="noindex,nofollow">',
    ]
    if url:
        person["url"] = url
        metadata += [f'<link rel="canonical" href="{esc(url)}">', f'<meta property="og:url" content="{esc(url)}">']
    metadata.append(f'<script type="application/ld+json">{json.dumps(person)}</script>')
    cutouts = ("anand-portrait-cutout.webp", "anand-portrait-cutout.png")
    cutout = next((file for file in cutouts if (ROOT / "assets" / file).is_file()), None)
    portrait = cutout or "anand-portrait.jpg"
    replacements = {
        "PORTRAIT_MODE": "portrait-cutout" if cutout else "portrait-crop",
        "PORTRAIT": f'<img src="assets/{portrait}" alt="Portrait of Anand Elangovan" width="768" height="768" fetchpriority="high">',
        "META": "\n".join(metadata),
        "NAV": "".join(f'<a href="#{anchor}">{name}</a>' for name, anchor in NAV),
        "SKY": sky_entries(stars, content["sky_themes"]),
        "SKY_AMBIENT": ambient_sky(),
        "HERO_STARS": ambient_sky(26, twinkle=False),
        "WORK": work_entries(content["work"]),
        "EXPERTISE": expertise_entries(content["expertise"]),
        "JOURNEY": journey_entries(content["journey"]),
        "ADVISORY": advisory_entries(content["advisory"]),
        "LAB": lab_entries(content["lab"]),
        "PERSPECTIVES": perspective_entries(content["perspectives"]),
        "LINKEDIN": LINKEDIN,
        "INSTAGRAM": INSTAGRAM,
        "WRITING": writing_entries(content["writing"]),
        "WRITING_PROFILE": LINKEDIN,
    }
    for marker, value in replacements.items():
        template = template.replace("{{" + marker + "}}", value)
    output = ROOT / "dist"
    output.mkdir(exist_ok=True)
    (output / "index.html").write_text(template)
    write_project_pages(output, args.index, content["lab"], studies)
    for file in ("style.css", "resume.js", "celestial-motion.js", "image-preview.js"):
        shutil.copyfile(ROOT / file, output / file)
    (output / "assets").mkdir(exist_ok=True)
    for file in ("ae.svg", "social.png", "anand-elangovan-cv.pdf",
                 portrait, "margate-overhead.jpg", "margate-lighthouse.jpg",
                 "margate-overhead-720.jpg", "margate-lighthouse-720.jpg",
                 "instrument-serif.woff2", "instrument-serif-OFL.txt"):
        shutil.copyfile(ROOT / "assets" / file, output / "assets" / file)
    for file in {"anand-portrait.jpg", "instrument-serif-italic.woff2", *cutouts} - {portrait}:
        (output / "assets" / file).unlink(missing_ok=True)
    for project in content["lab"]:
        if screenshot := project.get("screenshot"):
            file = screenshot["file"]
            shutil.copyfile(ROOT / "assets" / file, output / "assets" / file)
    robots = "User-agent: *\n"
    if args.index:
        robots += f"Allow: /\nSitemap: {url}sitemap.xml\n"
        (output / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{esc(url)}</loc></url></urlset>\n')
    else:
        (output / "sitemap.xml").unlink(missing_ok=True)
    (output / "robots.txt").write_text(robots)
    print(f"Built {output}")


if __name__ == "__main__":
    main()
