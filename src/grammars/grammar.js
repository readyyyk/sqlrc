/**
 * Tree-sitter grammar for Extended SQL with SQLRC directives and variable placeholders
 */
module.exports = grammar({
  name: 'extended_sql',

  // Определяем конфликты, которые нужно игнорировать
  conflicts: $ => [
    [$.sql_keyword, $.operator],
    [$.source_file, $.statement],
    [$.statement, $.punctuation]
  ],

  // Определяем приоритеты для правил
  precedences: $ => [
    [
      'keyword',
      'operator'
    ]
  ],

  // Define the rules for the grammar
  rules: {
    // The source file is the top-level rule
    source_file: $ => repeat(choice(
      $.sqlrc_directive,
      $.statement,
      $.comment
    )),

    // SQLRC directive: --@ sqlrc:FUNCTION_NAME:RETURN_TYPE
    sqlrc_directive: $ => seq(
      '--@',
      /\s*/,
      'sqlrc:',
      field('function_name', $.identifier),
      ':',
      field('return_type', choice('one', 'many', 'exec'))
    ),

    // Variable placeholder: <@NAME:TYPE@>
    variable_placeholder: $ => seq(
      '<@',
      field('name', $.identifier),
      ':',
      field('type', $.identifier),
      '@>'
    ),

    // SQL statement (simplified for now)
    statement: $ => seq(
      optional($.comment),
      repeat1(choice(
        $.sql_keyword,
        $.identifier,
        $.string,
        $.number,
        $.operator,
        $.punctuation,
        $.variable_placeholder,
        $.whitespace
      )),
      ';'
    ),

    // SQL keywords (с более высоким приоритетом)
    sql_keyword: $ => prec('keyword', choice(
      'SELECT',
      'FROM',
      'WHERE',
      'JOIN',
      'LEFT',
      'RIGHT',
      'INNER',
      'OUTER',
      'ON',
      'GROUP',
      'BY',
      'ORDER',
      'HAVING',
      'LIMIT',
      'OFFSET',
      'INSERT',
      'INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE',
      'CREATE',
      'TABLE',
      'INDEX',
      'DROP',
      'ALTER',
      'ADD',
      'COLUMN',
      'AND',
      'OR',
      'NOT',
      'NULL',
      'TRUE',
      'FALSE',
      'AS',
      'IN',
      'BETWEEN',
      'LIKE',
      'IS',
      'EXISTS',
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'DISTINCT',
      'ALL',
      'ANY',
      'SOME',
      'UNION',
      'INTERSECT',
      'EXCEPT',
      'WITH'
    )),

    // Identifiers (table names, column names, etc.)
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // String literals
    string: $ => choice(
      seq("'", repeat(choice(/[^'\\]/, /\\./)), "'"),
      seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')
    ),

    // Number literals
    number: $ => /[0-9]+(\.[0-9]+)?/,

    // Operators (с более низким приоритетом)
    operator: $ => prec('operator', choice(
      '+', '-', '*', '/', '%',
      '=', '!=', '<>', '<', '<=', '>', '>=',
      'AND', 'OR', 'NOT'
    )),

    // Punctuation
    punctuation: $ => choice(
      '(', ')', ',', '.', ';'
    ),

    // Comments
    comment: $ => choice(
      seq('--', /.*/),
      seq('/*', /(.|\n)*?\*\//)
    ),

    // Whitespace
    whitespace: $ => /\s+/
  }
});
