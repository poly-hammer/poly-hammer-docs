# Getting Started

Export your MetaHuman from Unreal Engine and assemble it in Blender with Poly Hammer Interchange.

**[Get Poly Hammer Interchange free on Fab](https://fab.com/s/820c139d9bc5).**
Install and enable the plugin in your Unreal Engine project.

<video autoplay loop muted playsinline controls preload="metadata" style="width:100%;border-radius:12px" poster="../media/full-component-assembly.avif" aria-label="Exporting a MetaHuman from Unreal Engine and dragging its assembly manifest into Blender">
  <source src="../media/full-component-assembly.webm" type="video/webm">
  Your browser does not support embedded video. <a href="../media/full-component-assembly.webm">Watch the export and import demo.</a>
</video>

## 1. Export from Unreal Engine

Use Poly Hammer Interchange to export your MetaHuman Blueprint. It collects the DNA,
grooms, clothing, props, and textures into one folder and creates
`CharacterAssemblyManifest.json`. Keep the exported folder together.

## 2. Drop into Blender

Drag `CharacterAssemblyManifest.json` into Blender's 3D Viewport, review the import
options, and confirm. Character Assembly builds the character for you.

See [Character Assembly setup](../character-assembly-addon/index.md) for installation
and import options.

!!! note
    **Requirements:** Unreal Engine 5.8+; Blender 5.2+ with
    [Character Assembly](../character-assembly-addon/index.md) and
    [Character DNA](../character-dna-addon/index.md) installed and enabled.
    The free edition of Character DNA is sufficient.