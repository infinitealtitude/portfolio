"""Validate the content contract used by the static renderer."""

from datetime import date
import json
import math
import re
from urllib.parse import urlsplit


def require(valid, path, message):
    if not valid:
        raise ValueError(f"{path}: {message}")


def text(value, path):
    require(isinstance(value, str) and value.strip(), path, "expected non-empty text")


def slug(value, path):
    text(value, path)
    require(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value), path, "expected a lowercase slug")


def positive_integer(value, path):
    require(type(value) is int and value > 0, path, "expected a positive integer")


def number(value, path):
    require(type(value) is int or (type(value) is float and math.isfinite(value)),
            path, "expected a finite number")


def coordinate(value, path):
    number(value, path)
    require(0 <= value <= 480, path, "expected a coordinate within the 480-unit sky chart")


def iso_date(value, path):
    text(value, path)
    try:
        date.fromisoformat(value)
    except ValueError:
        raise ValueError(f"{path}: expected an ISO date (YYYY-MM-DD)") from None
    require(re.fullmatch(r"\d{4}-\d{2}-\d{2}", value), path, "expected an ISO date (YYYY-MM-DD)")


def https_url(value, path):
    text(value, path)
    try:
        parts = urlsplit(value)
    except ValueError:
        raise ValueError(f"{path}: expected an absolute HTTPS URL") from None
    require(parts.scheme == "https" and parts.hostname, path, "expected an absolute HTTPS URL")


def local_link(value, path):
    text(value, path)
    require(re.fullmatch(r"(?:#[a-z0-9-]+|projects/[a-z0-9-]+\.html)", value),
            path, "expected a homepage anchor or project page")


def image_filename(value, path):
    text(value, path)
    require(re.fullmatch(r"[\w-]+\.(?:png|jpe?g|webp|avif)", value, re.IGNORECASE),
            path, "expected an image filename within assets/")


def list_of(validate, *, nonempty=True):
    def check(value, path):
        require(isinstance(value, list) and (value or not nonempty), path,
                "expected a non-empty array" if nonempty else "expected an array")
        for index, item in enumerate(value):
            validate(item, f"{path}[{index}]")
    return check


def fields(text_fields="", *, optional=None, **required):
    validators = {**dict.fromkeys(text_fields.split(), text), **required}
    optional = optional or {}

    def check(value, path):
        require(isinstance(value, dict), path, "expected an object")
        for name, validate in validators.items():
            field = f"{path}.{name}"
            require(name in value, field, "required field is missing")
            validate(value[name], field)
        for name in value.keys() - validators.keys():
            field = f"{path}.{name}"
            require(name in optional, field, "unexpected field")
            optional[name](value[name], field)
    return check


def content_pair(value, path):
    require(isinstance(value, list) and len(value) == 2, path, "expected [heading, description]")
    for index, item in enumerate(value):
        text(item, f"{path}[{index}]")


text_list = list_of(text)
blocks = list_of(content_pair)
links = list_of(fields("label", href=local_link), nonempty=False)
screenshot = fields("alt caption", file=image_filename, width=positive_integer, height=positive_integer,
                    optional={"label": text})

PORTFOLIO = fields(
    work=list_of(fields("category title summary outcome type challenge role approach", id=slug, diagram=text_list)),
    expertise=list_of(fields("category", capabilities=text_list, evidence=links, optional={"tools": text_list})),
    journey=list_of(fields("dates company role region scope contribution",
                           optional={"background": text, "related_work": links})),
    advisory=list_of(fields("stage title copy output")),
    lab=list_of(fields("name status category built summary note", id=slug, screenshot=screenshot, flow=text_list)),
    perspectives=list_of(fields("title copy")),
    sky_themes=list_of(fields("name evidence copy", id=slug, target=slug, x=coordinate, y=coordinate)),
    writing=list_of(fields("title category summary source", id=slug, date=iso_date, url=https_url)),
)
CASE_STUDY = fields(
    "category status intro technologies focus architecture_label boundary outcome",
    challenge=text_list, solution=blocks, architecture=blocks, capabilities=blocks, decisions=blocks,
    optional={"model": blocks},
)
SKY = list_of(fields(hip=positive_integer, mag=number, x=coordinate, y=coordinate))


def unique(rows, key, path):
    values = set()
    for index, row in enumerate(rows):
        value = row[key]
        require(value not in values, f"{path}[{index}].{key}", f"duplicate value {value!r}")
        values.add(value)
    return values


def read_json(path):
    def unique_keys(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, path.name, f"duplicate JSON key {key!r}")
            result[key] = value
        return result

    try:
        return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=unique_keys)
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"{path.name}: {error}") from None


def load_content(root):
    portfolio = read_json(root / "content/portfolio.json")
    studies = read_json(root / "content/case-studies.json")
    stars = read_json(root / "content/sky.json")
    PORTFOLIO(portfolio, "portfolio.json")
    SKY(stars, "sky.json")
    unique(stars, "hip", "sky.json")
    for section in ("work", "writing", "sky_themes"):
        unique(portfolio[section], "id", f"portfolio.json.{section}")
    project_ids = unique(portfolio["lab"], "id", "portfolio.json.lab")
    require(isinstance(studies, dict), "case-studies.json", "expected an object keyed by project ID")
    missing = project_ids - studies.keys()
    extra = studies.keys() - project_ids
    require(not missing and not extra, "case-studies.json",
            f"project IDs must match the Lab (missing: {sorted(missing)}, extra: {sorted(extra)})")
    for slug, study in studies.items():
        path = f"case-studies.json.{slug}"
        CASE_STUDY(study, path)
        for index, paragraph in enumerate(study["intro"].split("\n\n")):
            text(paragraph, f"{path}.intro paragraph {index + 1}")
    for index, project in enumerate(portfolio["lab"]):
        filename = project["screenshot"]["file"]
        require((root / "assets" / filename).is_file(),
                f"portfolio.json.lab[{index}].screenshot.file", f"missing asset {filename!r}")
    return portfolio, studies, stars
