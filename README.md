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
