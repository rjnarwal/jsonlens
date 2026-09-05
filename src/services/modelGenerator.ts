// Comprehensive Multi-Language POJO / Model / Object Generator for JSONLens
import yaml from 'js-yaml';

export type SupportedTargetLanguage =
  | 'java'
  | 'kotlin'
  | 'typescript'
  | 'go'
  | 'python'
  | 'csharp'
  | 'swift'
  | 'rust'
  | 'dart'
  | 'php'
  | 'json_schema'
  | 'yaml';

export interface GeneratorOptions {
  rootName?: string;
  javaPackage?: string;
  javaUseLombok?: boolean;
  javaIncludeGettersSetters?: boolean;
  kotlinUseSerializable?: boolean;
  csharpUseRecord?: boolean;
  pythonUsePydantic?: boolean;
  indentSpaces?: number;
}

export interface GeneratorResult {
  code: string;
  language: string;
  fileExtension: string;
  suggestedFileName: string;
  error?: string;
}

// ---------------- Helper string manipulation ----------------

export function toPascalCase(str: string): string {
  if (!str) return 'Model';
  // Replace underscores, hyphens, spaces, and capitalize words
  const cleaned = str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  if (!cleaned) return 'Model';
  // Ensure starts with letter
  if (/^[0-9]/.test(cleaned)) {
    return `Model${cleaned}`;
  }
  return cleaned;
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toLowerCase()
    .replace(/^_+|_+$/g, '') || 'field';
}

interface ParsedProperty {
  originalKey: string;
  camelKey: string;
  pascalKey: string;
  snakeKey: string;
  rawType: 'string' | 'int' | 'float' | 'boolean' | 'null' | 'object' | 'array_primitive' | 'array_object' | 'array_empty' | 'any';
  primitiveType?: 'string' | 'int' | 'float' | 'boolean';
  nestedModelName?: string;
  nestedData?: Record<string, any>;
  isNullable: boolean;
}

interface ExtractedModel {
  name: string;
  properties: ParsedProperty[];
}

function analyzeJsonValue(
  value: any,
  keyName: string,
  modelCollector: Map<string, ExtractedModel>,
  prefix: string = ''
): { type: ParsedProperty['rawType']; primitiveType?: ParsedProperty['primitiveType']; nestedModelName?: string } {
  if (value === null || value === undefined) {
    return { type: 'null' };
  }
  if (typeof value === 'string') {
    return { type: 'string' };
  }
  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'int' : 'float' };
  }
  if (typeof value === 'boolean') {
    return { type: 'boolean' };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array_empty' };
    }
    const first = value[0];
    if (typeof first === 'object' && first !== null) {
      const nestedName = toPascalCase(`${prefix}${keyName}Item`);
      extractModel(first, nestedName, modelCollector);
      return { type: 'array_object', nestedModelName: nestedName };
    } else {
      const primType = typeof first === 'string' ? 'string' : typeof first === 'number' ? (Number.isInteger(first) ? 'int' : 'float') : 'boolean';
      return { type: 'array_primitive', primitiveType: primType };
    }
  }
  if (typeof value === 'object') {
    const nestedName = toPascalCase(`${prefix}${keyName}`);
    extractModel(value, nestedName, modelCollector);
    return { type: 'object', nestedModelName: nestedName };
  }
  return { type: 'any' };
}

function extractModel(
  obj: Record<string, any>,
  modelName: string,
  modelCollector: Map<string, ExtractedModel>
): void {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
  if (modelCollector.has(modelName)) return;

  const properties: ParsedProperty[] = [];

  for (const [key, val] of Object.entries(obj)) {
    const analysis = analyzeJsonValue(val, key, modelCollector, modelName);
    properties.push({
      originalKey: key,
      camelKey: toCamelCase(key),
      pascalKey: toPascalCase(key),
      snakeKey: toSnakeCase(key),
      rawType: analysis.type,
      primitiveType: analysis.primitiveType,
      nestedModelName: analysis.nestedModelName,
      isNullable: val === null,
    });
  }

  modelCollector.set(modelName, { name: modelName, properties });
}

// ---------------- 1. Java POJO Generator ----------------

export function generateJavaPojo(
  rootData: any,
  options: GeneratorOptions = {}
): string {
  const rootName = toPascalCase(options.rootName || 'RootModel');
  const pkg = options.javaPackage || 'com.example.models';
  const useLombok = options.javaUseLombok !== false;
  const includeGetSet = options.javaIncludeGettersSetters !== false;

  const models = new Map<string, ExtractedModel>();
  if (Array.isArray(rootData)) {
    if (rootData.length > 0 && typeof rootData[0] === 'object') {
      extractModel(rootData[0], rootName, models);
    }
  } else if (typeof rootData === 'object' && rootData !== null) {
    extractModel(rootData, rootName, models);
  }

  const modelClasses: string[] = [];

  function getJavaType(prop: ParsedProperty): string {
    switch (prop.rawType) {
      case 'string': return 'String';
      case 'int': return 'Integer';
      case 'float': return 'Double';
      case 'boolean': return 'Boolean';
      case 'null': return 'Object';
      case 'object': return prop.nestedModelName || 'Object';
      case 'array_primitive': {
        const p = prop.primitiveType === 'string' ? 'String' : prop.primitiveType === 'int' ? 'Integer' : prop.primitiveType === 'float' ? 'Double' : 'Boolean';
        return `List<${p}>`;
      }
      case 'array_object': return `List<${prop.nestedModelName || 'Object'}>`;
      case 'array_empty': return 'List<Object>';
      default: return 'Object';
    }
  }

  models.forEach((model) => {
    const lines: string[] = [];

    if (useLombok) {
      lines.push('@Data');
      lines.push('@NoArgsConstructor');
      lines.push('@AllArgsConstructor');
      lines.push('@JsonIgnoreProperties(ignoreUnknown = true)');
      lines.push(`public class ${model.name} {`);
    } else {
      lines.push('@JsonInclude(JsonInclude.Include.NON_NULL)');
      lines.push('@JsonIgnoreProperties(ignoreUnknown = true)');
      lines.push(`public class ${model.name} {`);
    }

    // Fields
    model.properties.forEach((prop) => {
      lines.push(`    @JsonProperty("${prop.originalKey}")`);
      lines.push(`    private ${getJavaType(prop)} ${prop.camelKey};`);
      lines.push('');
    });

    if (!useLombok) {
      // Default constructor
      lines.push(`    public ${model.name}() {}`);
      lines.push('');

      // Getters and Setters
      if (includeGetSet) {
        model.properties.forEach((prop) => {
          const type = getJavaType(prop);
          const getter = prop.rawType === 'boolean' ? `is${prop.pascalKey}` : `get${prop.pascalKey}`;
          lines.push(`    public ${type} ${getter}() {`);
          lines.push(`        return this.${prop.camelKey};`);
          lines.push('    }');
          lines.push('');
          lines.push(`    public void set${prop.pascalKey}(${type} ${prop.camelKey}) {`);
          lines.push(`        this.${prop.camelKey} = ${prop.camelKey};`);
          lines.push('    }');
          lines.push('');
        });
      }
    }

    lines.push('}');
    modelClasses.push(lines.join('\n'));
  });

  const header = [
    `package ${pkg};`,
    '',
    'import com.fasterxml.jackson.annotation.JsonProperty;',
    'import com.fasterxml.jackson.annotation.JsonInclude;',
    'import com.fasterxml.jackson.annotation.JsonIgnoreProperties;',
    'import java.util.List;',
    useLombok ? 'import lombok.Data;\nimport lombok.NoArgsConstructor;\nimport lombok.AllArgsConstructor;' : '',
    '',
  ].filter(Boolean).join('\n');

  return `${header}\n${modelClasses.join('\n\n')}`;
}

// ---------------- 2. Kotlin Data Class Generator ----------------

export function generateKotlinDataClasses(
  rootData: any,
  options: GeneratorOptions = {}
): string {
  const rootName = toPascalCase(options.rootName || 'RootModel');
  const pkg = options.javaPackage || 'com.example.models';

  const models = new Map<string, ExtractedModel>();
  if (Array.isArray(rootData)) {
    if (rootData.length > 0 && typeof rootData[0] === 'object') {
      extractModel(rootData[0], rootName, models);
    }
  } else if (typeof rootData === 'object' && rootData !== null) {
    extractModel(rootData, rootName, models);
  }

  function getKotlinType(prop: ParsedProperty): string {
    const nullable = prop.isNullable ? '?' : '';
    switch (prop.rawType) {
      case 'string': return `String${nullable}`;
      case 'int': return `Int${nullable}`;
      case 'float': return `Double${nullable}`;
      case 'boolean': return `Boolean${nullable}`;
      case 'null': return 'Any?';
      case 'object': return `${prop.nestedModelName}${nullable}`;
      case 'array_primitive': {
        const p = prop.primitiveType === 'string' ? 'String' : prop.primitiveType === 'int' ? 'Int' : prop.primitiveType === 'float' ? 'Double' : 'Boolean';
        return `List<${p}>`;
      }
      case 'array_object': return `List<${prop.nestedModelName}>`;
      case 'array_empty': return 'List<Any>';
      default: return 'Any?';
    }
  }

  const classDefs: string[] = [];

  models.forEach((model) => {
    const lines: string[] = [];
    lines.push(`data class ${model.name}(`);

    model.properties.forEach((prop, idx) => {
      const isLast = idx === model.properties.length - 1;
      lines.push(`    @SerializedName("${prop.originalKey}")`);
      lines.push(`    val ${prop.camelKey}: ${getKotlinType(prop)}${isLast ? '' : ','}`);
    });

    lines.push(')');
    classDefs.push(lines.join('\n'));
  });

  const header = [
    `package ${pkg}`,
    '',
    'import com.google.gson.annotations.SerializedName',
    '',
  ].join('\n');

  return `${header}${classDefs.join('\n\n')}`;
}

// ---------------- 3. TypeScript Interfaces ----------------

export function generateTypeScriptInterfaces(
  rootData: any,
  options: GeneratorOptions = {}
): string {
  const rootName = toPascalCase(options.rootName || 'RootModel');
  const models = new Map<string, ExtractedModel>();

  if (Array.isArray(rootData)) {
    if (rootData.length > 0 && typeof rootData[0] === 'object') {
      extractModel(rootData[0], rootName, models);
    }
  } else if (typeof rootData === 'object' && rootData !== null) {
    extractModel(rootData, rootName, models);
  }

  function getTsType(prop: ParsedProperty): string {
    switch (prop.rawType) {
      case 'string': return 'string';
      case 'int':
      case 'float': return 'number';
      case 'boolean': return 'boolean';
      case 'null': return 'any';
      case 'object': return prop.nestedModelName || 'Record<string, any>';
      case 'array_primitive': {
        const p = prop.primitiveType === 'string' ? 'string' : (prop.primitiveType === 'int' || prop.primitiveType === 'float') ? 'number' : 'boolean';
        return `${p}[]`;
      }
      case 'array_object': return `${prop.nestedModelName}[]`;
      case 'array_empty': return 'any[]';
      default: return 'any';
    }
  }

  const interfaces: string[] = [];

  models.forEach((model) => {
    const lines = [`export interface ${model.name} {`];
    model.properties.forEach((prop) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(prop.originalKey) ? prop.originalKey : `"${prop.originalKey}"`;
      const optional = prop.isNullable ? '?' : '';
      lines.push(`  ${safeKey}${optional}: ${getTsType(prop)};`);
    });
    lines.push('}');
    interfaces.push(lines.join('\n'));
  });

  if (Array.isArray(rootData)) {
    interfaces.push(`export type ${rootName}List = ${rootName}[];`);
  }

  return interfaces.join('\n\n');
}

// ---------------- 4. Go Structs Generator ----------------

export function generateGoStructs(
  rootData: any,
  options: GeneratorOptions = {}
): string {
  const rootName = toPascalCase(options.rootName || 'RootModel');
  const models = new Map<string, ExtractedModel>();

  if (Array.isArray(rootData)) {
    if (rootData.length > 0 && typeof rootData[0] === 'object') {
      extractModel(rootData[0], rootName, models);
    }
  } else if (typeof rootData === 'object' && rootData !== null) {
    extractModel(rootData, rootName, models);
  }

  function getGoType(prop: ParsedProperty): string {
    switch (prop.rawType) {
      case 'string': return 'string';
      case 'int': return 'int64';
      case 'float': return 'float64';
      case 'boolean': return 'bool';
      case 'null': return 'interface{}';
      case 'object': return prop.nestedModelName || 'interface{}';
      case 'array_primitive': {
        const p = prop.primitiveType === 'string' ? 'string' : prop.primitiveType === 'int' ? 'int64' : prop.primitiveType === 'float' ? 'float64' : 'bool';
        return `[]${p}`;
      }
      case 'array_object': return `[]${prop.nestedModelName}`;
      case 'array_empty': return '[]interface{}';
      default: return 'interface{}';
    }
  }

  const structs: string[] = [];

  models.forEach((model) => {
    const lines = [`type ${model.name} struct {`];
    model.properties.forEach((prop) => {
      lines.push(`\t${prop.pascalKey} ${getGoType(prop)} \`json:"${prop.originalKey}"\``);
    });
    lines.push('}');
    structs.push(lines.join('\n'));
  });

  return `package models\n\n${structs.join('\n\n')}`;
}

// ---------------- 5. Python Pydantic & Dataclass ----------------

export function generatePythonModels(
  rootData: any,
  options: GeneratorOptions = {}
): string {
  const rootName = toPascalCase(options.rootName || 'RootModel');
  const usePydantic = options.pythonUsePydantic !== false;
  const models = new Map<string, ExtractedModel>();

  if (Array.isArray(rootData)) {
    if (rootData.length > 0 && typeof rootData[0] === 'object') {
      extractModel(rootData[0], rootName, models);
    }
  } else if (typeof rootData === 'object' && rootData !== null) {
    extractModel(rootData, rootName, models);
  }

  function getPythonType(prop: ParsedProperty): string {
    let t = 'Any';
    switch (prop.rawType) {
      case 'string': t = 'str'; break;
      case 'int': t = 'int'; break;
      case 'float': t = 'float'; break;
      case 'boolean': t = 'bool'; break;
      case 'object': t = prop.nestedModelName || 'Dict[str, Any]'; break;
      case 'array_primitive': {
        const p = prop.primitiveType === 'string' ? 'str' : prop.primitiveType === 'int' ? 'int' : prop.primitiveType === 'float' ? 'float' : 'bool';
        t = `List[${p}]`;
        break;
      }
      case 'array_object': t = `List[${prop.nestedModelName}]`; break;
      case 'array_empty': t = 'List[Any]'; break;
      default: t = 'Any'; break;
    }
    return prop.isNullable ? `Optional[${t}] = None` : t;
  }

  const classDefs: string[] = [];

  models.forEach((model) => {
    const lines: string[] = [];
    if (usePydantic) {
      lines.push(`class ${model.name}(BaseModel):`);
      if (model.properties.length === 0) {
        lines.push('    pass');
      } else {
        model.properties.forEach((prop) => {
          const typeStr = getPythonType(prop);
          if (prop.snakeKey !== prop.originalKey) {
            lines.push(`    ${prop.snakeKey}: ${typeStr} = Field(default=..., alias="${prop.originalKey}")`);
          } else {
            lines.push(`    ${prop.snakeKey}: ${typeStr}`);
          }
        });
        lines.push('');
        lines.push('    class Config:');
        lines.push('        populate_by_name = True');
      }
    } else {
      lines.push('@dataclass');
      lines.push(`class ${model.name}:`);
      if (model.properties.length === 0) {
        lines.push('    pass');
      } else {
        model.properties.forEach((prop) => {
          lines.push(`    ${prop.snakeKey}: ${getPythonType(prop)}`);
        });
      }
    }
    classDefs.push(lines.join('\n'));
  });

  const header = usePydantic
    ? 'from typing import List, Optional, Any, Dict\nfrom pydantic import BaseModel, Field\n\n'
    : 'from dataclasses import dataclass\nfrom typing import List, Optional, Any, Dict\n\n';

  return `${header}${classDefs.join('\n\n')}`;
}

// ---------------- 6. C# (.NET) Classes / Records ----------------

export function generateCSharpModels(
  rootData: any,
  options: GeneratorOptions = {}
): string {
  const rootName = toPascalCase(options.rootName || 'RootModel');
  const useRecord = Boolean(options.csharpUseRecord);
  const models = new Map<string, ExtractedModel>();

  if (Array.isArray(rootData)) {
    if (rootData.length > 0 && typeof rootData[0] === 'object') {
      extractModel(rootData[0], rootName, models);
    }
  } else if (typeof rootData === 'object' && rootData !== null) {
    extractModel(rootData, rootName, models);
  }

  function getCsType(prop: ParsedProperty): string {
    switch (prop.rawType) {
      case 'string': return 'string';
      case 'int': return 'long';
      case 'float': return 'double';
      case 'boolean': return 'bool';
      case 'null': return 'object?';
      case 'object': return `${prop.nestedModelName}?`;
      case 'array_primitive': {
        const p = prop.primitiveType === 'string' ? 'string' : prop.primitiveType === 'int' ? 'long' : prop.primitiveType === 'float' ? 'double' : 'bool';
        return `List<${p}>`;
      }
      case 'array_object': return `List<${prop.nestedModelName}>`;
      case 'array_empty': return 'List<object>';
      default: return 'object';
    }
  }

  const classDefs: string[] = [];

  models.forEach((model) => {
    const lines: string[] = [];
    if (useRecord) {
      lines.push(`    public record ${model.name}(`);
      model.properties.forEach((prop, idx) => {
        const isLast = idx === model.properties.length - 1;
        lines.push(`        [property: JsonPropertyName("${prop.originalKey}")] ${getCsType(prop)} ${prop.pascalKey}${isLast ? '' : ','}`);
      });
      lines.push('    );');
    } else {
      lines.push(`    public class ${model.name}`);
      lines.push('    {');
      model.properties.forEach((prop) => {
        lines.push(`        [JsonPropertyName("${prop.originalKey}")]`);
        lines.push(`        public ${getCsType(prop)} ${prop.pascalKey} { get; set; } = default!;`);
        lines.push('');
      });
      lines.push('    }');
    }
    classDefs.push(lines.join('\n'));
  });

  return [
    'using System;',
    'using System.Collections.Generic;',
    'using System.Text.Json.Serialization;',
    '',
    'namespace Models',
    '{',
    classDefs.join('\n\n'),
    '}',
  ].join('\n');
}

// ---------------- 7. Swift Codable Structs ----------------

export function generateSwiftModels(
  rootData: any,
  options: GeneratorOptions = {}
): string {
  const rootName = toPascalCase(options.rootName || 'RootModel');
  const models = new Map<string, ExtractedModel>();

  if (Array.isArray(rootData)) {
    if (rootData.length > 0 && typeof rootData[0] === 'object') {
      extractModel(rootData[0], rootName, models);
    }
  } else if (typeof rootData === 'object' && rootData !== null) {
    extractModel(rootData, rootName, models);
  }

  function getSwiftType(prop: ParsedProperty): string {
    const opt = prop.isNullable ? '?' : '';
    switch (prop.rawType) {
      case 'string': return `String${opt}`;
      case 'int': return `Int${opt}`;
      case 'float': return `Double${opt}`;
      case 'boolean': return `Bool${opt}`;
      case 'null': return 'AnyCodable?';
      case 'object': return `${prop.nestedModelName}${opt}`;
      case 'array_primitive': {
        const p = prop.primitiveType === 'string' ? 'String' : prop.primitiveType === 'int' ? 'Int' : prop.primitiveType === 'float' ? 'Double' : 'Bool';
        return `[${p}]`;
      }
      case 'array_object': return `[${prop.nestedModelName}]`;
      case 'array_empty': return '[AnyCodable]';
      default: return 'AnyCodable';
    }
  }

  const structs: string[] = [];

  models.forEach((model) => {
    const lines: string[] = [];
    const hasId = model.properties.some((p) => p.camelKey === 'id');
    const protocols = hasId ? 'Codable, Identifiable' : 'Codable';

    lines.push(`public struct ${model.name}: ${protocols} {`);

    model.properties.forEach((prop) => {
      lines.push(`    public let ${prop.camelKey}: ${getSwiftType(prop)}`);
    });

    const hasDifferentKeys = model.properties.some((p) => p.camelKey !== p.originalKey);
    if (hasDifferentKeys) {
      lines.push('');
      lines.push('    enum CodingKeys: String, CodingKey {');
      model.properties.forEach((prop) => {
        lines.push(`        case ${prop.camelKey} = "${prop.originalKey}"`);
      });
      lines.push('    }');
    }

    lines.push('}');
    structs.push(lines.join('\n'));
  });

  return `import Foundation\n\n${structs.join('\n\n')}`;
}

// ---------------- 8. Rust Serde Structs ----------------

export function generateRustModels(
  rootData: any,
  options: GeneratorOptions = {}
): string {
  const rootName = toPascalCase(options.rootName || 'RootModel');
  const models = new Map<string, ExtractedModel>();

  if (Array.isArray(rootData)) {
    if (rootData.length > 0 && typeof rootData[0] === 'object') {
      extractModel(rootData[0], rootName, models);
    }
  } else if (typeof rootData === 'object' && rootData !== null) {
    extractModel(rootData, rootName, models);
  }

  function getRustType(prop: ParsedProperty): string {
    let t = 'serde_json::Value';
    switch (prop.rawType) {
      case 'string': t = 'String'; break;
      case 'int': t = 'i64'; break;
      case 'float': t = 'f64'; break;
      case 'boolean': t = 'bool'; break;
      case 'object': t = prop.nestedModelName || 'serde_json::Value'; break;
      case 'array_primitive': {
        const p = prop.primitiveType === 'string' ? 'String' : prop.primitiveType === 'int' ? 'i64' : prop.primitiveType === 'float' ? 'f64' : 'bool';
        t = `Vec<${p}>`;
        break;
      }
      case 'array_object': t = `Vec<${prop.nestedModelName}>`; break;
      case 'array_empty': t = 'Vec<serde_json::Value>'; break;
      default: t = 'serde_json::Value'; break;
    }
    return prop.isNullable ? `Option<${t}>` : t;
  }

  const structs: string[] = [];

  models.forEach((model) => {
    const lines = [
      '#[derive(Debug, Clone, Serialize, Deserialize)]',
      `pub struct ${model.name} {`,
    ];

    model.properties.forEach((prop) => {
      if (prop.snakeKey !== prop.originalKey) {
        lines.push(`    #[serde(rename = "${prop.originalKey}")]`);
      }
      lines.push(`    pub ${prop.snakeKey}: ${getRustType(prop)},`);
    });

    lines.push('}');
    structs.push(lines.join('\n'));
  });

  return `use serde::{Deserialize, Serialize};\n\n${structs.join('\n\n')}`;
}

// ---------------- 9. Dart / Flutter Class Generator ----------------

export function generateDartClasses(
  rootData: any,
  options: GeneratorOptions = {}
): string {
  const rootName = toPascalCase(options.rootName || 'RootModel');
  const models = new Map<string, ExtractedModel>();

  if (Array.isArray(rootData)) {
    if (rootData.length > 0 && typeof rootData[0] === 'object') {
      extractModel(rootData[0], rootName, models);
    }
  } else if (typeof rootData === 'object' && rootData !== null) {
    extractModel(rootData, rootName, models);
  }

  function getDartType(prop: ParsedProperty): string {
    const opt = prop.isNullable ? '?' : '';
    switch (prop.rawType) {
      case 'string': return `String${opt}`;
      case 'int': return `int${opt}`;
      case 'float': return `double${opt}`;
      case 'boolean': return `bool${opt}`;
      case 'null': return 'dynamic';
      case 'object': return `${prop.nestedModelName}${opt}`;
      case 'array_primitive': {
        const p = prop.primitiveType === 'string' ? 'String' : prop.primitiveType === 'int' ? 'int' : prop.primitiveType === 'float' ? 'double' : 'bool';
        return `List<${p}>`;
      }
      case 'array_object': return `List<${prop.nestedModelName}>`;
      case 'array_empty': return 'List<dynamic>';
      default: return 'dynamic';
    }
  }

  const classes: string[] = [];

  models.forEach((model) => {
    const lines: string[] = [];
    lines.push(`class ${model.name} {`);

    // Properties
    model.properties.forEach((prop) => {
      lines.push(`  final ${getDartType(prop)} ${prop.camelKey};`);
    });
    lines.push('');

    // Constructor
    lines.push(`  ${model.name}({`);
    model.properties.forEach((prop) => {
      const prefix = prop.isNullable ? '' : 'required ';
      lines.push(`    ${prefix}this.${prop.camelKey},`);
    });
    lines.push('  });');
    lines.push('');

    // fromJson
    lines.push(`  factory ${model.name}.fromJson(Map<String, dynamic> json) {`);
    lines.push(`    return ${model.name}(`);
    model.properties.forEach((prop) => {
      if (prop.rawType === 'object') {
        lines.push(`      ${prop.camelKey}: json['${prop.originalKey}'] != null ? ${prop.nestedModelName}.fromJson(json['${prop.originalKey}'] as Map<String, dynamic>) : null,`);
      } else if (prop.rawType === 'array_object') {
        lines.push(`      ${prop.camelKey}: (json['${prop.originalKey}'] as List<dynamic>?)?.map((e) => ${prop.nestedModelName}.fromJson(e as Map<String, dynamic>)).toList() ?? [],`);
      } else if (prop.rawType === 'array_primitive') {
        lines.push(`      ${prop.camelKey}: (json['${prop.originalKey}'] as List<dynamic>?)?.map((e) => e as ${prop.primitiveType === 'string' ? 'String' : prop.primitiveType === 'int' ? 'int' : 'double'}).toList() ?? [],`);
      } else {
        lines.push(`      ${prop.camelKey}: json['${prop.originalKey}'],`);
      }
    });
    lines.push('    );');
    lines.push('  }');
    lines.push('');

    // toJson
    lines.push('  Map<String, dynamic> toJson() {');
    lines.push('    return {');
    model.properties.forEach((prop) => {
      if (prop.rawType === 'object') {
        lines.push(`      '${prop.originalKey}': ${prop.camelKey}?.toJson(),`);
      } else if (prop.rawType === 'array_object') {
        lines.push(`      '${prop.originalKey}': ${prop.camelKey}.map((e) => e.toJson()).toList(),`);
      } else {
        lines.push(`      '${prop.originalKey}': ${prop.camelKey},`);
      }
    });
    lines.push('    };');
    lines.push('  }');

    lines.push('}');
    classes.push(lines.join('\n'));
  });

  return classes.join('\n\n');
}

// ---------------- 10. PHP (8.2+) Readonly DTOs ----------------

export function generatePhpDto(
  rootData: any,
  options: GeneratorOptions = {}
): string {
  const rootName = toPascalCase(options.rootName || 'RootModel');
  const models = new Map<string, ExtractedModel>();

  if (Array.isArray(rootData)) {
    if (rootData.length > 0 && typeof rootData[0] === 'object') {
      extractModel(rootData[0], rootName, models);
    }
  } else if (typeof rootData === 'object' && rootData !== null) {
    extractModel(rootData, rootName, models);
  }

  function getPhpType(prop: ParsedProperty): string {
    const nullable = prop.isNullable ? '?' : '';
    switch (prop.rawType) {
      case 'string': return `${nullable}string`;
      case 'int': return `${nullable}int`;
      case 'float': return `${nullable}float`;
      case 'boolean': return `${nullable}bool`;
      case 'object': return `${nullable}${prop.nestedModelName}`;
      case 'array_primitive':
      case 'array_object':
      case 'array_empty': return 'array';
      default: return 'mixed';
    }
  }

  const classDefs: string[] = [];

  models.forEach((model) => {
    const lines = [
      `readonly class ${model.name}`,
      '{',
      '    public function __construct(',
    ];

    model.properties.forEach((prop, idx) => {
      const isLast = idx === model.properties.length - 1;
      lines.push(`        public ${getPhpType(prop)} $${prop.camelKey}${isLast ? '' : ','}`);
    });

    lines.push('    ) {}');
    lines.push('}');
    classDefs.push(lines.join('\n'));
  });

  return `<?php\n\ndeclare(strict_types=1);\n\nnamespace App\\DTO;\n\n${classDefs.join('\n\n')}`;
}

// ---------------- 11. JSON Schema (draft-07) ----------------

export function generateJsonSchema(rootData: any, options: GeneratorOptions = {}): string {
  const rootName = options.rootName || 'RootModel';

  function buildSchema(val: any): Record<string, any> {
    if (val === null || val === undefined) return { type: 'null' };
    if (typeof val === 'string') return { type: 'string' };
    if (typeof val === 'number') return { type: Number.isInteger(val) ? 'integer' : 'number' };
    if (typeof val === 'boolean') return { type: 'boolean' };
    if (Array.isArray(val)) {
      return {
        type: 'array',
        items: val.length > 0 ? buildSchema(val[0]) : {},
      };
    }
    if (typeof val === 'object') {
      const properties: Record<string, any> = {};
      const required: string[] = [];
      for (const [k, v] of Object.entries(val)) {
        properties[k] = buildSchema(v);
        required.push(k);
      }
      return {
        type: 'object',
        properties,
        required,
      };
    }
    return {};
  }

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: rootName,
    ...buildSchema(rootData),
  };

  return JSON.stringify(schema, null, 2);
}

// ---------------- Main Universal Model Generator Engine ----------------

export function generateModelCode(
  rawJson: string,
  targetLang: SupportedTargetLanguage,
  options: GeneratorOptions = {}
): GeneratorResult {
  const rootName = toPascalCase(options.rootName || 'Model');

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err: any) {
    return {
      code: '',
      language: targetLang,
      fileExtension: 'txt',
      suggestedFileName: `${rootName}.txt`,
      error: `Invalid JSON: ${err.message}`,
    };
  }

  try {
    switch (targetLang) {
      case 'java':
        return {
          code: generateJavaPojo(parsed, options),
          language: 'java',
          fileExtension: 'java',
          suggestedFileName: `${rootName}.java`,
        };
      case 'kotlin':
        return {
          code: generateKotlinDataClasses(parsed, options),
          language: 'kotlin',
          fileExtension: 'kt',
          suggestedFileName: `${rootName}.kt`,
        };
      case 'typescript':
        return {
          code: generateTypeScriptInterfaces(parsed, options),
          language: 'typescript',
          fileExtension: 'ts',
          suggestedFileName: `${rootName}.ts`,
        };
      case 'go':
        return {
          code: generateGoStructs(parsed, options),
          language: 'go',
          fileExtension: 'go',
          suggestedFileName: `${toSnakeCase(rootName)}.go`,
        };
      case 'python':
        return {
          code: generatePythonModels(parsed, options),
          language: 'python',
          fileExtension: 'py',
          suggestedFileName: `${toSnakeCase(rootName)}.py`,
        };
      case 'csharp':
        return {
          code: generateCSharpModels(parsed, options),
          language: 'csharp',
          fileExtension: 'cs',
          suggestedFileName: `${rootName}.cs`,
        };
      case 'swift':
        return {
          code: generateSwiftModels(parsed, options),
          language: 'swift',
          fileExtension: 'swift',
          suggestedFileName: `${rootName}.swift`,
        };
      case 'rust':
        return {
          code: generateRustModels(parsed, options),
          language: 'rust',
          fileExtension: 'rs',
          suggestedFileName: `${toSnakeCase(rootName)}.rs`,
        };
      case 'dart':
        return {
          code: generateDartClasses(parsed, options),
          language: 'dart',
          fileExtension: 'dart',
          suggestedFileName: `${toSnakeCase(rootName)}.dart`,
        };
      case 'php':
        return {
          code: generatePhpDto(parsed, options),
          language: 'php',
          fileExtension: 'php',
          suggestedFileName: `${rootName}.php`,
        };
      case 'json_schema':
        return {
          code: generateJsonSchema(parsed, options),
          language: 'json',
          fileExtension: 'json',
          suggestedFileName: `${toSnakeCase(rootName)}.schema.json`,
        };
      case 'yaml':
        return {
          code: yaml.dump(parsed),
          language: 'yaml',
          fileExtension: 'yaml',
          suggestedFileName: `${toSnakeCase(rootName)}.yaml`,
        };
    }
  } catch (err: any) {
    return {
      code: '',
      language: targetLang,
      fileExtension: 'txt',
      suggestedFileName: `${rootName}.txt`,
      error: `Model Generator Error: ${err.message}`,
    };
  }
}
