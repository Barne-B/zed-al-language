; Comments

(comment) @comment
(multiline_comment) @comment

; Preprocessor directives

[
  (preproc_if)
  (preproc_else)
  (preproc_elif)
  (preproc_endif)
  (pragma)
  (preproc_region)
  (preproc_endregion)
] @preproc

; Keywords

[
  (if_keyword)
  (then_keyword)
  (else_keyword)
  (case_keyword)
  (of_keyword)
  (while_keyword)
  (do_keyword)
  (for_keyword)
  (foreach_keyword)
  (in_keyword)
  (repeat_keyword)
  (until_keyword)
  (exit_keyword)
  (break_keyword)
  (continue_keyword)
  (with_keyword)
  (asserterror_keyword)
  (to_keyword)
  (downto_keyword)
  (begin_keyword)
  (end_keyword)
  (procedure_keyword)
  (trigger_keyword)
  (var_keyword)
  (event_keyword)
  (namespace_keyword)
  (using_keyword)
  (extends_keyword)
  (implements_keyword)
  (customizes_keyword)
  (local_keyword)
  (internal_keyword)
  (protected_keyword)
  (temporary_keyword)
] @keyword

[
  (table_keyword)
  (tableextension_keyword)
  (page_keyword)
  (pageextension_keyword)
  (codeunit_keyword)
  (report_keyword)
  (reportextension_keyword)
  (query_keyword)
  (xmlport_keyword)
  (enum_keyword)
  (enumextension_keyword)
  (interface_keyword)
  (controladdin_keyword)
  (dotnet_keyword)
  (profile_keyword)
  (profileextension_keyword)
  (permissionset_keyword)
  (permissionsetextension_keyword)
  (entitlement_keyword)
  (pagecustomization_keyword)
] @keyword

[
  (fields_keyword)
  (keys_keyword)
  (key_keyword)
  (fieldgroups_keyword)
  (fieldgroup_keyword)
  (actions_keyword)
  (layout_keyword)
  (area_keyword)
  (group_keyword)
  (repeater_keyword)
  (cuegroup_keyword)
  (fixed_keyword)
  (grid_keyword)
  (part_keyword)
  (systempart_keyword)
  (usercontrol_keyword)
  (dataset_keyword)
  (elements_keyword)
  (dataitem_keyword)
  (column_keyword)
  (filter_keyword)
  (labels_keyword)
  (rendering_keyword)
  (requestpage_keyword)
  (schema_keyword)
  (views_keyword)
  (view_keyword)
] @keyword

(procedure_modifier) @keyword
(object_type_keyword) @keyword
(keyword_identifier) @keyword

; Operators and punctuation

[
  ":="
  "+"
  "-"
  "*"
  "/"
  ".."
  "::"
  "?"
] @operator

(comparison_operator) @operator

[
  "and" "AND" "And"
  "or" "OR" "Or"
  "xor" "XOR" "Xor"
  "not" "NOT" "Not"
  "div" "DIV" "Div"
  "mod" "MOD" "Mod"
  "in" "IN" "In"
] @operator

[
  ";"
  ":"
  ","
  "."
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

; Literals

(string_literal) @string
(integer) @number
(decimal) @number
(biginteger_literal) @number
(boolean) @boolean
(date_literal) @string.special
(time_literal) @string.special
(datetime_literal) @string.special

; Types

(basic_type) @type.builtin
(text_type) @type.builtin
(code_type) @type.builtin
(array_type) @type
(list_type) @type
(dictionary_type) @type
(option_type) @type
(type_specification) @type

(record_type
  reference: [(identifier) (quoted_identifier)] @type)

(object_reference_type
  reference: [(identifier) (quoted_identifier) (integer)] @type)

(dotnet_type
  reference: [(identifier) (quoted_identifier)] @type)

; Object declarations

[
  (table_declaration object_id: (integer) @constant)
  (page_declaration object_id: (integer) @constant)
  (codeunit_declaration object_id: (integer) @constant)
  (report_declaration object_id: (integer) @constant)
  (query_declaration object_id: (integer) @constant)
  (xmlport_declaration object_id: (integer) @constant)
  (enum_declaration object_id: (integer) @constant)
  (permissionset_declaration object_id: (integer) @constant)
  (tableextension_declaration object_id: (integer) @constant)
  (pageextension_declaration object_id: (integer) @constant)
  (enumextension_declaration object_id: (integer) @constant)
  (reportextension_declaration object_id: (integer) @constant)
  (permissionsetextension_declaration object_id: (integer) @constant)
  (preproc_split_declaration object_id: (integer) @constant)
]

[
  (table_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (page_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (codeunit_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (report_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (query_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (xmlport_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (enum_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (interface_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (controladdin_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (profile_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (permissionset_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (entitlement_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (pagecustomization_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (tableextension_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (pageextension_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (enumextension_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (reportextension_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (profileextension_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (permissionsetextension_declaration object_name: [(identifier) (quoted_identifier)] @type)
  (preproc_split_declaration object_name: [(identifier) (quoted_identifier)] @type)
]

(dotnet_declaration) @type

; Procedures, triggers, fields, and variables

[
  (procedure name: [(identifier) (quoted_identifier)] @function)
  (event_declaration name: [(identifier) (quoted_identifier)] @function)
  (trigger_declaration name: [(identifier) (quoted_identifier)] @function)
  (interface_procedure name: [(identifier) (quoted_identifier)] @function)
  (preproc_split_procedure name: [(identifier) (quoted_identifier)] @function)
]

(field_declaration id: (integer) @constant)
(field_declaration name: [(identifier) (quoted_identifier)] @property)
(variable_declaration name: [(identifier) (quoted_identifier)] @variable)
(parameter name: [(identifier) (quoted_identifier)] @variable.parameter)
(label_declaration name: (identifier) @constant)
(enum_value_declaration value_id: (integer) @constant)
(enum_value_declaration value_name: [(identifier) (quoted_identifier)] @constant)
(key_declaration name: [(identifier) (quoted_identifier)] @property)
(fieldgroup_declaration name: [(identifier) (quoted_identifier)] @property)
(procedure return_value: [(identifier) (quoted_identifier)] @variable)
(trigger_declaration return_value: [(identifier) (quoted_identifier)] @variable)
(for_statement variable: (identifier) @variable)
(foreach_statement variable: (identifier) @variable)

; Expressions

(call_expression function: (identifier) @function)
(call_expression
  function: (member_expression
    member: (identifier) @function))

(member_expression object: (identifier) @variable)
(member_expression member: (identifier) @property)
(database_reference table_name: [(identifier) (quoted_identifier)] @type)

(qualified_enum_value enum_type: [(identifier) (quoted_identifier)] @type)
(qualified_enum_value value: [(identifier) (quoted_identifier)] @constant)
(option_member) @constant

; UI and project structure

[
  (action_declaration name: [(identifier) (quoted_identifier)] @function)
  (actionref_declaration action_name: [(identifier) (quoted_identifier)] @function)
  (customaction_declaration name: [(identifier) (quoted_identifier)] @function)
  (systemaction_declaration name: [(identifier) (quoted_identifier)] @function)
  (fileuploadaction_declaration name: [(identifier) (quoted_identifier)] @function)
]

(separator_action name: [(identifier) (quoted_identifier)] @punctuation.special)
(namespace_declaration name: (namespace_name) @module)
(using_statement namespace: (namespace_name) @module)
(implements_clause interface: [(identifier) (quoted_identifier)] @type)
(attribute_item) @attribute
(attribute_content name: (identifier) @attribute)
(property name: (property_name) @property)

(query_dataitem name: [(identifier) (quoted_identifier)] @variable)
(query_dataitem table_name: [(identifier) (quoted_identifier)] @type)
(query_column name: [(identifier) (quoted_identifier)] @property)
(report_dataitem name: [(identifier) (quoted_identifier)] @variable)
(report_dataitem table_name: [(identifier) (quoted_identifier)] @type)
(report_column name: [(identifier) (quoted_identifier)] @property)
(page_field name: [(identifier) (quoted_identifier)] @property)
(xmlport_element name: [(identifier) (quoted_identifier)] @property)
(xmlport_attribute name: [(identifier) (quoted_identifier)] @property)
(view_definition name: [(identifier) (quoted_identifier)] @property)
(assembly_declaration name: [(string_literal) (quoted_identifier) (dotnet_assembly_name)] @string)
(type_declaration) @type
(permission_type) @keyword
(tabledata_permission table_name: [(identifier) (quoted_identifier)] @type)
