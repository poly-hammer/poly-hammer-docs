"""Package prebuilt output and its traced dependencies for a separate deploy job."""

import json
from pathlib import Path, PurePosixPath
import shutil
import tarfile


def package(root: Path, destination: Path) -> int:
    root = root.resolve()
    output = root / ".vercel/output"
    if not (output / "config.json").is_file():
        raise ValueError("Run vercel build before packaging")
    dependencies = set()
    for config in output.rglob(".vc-config.json"):
        for value in json.loads(config.read_text()).get("filePathMap", {}).values():
            path = PurePosixPath(value)
            if path.is_absolute() or ".." in path.parts or not path.parts or path.parts[0] not in {"node_modules", ".next"} or "\\" in value:
                raise ValueError("Unexpected prebuilt dependency path")
            source = (root / path).resolve(strict=True)
            if not source.is_relative_to(root) or not source.is_file():
                raise ValueError("Prebuilt dependency must be a file inside the build workspace")
            dependencies.add(path.as_posix())

    # Output is generated in the credential-free build job. Copy only its traced
    # runtime files; never include project settings, pulled env files, or .git.
    bundle = root / ".docs-build/vercel-bundle"
    if bundle.exists():
        raise ValueError("Prebuilt bundle directory already exists")
    shutil.copytree(output, bundle / ".vercel/output")
    for relative in sorted(dependencies):
        target = bundle / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(root / relative, target)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(destination, "w:gz", dereference=True) as archive:
        for child in sorted(bundle.iterdir()):
            archive.add(child, arcname=child.name)
    return len(dependencies)


if __name__ == "__main__":
    count = package(Path.cwd(), Path(".docs-build/vercel-prebuilt.tar.gz"))
    print(f"Packaged Vercel output with {count} traced runtime dependencies")
