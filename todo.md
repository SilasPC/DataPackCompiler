# CURRENT
- Syntax sheet
  - Special parameters and substitution methods
	- Return type annotation
	- Version control
	- Extend | destroy from older versions
- Actually add the check when invoking controlflow functions
- Syntax reading, add structure for automatic semicolon insertion
- Language Sever
- Directive semantical parsing
- Fix module system
- Use Result<T,P> instead
  - Specifically for declarations, allows to possibly return a type even thought there is an error
  - Result must then hold a set of errors as well, which will be passed on

# FUTURE
- Enums
- Blocktags
- Dependencies
- Infer fn returns
- Compile errors can ask for hints
- Use: noInference, noUnused
- Command interpolation
- Functional approach like (-123).abs()
- Selectors
- Macros
- Operator overloading
- Std functions
- Directives:
	- #[inline]
	- #[tick]
	- #[load]
	- #[debug]
	- #[fail_hard]
	- #[fail_soft] (for debugging)
	- #[todo]
	- #[disabled]
	- config? std type impl?
	- ?

# Look at
- Recipies
- Predicates
- Loot tables
- Advancements
- Tags
- Storage
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
	- print
	- trace
	- panic
	- counter
- events
	- interval
	- tick
	- load
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
- Move directly to save folder (dpl )
- Packaging (dpl package | dpl install [save])
- Pack repository (dpl require)

# Resource packs
- sounds.json [https://minecraft.gamepedia.com/Sounds.json]
- texture animations via .mcmeta