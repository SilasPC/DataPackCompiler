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
- Make use of compiler options
- Command interpolation
- Type inference
- Imports
- Functional approach like (-123).abs()
- Selectors
- Event bindings
- Automatic semicolon insertion
- Macros
- Core functions

# IDEAS
- Oregenerators
- Classes
- Namespaces

# NOTES - Future errors
- Determining lifetimes in instructions that includes commands that
  may modify the variables in question

# NOTES - Control flow

Whenever say an if body exits, we might need to check control flow
This means wrapping all remainding code in conditional execution
Within some looping bodies, everything must be wrapped in a return-is-set check

Approach:

All scopes have a **broken** property. For fn's,
this is equivelant to *has_returned*

When trying to push an instruction to the body,
check if we need to check control flow.
If not, push it to the body directly
Else, push it to a temporary buffer

Once the scope exits, check if buffer is used.
If used, wrap buffer body in conditional check
and push to previous buffer in stack, and finally
directly to the target body. Furthermore, tell
superscope to start checking control flow

If we meet a *return* when in control-flow-checking mode,
push a new instr-buffer to the stack. Use this as current.
