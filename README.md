# Poly Hammer Documentation

This is where we host all the documentation for our products. Contributions are welcome. If you see something that needs to be changed or updated, feel free to open a Pull request.

## Usage

Install Python 3.13 or newer and uv, then run these commands from this repository:

```sh
uv sync
uv run python -X utf8 scripts/sync_docs.py
uv run mkdocs serve
```

Visit <http://localhost:8000>.

## Section icons

Set `extra.section_icons` in `mkdocs.yml` to map an exact top-level navigation
section title to an image path relative to `docs/`:

```yaml
extra:
  section_icons:
    Poly Hammer Portal: assets/section-icons/web.svg
    Poly Hammer Interchange: assets/section-icons/unreal.png
    Character Assembly Addon: assets/section-icons/blender.svg
```

Use an SVG or transparent PNG. Icons render as white silhouettes in fixed
16-by-16-pixel boxes on desktop and mobile, in both themes. Sections without a mapping
keep their text-only headings; nested navigation is unchanged. Keep this setting
outside the generated navigation block so syncing add-on docs preserves it.
