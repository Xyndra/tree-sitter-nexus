/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "nexus",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [],

  rules: {
    source_file: ($) => repeat($._item),

    _item: ($) =>
      choice(
        $.use_statement,
        $.function_definition,
        $.method_definition,
        $.struct_definition,
        $.interface_definition,
        $.macro_definition,
      ),

    // Comments
    comment: ($) => token(seq("//", /.*/)),

    // Use/Import statements
    use_statement: ($) =>
      seq(
        "use",
        choice($.use_symbol_list, $.module_path),
        optional(seq("from", $.module_path)),
      ),

    use_symbol_list: ($) =>
      seq("{", sep1($.identifier, ","), optional(","), "}"),

    module_path: ($) => sep1($.identifier, "."),

    // Function colors
    function_color: ($) => choice("std", "compat", "plat"),

    // Function definition
    function_definition: ($) =>
      seq(
        optional("$"),
        $.function_color,
        field("name", $.identifier),
        $.parameter_list,
        ":",
        field("return_type", $._type),
        repeat($.annotation),
        $.block,
      ),

    // Method definition: std (m App app) run(): void { }
    method_definition: ($) =>
      seq(
        $.function_color,
        $.receiver,
        field("name", $.identifier),
        $.parameter_list,
        ":",
        field("return_type", $._type),
        repeat($.annotation),
        $.block,
      ),

    receiver: ($) => seq("(", optional("m"), $._type, $.identifier, ")"),

    // Macro definition
    macro_definition: ($) =>
      seq(
        "$",
        field("name", $.identifier),
        $.parameter_list,
        ":",
        "macro",
        $.block,
      ),

    // Parameter list
    parameter_list: ($) => seq("(", optional(sep1($.parameter, ",")), ")"),

    parameter: ($) =>
      seq(
        optional("m"),
        $._type,
        field("name", $.identifier),
        repeat($.annotation),
      ),

    // Annotations like @range(0, 100), @prealloc(8), @unchecked
    annotation: ($) =>
      seq(
        "@",
        $.identifier,
        optional(seq("(", optional(sep1($._expression, ",")), ")")),
      ),

    // Struct definition
    struct_definition: ($) =>
      seq(
        "struct",
        field("name", $.identifier),
        optional($.implements_clause),
        "{",
        repeat($.field_definition),
        "}",
      ),

    implements_clause: ($) => seq("impl", sep1($.identifier, ",")),

    field_definition: ($) =>
      seq(
        field("type", $._type),
        field("name", $.identifier),
        repeat($.annotation),
        optional(seq("=", $._expression)),
      ),

    // Interface definition
    interface_definition: ($) =>
      seq(
        "interface",
        field("name", $.identifier),
        optional($.extends_clause),
        "{",
        repeat($.method_signature),
        "}",
      ),

    extends_clause: ($) => seq("extends", sep1($.identifier, ",")),

    method_signature: ($) =>
      seq(
        $.function_color,
        optional(seq("(", optional("m"), ")")),
        field("name", $.identifier),
        $.parameter_list,
        ":",
        field("return_type", $._type),
      ),

    // Types
    _type: ($) =>
      choice($.primitive_type, $.array_type, $.unknown_type, $.named_type),

    primitive_type: ($) =>
      choice(
        "void",
        "bool",
        "i8",
        "i16",
        "i32",
        "i64",
        "u8",
        "u16",
        "u32",
        "u64",
        "f32",
        "f64",
        "rune",
        "macro",
      ),

    named_type: ($) => alias($.identifier, $.type_name),

    // Array types: [8]int or [dyn]int
    // Higher precedence to prefer as type when followed by type
    array_type: ($) =>
      prec(10, seq("[", field("size", choice(/\d+/, "dyn")), "]", $._type)),

    // Unknown type: unknown<A, B, Error, None>
    unknown_type: ($) => seq("unknown", "<", sep1($._type, ","), ">"),

    // Block
    block: ($) => seq("{", repeat($._statement), "}"),

    _statement: ($) =>
      choice(
        $.variable_declaration,
        $.assignment_statement,
        $.return_statement,
        $.if_statement,
        $.defer_statement,
        $.subscope_statement,
        $.goto_statement,
        $.expression_statement,
        $.block,
      ),

    // Variable declaration: m x = 1 or mh arr = [1, 2, 3] or c y: i64 = 5
    variable_declaration: ($) =>
      seq(
        $.variable_modifier,
        field("name", $.identifier),
        optional(seq(":", $._type)),
        "=",
        $._expression,
      ),

    // Variable modifiers: m, l, h, u, g, c (and combinations)
    variable_modifier: ($) => token(/[mlhugc]+/),

    // Assignment statement
    assignment_statement: ($) =>
      prec.right(
        seq(field("target", $._assignable), "=", field("value", $._expression)),
      ),

    _assignable: ($) =>
      choice($.identifier, $.field_access_expression, $.index_expression),

    // Return statement
    return_statement: ($) => prec.right(seq("return", optional($._expression))),

    // If statement - higher precedence to prefer if over expression
    if_statement: ($) =>
      prec(
        5,
        seq(
          "if",
          choice($.parenthesized_expression, $._expression),
          $.block,
          optional($.else_clause),
        ),
      ),

    else_clause: ($) => seq("else", choice($.block, $.if_statement)),

    // Defer statement
    defer_statement: ($) => seq("defer", $.block),

    // Subscope statement
    subscope_statement: ($) =>
      seq("subscope", field("name", $.identifier), $.block),

    // Goto statement
    goto_statement: ($) => seq("goto", $.identifier),

    // Expression statement
    expression_statement: ($) => $._expression,

    // Expression hierarchy
    _expression: ($) =>
      choice(
        $.call_expression,
        $.method_call_expression,
        $.macro_call_expression,
        $.field_access_expression,
        $.index_expression,
        $.array_expression,
        $.struct_init_expression,
        $.lambda_expression,
        $.pattern_case,
        $._simple_expression,
      ),

    _simple_expression: ($) =>
      choice($.identifier, $._literal, $.parenthesized_expression),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    // Literals
    _literal: ($) =>
      choice(
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.char_literal,
        $.boolean_literal,
        $.none_literal,
        $.error_literal,
      ),

    integer_literal: ($) => /\d+/,

    float_literal: ($) => /\d+\.\d+/,

    // String literals support newlines directly
    string_literal: ($) =>
      seq('"', repeat(choice(/[^"\\]+/, $.escape_sequence)), '"'),

    escape_sequence: ($) => /\\./,

    char_literal: ($) => seq("'", choice(/[^'\\]/, $.escape_sequence), "'"),

    boolean_literal: ($) => choice("true", "false"),

    none_literal: ($) => "None",

    error_literal: ($) => "Error",

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Function call: func(args) or module.func(args)
    call_expression: ($) =>
      prec(
        2,
        seq(
          field("function", choice($.identifier, $.field_access_expression)),
          $.argument_list,
        ),
      ),

    argument_list: ($) => seq("(", optional(sep1($._expression, ",")), ")"),

    // Method call: obj.method(args)
    method_call_expression: ($) =>
      prec.left(
        3,
        seq(
          field("receiver", $._simple_expression),
          ".",
          field("method", $.identifier),
          $.argument_list,
        ),
      ),

    // Macro call: $format("...")
    macro_call_expression: ($) =>
      seq("$", field("name", $.identifier), $.argument_list),

    // Field access: obj.field
    field_access_expression: ($) =>
      prec.left(
        4,
        seq(
          field(
            "object",
            choice($._simple_expression, $.field_access_expression),
          ),
          ".",
          field("field", $.identifier),
        ),
      ),

    // Index expression: arr[0] or arr[@unchecked 0]
    index_expression: ($) =>
      prec.left(
        4,
        seq(
          field(
            "array",
            choice(
              $._simple_expression,
              $.field_access_expression,
              $.index_expression,
            ),
          ),
          "[",
          optional("@unchecked"),
          field("index", $._expression),
          "]",
        ),
      ),

    // Array literal: [1, 2, 3]
    array_expression: ($) => seq("[", optional(sep1($._expression, ",")), "]"),

    // Struct initialization: TypeName { field1: value1, field2: value2 }
    struct_init_expression: ($) =>
      prec(
        1,
        seq(
          field("type", $.identifier),
          "{",
          optional(sep1($.field_init, ",")),
          "}",
        ),
      ),

    field_init: ($) =>
      seq(field("name", $.identifier), ":", field("value", $._expression)),

    // Lambda expression: (x: i64): i64 { return x }
    lambda_expression: ($) =>
      seq($.parameter_list, ":", $._type, choice($.block, $._expression)),

    // Pattern case for pattern matching if: 10 -> expression or 10 -> { block }
    pattern_case: ($) =>
      seq(
        choice($.integer_literal, $.string_literal, $.boolean_literal),
        "->",
        choice($._expression, $.block),
      ),
  },
});

/**
 * Creates a rule to match one or more occurrences of `rule` separated by `sep`
 */
function sep1(rule, sep) {
  return seq(rule, repeat(seq(sep, rule)));
}
