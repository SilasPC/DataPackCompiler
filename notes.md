
# Control flow

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
