# CURRENT
- Control flow
	- Merge scopes *broken* vars into a single var per fn
- Code generation
- Syntax sheet
  - Special parameters and substitution methods
	- Return type annotation
	- Version control
	- Extend | destroy from older versions
- Differentiate between datapack loading and initialization
- ASTNode subtypes like ASTExpression
- Actually add the check when invoking controlflow functions
- Word boundaries around say keywords in lexer

# FUTURE
- Optimize away unused locals
- Make use of compiler options
- Command interpolation
- Type inference
- Functional approach like (-123).abs()
- Selectors
- Event bindings
- Macros
- Core functions

# IDEAS
- Oregenerators
- Classes

# NOTES - Future errors
- Determining lifetimes in instructions that includes commands that
  may modify the variables in question
