# CURRENT
- Syntax sheet
  - Special parameters and substitution methods
	- Return type annotation
	- Version control
	- Extend | destroy from older versions
- Actually add the check when invoking controlflow functions

# FUTURE
- Dependencies
- Infer fn returns
- Compile errors can ask for hints
- Optimize away unused locals
- Use: noInference, noUnused
- Command interpolation
- Functional approach like (-123).abs()
- Selectors
- Event bindings
- Macros
- Std functions

# Look at
- Recipies
- Predicates
- Loot tables
- Advancements
- Tags
- Sub tick timing

# IDEAS
- Oregenerators
- Classes
- Ressources like textures and sounds
- Recipies etc.
- JavaScript macros
- Generate documentation
- Generate resource packs

# Future errors
- Determining lifetimes in instructions that includes commands that
  may modify the variables in question

# STD Lib:
- debug
	- trace
- math
	- sqrt
	- sqr
	- trig funcs
	- abs
	- pRNG
	- noise
	- pow
- Entity
	- ?
- blocks
	- getID
- Item
	- ?
- Biome
	- Get biome
- Util
	- Array access macro? (arr[expr])

# CLI features
- Emit API documentation
- Import structures (dpl import structure [save/structure])
- Import from existing datapack in saves (dpl import datapack [save/dp])?
- Move directly so save folder (dpl )
- Packaging (dpl package | dpl install [save])
- Pack repository (dpl require)

# Resource packs
- sounds.json [https://minecraft.gamepedia.com/Sounds.json]
- texture animations via .mcmeta