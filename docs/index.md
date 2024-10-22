# Welcome to the Poly Hammer Docs

For full documentation visit [mkdocs.org](https://www.mkdocs.org).

This page is designed to test all the colors used in the Poly Hammer Docs theme.

## Commands

* `mkdocs new [dir-name]` - Create a new project.
* `mkdocs serve` - Start the live-reloading docs server.
* `mkdocs build` - Build the documentation site.
* `mkdocs -h` - Print help message and exit.


## Project layout 1

```yaml
    mkdocs.yml    # The configuration file.
    extra:
    social:
        -  icon: fontawesome/brands/mastodon 
           link: https://fosstodon.org/@squidfunk
```

## Headings

### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Text

- **Bold Text**
- *Italic Text*
- ~~Strikethrough Text~~
- `Inline Code`


## Admonitions
!!! note
    This is a note.

!!! tip
    This is a tip.

!!! info
    This is some information.

!!! warning
    This is a warning.

!!! danger
    This is a danger alert.

!!! caution
    This is a caution alert.

!!! success
    This is a success message.

!!! failure
    This is a failure message.

!!! bug
    This is a bug alert.

!!! example
    This is an example.

!!! quote
    This is a quote.


## Links

- [External Link](https://www.mkdocs.org)
- [Internal Link (Installation)](getting-started/installation.md)

## Lists

### Unordered List
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2

### Ordered List
1. First item
2. Second item
   1. Subitem 2.1
   2. Subitem 2.2

## Blockquotes

> This is a blockquote.

## Code Blocks

```python
def hello_world():
    print("Hello, World!")
```

## Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |
| Row 2    | Data     | Data     |


## Footnote

Here's a sentence with a footnote. [^1]

[^1]: This is the footnote.


## Subscript & Superscript

H~2~O

X^2^



[Use these Docs for info on how to format content](https://facelessuser.github.io/pymdown-extensions)

this is _italic_ and so is *this*
this is __bold__ and so is **this**
^^underline^^,  ~~strike through~~
==highlight==  and `inline code`
==*you* **can** ^^combine^^ `too`==


![Test Image](../assets/polyhammer_logo.png)




##Task List

-   [X] item 1
    *   [X] item A
    *   [ ] item B
        more text
        +   [x] item a
        +   [ ] item b
        +   [x] item c
    *   [X] item C
-   [ ] item 2
-   [ ] item 3


> ```
  a fenced block
  ```



- &#32;
    ```
    a fenced block
    ```

Definition
: &#32;
    ```
    a fenced block
    ```