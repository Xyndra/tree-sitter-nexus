; Text objects for Vim-style navigation

; Functions
(function_definition
  body: (block
    "{" @_start
    (_)* @function.inside
    "}" @_end)) @function.around

(function_definition) @function.around

; Methods
(method_definition
  body: (block
    "{" @_start
    (_)* @function.inside
    "}" @_end)) @function.around

(method_definition) @function.around

; Macro definitions
(macro_definition
  body: (block
    "{" @_start
    (_)* @function.inside
    "}" @_end)) @function.around

(macro_definition) @function.around

; Structs (as class-like constructs)
(struct_definition
  "{" @_start
  (_)* @class.inside
  "}" @_end) @class.around

(struct_definition) @class.around

; Interfaces (as class-like constructs)
(interface_definition
  "{" @_start
  (_)* @class.inside
  "}" @_end) @class.around

(interface_definition) @class.around

; Comments
(comment) @comment.around
(comment)+ @comment.around

; Parameters
(parameter) @parameter.inside
(parameter_list
  "(" @_start
  (parameter)? @parameter.inside
  ")" @_end) @parameter.around

; Arguments
(argument_list
  "(" @_start
  (_)? @parameter.inside
  ")" @_end) @parameter.around

; Blocks
(block
  "{" @_start
  (_)* @block.inside
  "}" @_end) @block.around

; Subscopes (also function-like for navigation)
(subscope_statement
  body: (block
    "{" @_start
    (_)* @function.inside
    "}" @_end)) @function.around

; Conditionals
(if_statement) @conditional.around
(if_statement
  (block
    "{" @_start
    (_)* @conditional.inside
    "}" @_end))

; Loops (subscopes are the loop construct in Nexus)
(subscope_statement) @loop.around
(subscope_statement
  body: (block
    "{" @_start
    (_)* @loop.inside
    "}" @_end))
