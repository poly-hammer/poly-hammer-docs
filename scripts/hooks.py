"""MkDocs hooks for poly-hammer-docs.

on_page_context: fixes a Windows-specific bug in mkdocs-shadcn where
`page.file.src_path` (backslash-separated on Windows) is used to build
`raw_markdown_url`, triggering an "OS-specific separator" warning from MkDocs.
We normalize the URL to forward-slashes before any template rendering occurs.
"""


def on_page_context(context, **kwargs):
    if raw_url := context.get("raw_markdown_url"):
        context["raw_markdown_url"] = raw_url.replace("\\", "/")
    return context
