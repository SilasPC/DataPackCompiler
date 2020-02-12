# WARNING
This project is **highly experimental**, and stability is **NOT** guarenteed.

# What is this?
This is a high-level language that compiles to Minecraft datapacks.

### Why?
Because I felt like it, and felt it would be a nice challenge.

And it may be useful for map makers and such.

### Features
Currently, there are a number of cool features:
- Create variables
- Use infix notation
- Type checking
- Module system
- Automatic semicolon insertion
- Hoisting and type inference (somewhat limited right now)

When/if finished, there will also be a bunch of cool features like
- Verifying datapack function and command syntax
- Libraries
- Extensive lazy loaded core library
- Easy way to make custom blocks and items
- Easy way to interface with players in general
- Automatically follow datapack conventions (see [https://datapackcenter.com/pages/conventions/])

### Examples
See /examples

You might find the syntax sorta similar to a blend between TypeScript and Rust.

With some domain specific features and limitations of course.

### Command line interface
Eventually the CLI will ship as an install script.

#### Initializing source folder
Use `_dpc init [src path]`

`[src path]` defaults to current directory.

This generates a pack.json at specified path,
which is a configuration file for the pack and compiler.

#### Compiling
Use `dpc compile [src path]` or simply `dpc [src_path]`

A number of flags can be used to overwrite compiler settings in pack.json. See `dpc --help`
