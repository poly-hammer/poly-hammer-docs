"""MkDocs hooks for poly-hammer-docs.

on_page_context: fixes a Windows-specific bug in mkdocs-shadcn where
`page.file.src_path` (backslash-separated on Windows) is used to build
`raw_markdown_url`, triggering an "OS-specific separator" warning from MkDocs.
We normalize the URL to forward-slashes before any template rendering occurs.

on_pre_build: patches MarkdownMixin.on_post_build to clear stale page paths
before copying, preventing FileNotFoundError during live-reload rebuilds.
"""

import os

from shadcn.plugins.mixins.markdown import MarkdownMixin

_original_on_post_build = MarkdownMixin.on_post_build


def _patched_on_post_build(self, config):
    self.raw_markdown = {
        src: dst for src, dst in self.raw_markdown.items() if os.path.exists(src)
    }
    return _original_on_post_build(self, config)


MarkdownMixin.on_post_build = _patched_on_post_build


def on_page_context(context, **kwargs):
    if raw_url := context.get("raw_markdown_url"):
        context["raw_markdown_url"] = raw_url.replace("\\", "/")
    return context
