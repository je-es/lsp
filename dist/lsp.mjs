var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// lib/lsp.ts
import { DidChangeConfigurationNotification, TextDocumentSyncKind } from "vscode-languageserver";
import * as ProjectLib from "@je-es/project";

// lib/utils/diagnostics.ts
import { DiagnosticSeverity, DocumentDiagnosticReportKind } from "vscode-languageserver";

// lib/utils/common.ts
import { CompletionItemKind as CompletionItemKind2 } from "vscode-languageserver";
import { fileURLToPath } from "url";
import * as Path from "path";

// lib/utils/constants.ts
import { CompletionItemKind } from "vscode-languageserver";
var SYMBOL_KIND_TO_COMPLETION_KIND = {
  "Function": CompletionItemKind.Function,
  "Variable": CompletionItemKind.Variable,
  "Parameter": CompletionItemKind.Variable,
  "Definition": CompletionItemKind.Class,
  "StructField": CompletionItemKind.Field,
  "EnumVariant": CompletionItemKind.EnumMember,
  "Use": CompletionItemKind.Module
};

// lib/utils/common.ts
function determineProject(uri, projects) {
  if (uri.startsWith("file://")) {
    try {
      const filePath = fileURLToPath(uri);
      const relative2 = Path.relative(projects.main.rootPath, filePath);
      const isInProject = !relative2.startsWith("..") && !Path.isAbsolute(relative2);
      if (isInProject && filePath.endsWith(".k")) {
        const moduleName = Path.basename(filePath, ".k");
        return {
          project: projects.main,
          modulePath: filePath,
          currentModuleName: moduleName
        };
      }
    } catch (e) {
      console.warn("[COMMON] Error determining project:", e);
    }
  }
  return {
    project: projects.anonymous,
    currentModuleName: "main"
  };
}
function getScopeManager(project) {
  var _a, _b, _c, _d;
  if (project.analyzer) {
    return (_b = (_a = project.analyzer.config) == null ? void 0 : _a.services) == null ? void 0 : _b.scopeManager;
  }
  const analyzer = project._analyzer || project.analyzer;
  if (analyzer) {
    return (_d = (_c = analyzer.config) == null ? void 0 : _c.services) == null ? void 0 : _d.scopeManager;
  }
  if (typeof project.getScopeManager === "function") {
    return project.getScopeManager();
  }
  return null;
}
function formatType(type) {
  var _a, _b, _c;
  if (!type || !type.kind) return "unknown";
  switch (type.kind) {
    case "i8":
    case "i16":
    case "i32":
    case "i64":
    case "u8":
    case "u16":
    case "u32":
    case "u64":
    case "f32":
    case "f64":
    case "bool":
    case "void":
    case "str":
      return type.kind;
    case "pointer":
      return `*${formatType((_a = type.getPointer()) == null ? void 0 : _a.target)}`;
    case "array":
      return `[]${formatType((_b = type.getArray()) == null ? void 0 : _b.target)}`;
    case "optional":
      return `?${formatType((_c = type.getOptional()) == null ? void 0 : _c.target)}`;
    case "function":
      return "fn";
    case "struct":
      return "struct";
    case "enum":
      return "enum";
    default:
      return type.kind;
  }
}
function getCompletionItemKind(symbolKind) {
  return SYMBOL_KIND_TO_COMPLETION_KIND[symbolKind] || CompletionItemKind2.Text;
}
function getWordAndSpanAtPosition(document, position) {
  const text = document.getText();
  const offset = document.offsetAt(position);
  let start = offset;
  let end = offset;
  while (start > 0 && /[a-zA-Z0-9_@]/.test(text[start - 1])) {
    start--;
  }
  while (end < text.length && /[a-zA-Z0-9_@]/.test(text[end])) {
    end++;
  }
  if (start === end) {
    return null;
  }
  const word = text.substring(start, end);
  const span = { start, end };
  return { word, span };
}
function getSymbolDetail(symbol) {
  if (symbol.type) {
    return `${symbol.kind}: ${formatType(symbol.type)}`;
  }
  return symbol.kind;
}
function getSymbolDocumentation(symbol) {
  var _a, _b, _c;
  const parts = [];
  if (((_a = symbol.visibility) == null ? void 0 : _a.kind) === "Public") parts.push("public");
  if (((_b = symbol.mutability) == null ? void 0 : _b.kind) === "Mutable") parts.push("mut");
  if ((_c = symbol.metadata) == null ? void 0 : _c.callable) parts.push("callable");
  if (symbol.isExported) parts.push("exported");
  return parts.join(", ");
}

// lib/utils/diagnostics.ts
var DiagnosticsHandler = class {
  constructor(connection, documents, projects, settingsManager, serverMetrics, debug = false) {
    this.inFlightValidations = /* @__PURE__ */ new Map();
    this.debug = false;
    this.connection = connection;
    this.documents = documents;
    this.projects = projects;
    this.settingsManager = settingsManager;
    this.serverMetrics = serverMetrics;
    this.debug = debug;
    this.setupHandlers();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ────────────────────────────────┐
  handleDiagnostics(params) {
    return __async(this, null, function* () {
      try {
        const document = this.documents.get(params.textDocument.uri);
        if (!document) {
          return {
            kind: DocumentDiagnosticReportKind.Full,
            items: []
          };
        }
        let validationPromise = this.inFlightValidations.get(document.uri);
        if (!validationPromise) {
          validationPromise = this.validateDocument(document);
          this.inFlightValidations.set(document.uri, validationPromise);
          validationPromise.finally(() => {
            this.inFlightValidations.delete(document.uri);
          });
        }
        const diagnostics = yield validationPromise;
        this.log(`[DIAGNOSTICS] Returning ${diagnostics.length} diagnostics for ${document.uri}`);
        return {
          kind: DocumentDiagnosticReportKind.Full,
          items: diagnostics
        };
      } catch (e) {
        console.error("[DIAGNOSTICS] Error:", e);
        return {
          kind: DocumentDiagnosticReportKind.Full,
          items: [{
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 }
            },
            message: `LSP internal error: ${e instanceof Error ? e.message : "Unknown error"}`,
            source: "kls"
          }]
        };
      }
    });
  }
  validateDocument(document) {
    return __async(this, null, function* () {
      const startTime = Date.now();
      try {
        const diagnostics = [];
        const text = document.getText();
        const uri = document.uri;
        this.log(`[DIAGNOSTICS] Starting validation for: ${uri}`);
        const settings = yield this.settingsManager.getDocumentSettings(uri);
        const { project, modulePath } = determineProject(uri, this.projects);
        const result = yield project.lintAsync(text, modulePath);
        this.log(`[DIAGNOSTICS] Lint result: has_error=${result.has_error}, has_warning=${result.has_warning}`);
        const allErrors = result.diagnosticManager.getAllErrors();
        const allWarnings = result.diagnosticManager.getAllWarnings();
        const allInfos = result.diagnosticManager.getAllInfos();
        this.log(`[DIAGNOSTICS] DiagnosticManager stats:`);
        this.log(`  - Errors: ${allErrors.length}`);
        this.log(`  - Warnings: ${allWarnings.length}`);
        this.log(`  - Infos: ${allInfos.length}`);
        const allKemetDiags = [...allErrors, ...allWarnings, ...allInfos];
        for (const kemetDiag of allKemetDiags) {
          const diagnostic = this.convertKemetDiagnostic(kemetDiag, document, settings);
          if (diagnostic) {
            diagnostics.push(diagnostic);
          }
        }
        const maxDiagnostics = settings.maxDiagnostics || 100;
        if (diagnostics.length > maxDiagnostics) {
          const truncated = diagnostics.slice(0, maxDiagnostics);
          truncated.push({
            severity: DiagnosticSeverity.Warning,
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 }
            },
            message: `Too many diagnostics. Showing first ${maxDiagnostics} of ${diagnostics.length}.`,
            source: "kls"
          });
          this.updateMetrics(startTime, allErrors.length);
          return truncated;
        }
        this.updateMetrics(startTime, allErrors.length);
        const duration = Date.now() - startTime;
        this.log(`[DIAGNOSTICS] Returning ${diagnostics.length} diagnostics in ${duration}ms`);
        return diagnostics;
      } catch (e) {
        console.error("[DIAGNOSTICS] Unexpected error:", e);
        if (e instanceof Error) {
          console.error("[DIAGNOSTICS] Stack:", e.stack);
        }
        this.serverMetrics.totalValidations++;
        return [{
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
          },
          message: `LSP internal error: ${e instanceof Error ? e.message : "Unknown error"}. Please check the output console.`,
          source: "kls"
        }];
      }
    });
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  convertKemetDiagnostic(kemetDiag, document, settings) {
    var _a, _b;
    try {
      const span = (_b = (_a = kemetDiag.targetSpan) != null ? _a : kemetDiag.contextSpan) != null ? _b : { start: 0, end: 0 };
      let severity;
      if (kemetDiag.kind === "error") {
        severity = DiagnosticSeverity.Error;
      } else if (kemetDiag.kind === "warning") {
        if (settings.showWarnings === false) return null;
        severity = DiagnosticSeverity.Warning;
      } else {
        if (settings.showInfos === false) return null;
        severity = DiagnosticSeverity.Information;
      }
      return {
        severity,
        range: {
          start: document.positionAt(span.start),
          end: document.positionAt(span.end)
        },
        message: kemetDiag.msg,
        source: "kls",
        code: kemetDiag.code
      };
    } catch (e) {
      console.warn("[DIAGNOSTICS] Error converting diagnostic:", e);
      return null;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ────────────────────────────────┐
  setupHandlers() {
    this.connection.languages.diagnostics.on((params) => __async(this, null, function* () {
      return this.handleDiagnostics(params);
    }));
  }
  updateMetrics(startTime, errorCount) {
    this.serverMetrics.totalValidations++;
    this.serverMetrics.totalErrors += errorCount;
    const duration = Date.now() - startTime;
    this.serverMetrics.averageValidationTime = (this.serverMetrics.averageValidationTime * (this.serverMetrics.totalValidations - 1) + duration) / this.serverMetrics.totalValidations;
  }
  clearInflightValidation(uri) {
    this.inFlightValidations.delete(uri);
  }
  log(message) {
    if (this.debug)
      console.log(message);
  }
  // └──────────────────────────────────────────────────────────────────────┘
};

// lib/utils/completion.ts
import { CompletionItemKind as CompletionItemKind3 } from "vscode-languageserver";
var CompletionHandler = class {
  constructor(connection, documents, projects, syntax, debug = false) {
    this.debug = false;
    this.connection = connection;
    this.documents = documents;
    this.projects = projects;
    this.syntax = syntax;
    this.debug = debug;
    this.setupHandlers();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ────────────────────────────────┐
  handleCompletion(params) {
    try {
      this.log(`[COMPLETION] Request received at position: ${params.position}`);
      const document = this.documents.get(params.textDocument.uri);
      if (!document) {
        console.warn("[COMPLETION] Document not found");
        return [];
      }
      const context = this.analyzeCompletionContext(document, params);
      this.log(`[COMPLETION] Context: ${JSON.stringify(context, null, 2)}`);
      const items = [];
      if (!context.isAfterDot) {
        items.push(...this.getKeywordCompletions(context));
        items.push(...this.getBuiltinCompletions());
        items.push(...this.getScopeSymbolCompletions(document, params));
      }
      this.log(`[COMPLETION] Returning ${items.length} total items`);
      return items;
    } catch (e) {
      console.error("[COMPLETION] Error:", e);
      if (e instanceof Error) {
        console.error("[COMPLETION] Stack:", e.stack);
      }
      return [];
    }
  }
  handleCompletionResolve(item) {
    try {
      if (item.data && typeof item.data === "string" && item.data.startsWith("keyword_")) {
        const keyword = item.label;
        const doc = this.syntax.getKeywordDoc(keyword);
        if (doc) {
          item.detail = doc.signature;
          item.documentation = `${doc.description}${doc.example ? "\n\nExample:\n" + doc.example : ""}`;
        }
      }
      return item;
    } catch (e) {
      console.error("[COMPLETION] CompletionResolve error:", e);
      return item;
    }
  }
  analyzeCompletionContext(document, position) {
    const text = document.getText();
    const offset = document.offsetAt(position.position);
    const lineText = text.substring(
      document.offsetAt({ line: position.position.line, character: 0 }),
      offset
    );
    const tokens = lineText.trim().split(/\s+/);
    const previousToken = tokens.length > 1 ? tokens[tokens.length - 2] : "";
    const currentToken = tokens[tokens.length - 1] || "";
    return {
      isInFunction: /\bfn\b/.test(text.substring(0, offset)),
      isInStruct: /\bstruct\s*\{/.test(text.substring(0, offset)),
      isInEnum: /\benum\s*\{/.test(text.substring(0, offset)),
      isAfterDot: currentToken.endsWith(".") || previousToken === ".",
      isAfterUse: previousToken === "use",
      isAfterLet: previousToken === "let",
      isAfterFn: previousToken === "fn",
      isAfterDef: previousToken === "def",
      previousToken,
      currentScope: "global"
    };
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  getKeywordCompletions(context) {
    const items = [];
    const keywords = this.syntax.getLSPKeywords();
    if (!keywords) {
      console.warn("[COMPLETION] No LSP keywords available in syntax");
      return items;
    }
    let selectedKeywords = [];
    if (context.isAfterLet) {
      selectedKeywords = ["mut", ...keywords.types];
    } else if (context.isAfterFn || context.isAfterDef) {
      return [];
    } else if (context.isAfterUse) {
      return [];
    } else if (context.isInFunction) {
      selectedKeywords = [
        ...keywords.controlFlow,
        ...keywords.declarations.filter((k) => k !== "pub"),
        ...keywords.operators,
        ...keywords.literals
      ];
    } else {
      selectedKeywords = [
        ...keywords.declarations,
        ...keywords.types,
        ...keywords.controlFlow,
        ...keywords.modifiers,
        ...keywords.operators,
        ...keywords.literals
      ];
    }
    selectedKeywords.forEach((keyword, index) => {
      const item = {
        label: keyword,
        kind: keywords.types.includes(keyword) ? CompletionItemKind3.TypeParameter : keywords.controlFlow.includes(keyword) ? CompletionItemKind3.Keyword : CompletionItemKind3.Keyword,
        data: `keyword_${index}`,
        sortText: `0_${keyword}`
      };
      items.push(item);
    });
    return items;
  }
  getBuiltinCompletions() {
    const keywords = this.syntax.getLSPKeywords();
    if (!keywords) return [];
    return keywords.builtins.map((builtin, index) => ({
      label: builtin,
      kind: builtin === "self" ? CompletionItemKind3.Variable : CompletionItemKind3.Function,
      data: `builtin_${index}`,
      detail: builtin === "@print" ? "fn(str) -> void" : void 0,
      sortText: `1_${builtin}`
    }));
  }
  getScopeSymbolCompletions(document, position) {
    var _a, _b;
    try {
      const uri = position.textDocument.uri;
      const text = document.getText();
      const { project, modulePath, currentModuleName } = determineProject(uri, this.projects);
      this.log("[COMPLETION] Running lint for autocomplete...");
      const startLint = Date.now();
      const result = project.lint(text, modulePath);
      this.log(`[COMPLETION] Lint completed in ${Date.now() - startLint}ms`);
      const scopeManager = getScopeManager(project);
      if (!scopeManager) {
        console.error("[COMPLETION] Could not access scope manager");
        return [];
      }
      const allSymbols = scopeManager.getAllSymbols();
      this.log(`[COMPLETION] Found ${allSymbols.length} total symbols`);
      const items = [];
      const seenSymbols = /* @__PURE__ */ new Set();
      for (const symbol of allSymbols) {
        if (seenSymbols.has(symbol.name) || ((_a = symbol.metadata) == null ? void 0 : _a.isSynthetic)) {
          continue;
        }
        const symbolModule = symbol.module || "";
        const isFromCurrentModule = symbolModule === modulePath || symbolModule === currentModuleName || symbolModule === "";
        const isImport = symbol.kind === "Use";
        const isBuiltin = ((_b = symbol.metadata) == null ? void 0 : _b.isBuiltin) === true;
        const isPublicExported = symbol.isExported && symbol.visibility.kind === "Public";
        if (!isFromCurrentModule && !isImport && !isBuiltin && !isPublicExported) {
          continue;
        }
        seenSymbols.add(symbol.name);
        const item = {
          label: symbol.name,
          kind: getCompletionItemKind(symbol.kind),
          data: `symbol_${symbol.id}`,
          detail: getSymbolDetail(symbol),
          documentation: getSymbolDocumentation(symbol),
          sortText: `2_${symbol.name}`
        };
        items.push(item);
      }
      this.log(`[COMPLETION] Returning ${items.length} symbols`);
      return items;
    } catch (error) {
      console.error("[COMPLETION] Error getting scope symbols:", error);
      return [];
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ────────────────────────────────┐
  setupHandlers() {
    this.connection.onCompletion((params) => {
      return this.handleCompletion(params);
    });
    this.connection.onCompletionResolve((item) => {
      return this.handleCompletionResolve(item);
    });
  }
  log(message) {
    if (this.debug)
      console.log(message);
  }
  // └──────────────────────────────────────────────────────────────────────┘
};

// lib/utils/hover.ts
import { MarkupKind } from "vscode-languageserver";
var HoverHandler = class {
  constructor(connection, documents, projects, syntax, debug = false) {
    this.debug = false;
    this.connection = connection;
    this.documents = documents;
    this.projects = projects;
    this.syntax = syntax;
    this.debug = debug;
    this.setupHandlers();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ────────────────────────────────┐
  handleHover(params) {
    try {
      this.log(`[HOVER] Request received at position: ${params.position}`);
      const document = this.documents.get(params.textDocument.uri);
      if (!document) {
        console.warn("[HOVER] Document not found");
        return null;
      }
      const wordInfo = getWordAndSpanAtPosition(document, params.position);
      if (!wordInfo) {
        this.log("[HOVER] No word at position");
        return null;
      }
      const { word, span } = wordInfo;
      this.log(`[HOVER] Word: "${word}"`);
      if (this.syntax.isKeyword(word)) {
        this.log(`[HOVER] Found keyword: ${word}`);
        return this.getKeywordHover(word);
      }
      if (this.syntax.isBuiltin(word) || word === "self") {
        const doc = this.syntax.getBuiltinDoc(word);
        if (doc) {
          this.log(`[HOVER] Found builtin: ${word}`);
          return {
            contents: {
              kind: MarkupKind.Markdown,
              value: doc
            }
          };
        }
      }
      return this.getSymbolHover(document, params, word, span);
    } catch (error) {
      console.error("[HOVER] Error:", error);
      if (error instanceof Error) {
        console.error("[HOVER] Stack:", error.stack);
      }
      return null;
    }
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── ---- ────────────────────────────────┐
  getSymbolHover(document, params, word, span) {
    try {
      const uri = params.textDocument.uri;
      const text = document.getText();
      const { project, modulePath, currentModuleName } = determineProject(uri, this.projects);
      this.log("[HOVER] Running lint...");
      const result = project.lint(text, modulePath);
      const scopeManager = getScopeManager(project);
      if (!scopeManager) {
        console.warn("[HOVER] Could not access scope manager");
        return null;
      }
      this.log(`[HOVER] Looking up "${word}" at span: ${span}`);
      this.log(`[HOVER] Current module: ${currentModuleName}`);
      const symbol = scopeManager.lookupSymbolFromLSP(word, span, currentModuleName);
      if (!symbol) {
        this.log(`[HOVER] Symbol "${word}" not found`);
        return null;
      }
      this.log(`[HOVER] Found symbol: ${word} (${symbol.kind})`);
      return this.formatSymbolHover(symbol);
    } catch (error) {
      console.error("[HOVER] Error getting symbol hover:", error);
      return null;
    }
  }
  getKeywordHover(keyword) {
    const doc = this.syntax.getKeywordDoc(keyword);
    if (!doc) return null;
    const keywords = this.syntax.getLSPKeywords();
    if (!keywords) return null;
    const parts = [];
    const keywordType = keywords.types.includes(keyword) ? "type" : "keyword";
    parts.push(`**${keyword}** (${keywordType})`);
    parts.push("");
    parts.push("```kemet");
    parts.push(doc.signature);
    parts.push("```");
    parts.push("");
    parts.push(doc.description);
    if (doc.example) {
      parts.push("");
      parts.push("**Example:**");
      parts.push("```kemet");
      parts.push(doc.example);
      parts.push("```");
    }
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: parts.join("\n")
      }
    };
  }
  formatSymbolHover(symbol) {
    var _a, _b, _c, _d, _e;
    const parts = [];
    const kindName = symbol.kind.toLowerCase();
    parts.push(`**${symbol.name}** (${kindName})`);
    parts.push("");
    if (symbol.kind === "Function") {
      parts.push("```kemet");
      const visibility = symbol.visibility.kind === "Public" ? "pub " : "";
      const metadata = symbol.metadata || {};
      const params = metadata.params || [];
      const returnType = metadata.returnType ? formatType(metadata.returnType) : "void";
      const errorType = metadata.errorType ? formatType(metadata.errorType) : null;
      const paramStrs = params.map((p) => {
        var _a2;
        const mut = ((_a2 = p.mutability) == null ? void 0 : _a2.kind) === "Mutable" ? "mut " : "";
        return `${mut}${p.name}: ${p.type ? formatType(p.type) : "unknown"}`;
      });
      const errorPart = errorType ? `${errorType}!` : "";
      parts.push(`${visibility}fn ${symbol.name}(${paramStrs.join(", ")}) -> ${errorPart}${returnType}`);
      parts.push("```");
    } else if (symbol.kind === "Variable" || symbol.kind === "Parameter") {
      parts.push("```kemet");
      const visibility = ((_a = symbol.visibility) == null ? void 0 : _a.kind) === "Public" ? "pub " : "";
      const mutability = ((_b = symbol.mutability) == null ? void 0 : _b.kind) === "Mutable" ? "mut " : "";
      const typeStr = symbol.type ? formatType(symbol.type) : "unknown";
      parts.push(`${visibility}let ${mutability}${symbol.name}: ${typeStr}`);
      parts.push("```");
    }
    const info = [];
    if (((_c = symbol.visibility) == null ? void 0 : _c.kind) === "Public") info.push("**public**");
    if (((_d = symbol.mutability) == null ? void 0 : _d.kind) === "Mutable") info.push("**mutable**");
    if (symbol.isExported) info.push("**exported**");
    if ((_e = symbol.metadata) == null ? void 0 : _e.isBuiltin) info.push("**built-in**");
    if (info.length > 0) {
      parts.push("");
      parts.push(info.join(" \u2022 "));
    }
    if (symbol.module) {
      parts.push("");
      parts.push(`Module: \`${symbol.module}\``);
    }
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: parts.join("\n")
      }
    };
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ────────────────────────────────┐
  setupHandlers() {
    this.connection.onHover((params) => {
      return this.handleHover(params);
    });
  }
  log(message) {
    if (this.debug)
      console.log(message);
  }
  // └──────────────────────────────────────────────────────────────────────┘
};

// lib/utils/settings.ts
var SettingsManager = class {
  constructor(connection) {
    this.hasConfigurationCapability = true;
    this.documentSettings = /* @__PURE__ */ new Map();
    this.connection = connection;
    this.globalSettings = this.createDefaultSettings();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ────────────────────────────────┐
  getDocumentSettings(resource) {
    if (!this.hasConfigurationCapability) {
      return Promise.resolve(this.globalSettings);
    }
    let result = this.documentSettings.get(resource);
    if (!result) {
      result = this.connection.workspace.getConfiguration({
        scopeUri: resource,
        section: "kemet"
      });
      this.documentSettings.set(resource, result);
    }
    return result;
  }
  setConfigurationCapability(hasCapability) {
    this.hasConfigurationCapability = hasCapability;
  }
  handleConfigurationChange(change) {
    if (this.hasConfigurationCapability) {
      this.documentSettings.clear();
    } else {
      this.globalSettings = change.settings.kemet || this.createDefaultSettings();
    }
  }
  clearDocumentSettings(resource) {
    this.documentSettings.delete(resource);
  }
  clearAllSettings() {
    this.documentSettings.clear();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ────────────────────────────────┐
  createDefaultSettings() {
    return {
      path: "",
      showWarnings: true,
      showInfos: true,
      maxDiagnostics: 100,
      enableMetrics: false
    };
  }
  // └──────────────────────────────────────────────────────────────────────┘
};

// lib/utils/metrics.ts
var MetricsHandler = class {
  constructor(connection, projects, serverMetrics) {
    this.connection = connection;
    this.projects = projects;
    this.serverMetrics = serverMetrics;
    this.setupHandlers();
  }
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── MAIN ────────────────────────────────┐
  // TODO..
  // └──────────────────────────────────────────────────────────────────────┘
  // ┌──────────────────────────────── HELP ────────────────────────────────┐
  setupHandlers() {
  }
  // └──────────────────────────────────────────────────────────────────────┘
};

// lib/lsp.ts
var LSP = class {
  constructor(connection, documents, config) {
    // Projects
    this.projects = null;
    // Capabilities
    this.hasConfigurationCapability = true;
    this.hasWorkspaceFolderCapability = false;
    // Server metrics
    this.serverMetrics = {
      totalValidations: 0,
      totalErrors: 0,
      averageValidationTime: 0,
      cacheHitRate: 0
    };
    this.connection = connection;
    this.documents = documents;
    this.config = config;
    this.initializeProjects();
    this.initializeHandlers();
  }
  initializeProjects() {
    try {
      this.log("[LSP] Initializing projects...");
      const mainProjectConfig = ProjectLib.Project.loadConfigFromPath(this.config.rootPath);
      this.log(`[LSP] Config loaded: ${mainProjectConfig.name || "anonymous"}`);
      const mainProject = ProjectLib.Project.create(
        this.config.rootPath,
        {
          config: mainProjectConfig,
          syntax: this.config.syntax,
          isAnonymous: false
        }
      );
      this.log("[LSP] Main project created");
      const anonProject = ProjectLib.Project.createAnonymous(this.config.syntax);
      this.log("[LSP] Anonymous project created");
      this.projects = { main: mainProject, anonymous: anonProject };
      this.projects.main.initializeProgram();
      this.log("[LSP] Program initialized");
    } catch (error) {
      console.error("[LSP] Failed to initialize projects:", error);
      throw error;
    }
  }
  initializeHandlers() {
    if (!this.projects) {
      throw new Error("Projects must be initialized before handlers");
    }
    this.log("[LSP] Initializing feature handlers...");
    this.settingsManager = new SettingsManager(this.connection);
    this.diagnosticsHandler = new DiagnosticsHandler(
      this.connection,
      this.documents,
      this.projects,
      this.settingsManager,
      this.serverMetrics,
      this.config.debug
    );
    this.completionHandler = new CompletionHandler(
      this.connection,
      this.documents,
      this.projects,
      this.config.syntax,
      this.config.debug
    );
    this.hoverHandler = new HoverHandler(
      this.connection,
      this.documents,
      this.projects,
      this.config.syntax,
      this.config.debug
    );
    this.metricsHandler = new MetricsHandler(
      this.connection,
      this.projects,
      this.serverMetrics
    );
    this.log("[LSP] Feature handlers initialized");
  }
  start() {
    this.setupConnectionHandlers();
    this.setupDocumentHandlers();
    this.documents.listen(this.connection);
    this.connection.listen();
    this.log("[LSP] Server is now listening for requests");
  }
  setupConnectionHandlers() {
    this.connection.onInitialize((params) => {
      return this.handleInitialize(params);
    });
    this.connection.onInitialized(() => {
      this.handleInitialized();
    });
    this.connection.onDidChangeConfiguration((change) => {
      this.settingsManager.handleConfigurationChange(change);
      this.connection.languages.diagnostics.refresh();
    });
    this.connection.onDidChangeWatchedFiles((_change) => {
      this.log("[LSP] Watched file change detected");
      this.connection.languages.diagnostics.refresh();
    });
    this.connection.onShutdown(() => {
      this.handleShutdown();
    });
    this.connection.onExit(() => {
      this.log("[LSP] Server exiting");
      process.exit(0);
    });
  }
  setupDocumentHandlers() {
    this.documents.onDidOpen((e) => __async(this, null, function* () {
      this.log(`[LSP] Document opened: ${e.document.uri}`);
      this.connection.languages.diagnostics.refresh();
    }));
    this.documents.onDidClose((e) => {
      this.settingsManager.clearDocumentSettings(e.document.uri);
      this.diagnosticsHandler.clearInflightValidation(e.document.uri);
    });
    this.documents.onDidChangeContent((change) => __async(this, null, function* () {
      if (this.projects) {
        this.connection.languages.diagnostics.refresh();
      }
    }));
  }
  handleInitialize(params) {
    var _a, _b, _c;
    try {
      this.log("[LSP] Handling initialization...");
      const capabilities = params.capabilities;
      this.hasConfigurationCapability = !!((_a = capabilities.workspace) == null ? void 0 : _a.configuration);
      this.hasWorkspaceFolderCapability = !!((_b = capabilities.workspace) == null ? void 0 : _b.workspaceFolders);
      this.settingsManager.setConfigurationCapability(this.hasConfigurationCapability);
      const triggerChars = ((_c = this.config.syntax.lsp) == null ? void 0 : _c.triggerCharacters) || [".", ":", "@", " "];
      const result = {
        capabilities: {
          textDocumentSync: TextDocumentSyncKind.Incremental,
          completionProvider: {
            resolveProvider: true,
            triggerCharacters: triggerChars
          },
          diagnosticProvider: {
            interFileDependencies: false,
            workspaceDiagnostics: false
          },
          hoverProvider: true
        }
      };
      if (this.hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
          workspaceFolders: {
            supported: true
          }
        };
      }
      this.log("[LSP] Initialization complete");
      return result;
    } catch (e) {
      console.error("[LSP] Error during initialization:", e);
      throw e;
    }
  }
  handleInitialized() {
    try {
      if (this.hasConfigurationCapability) {
        this.connection.client.register(DidChangeConfigurationNotification.type, void 0);
      }
      if (this.hasWorkspaceFolderCapability) {
        this.connection.workspace.onDidChangeWorkspaceFolders((_event) => {
          this.log("[LSP] Workspace folder change event received");
        });
      }
      const langName = this.config.syntax.config.name || "Language";
      this.connection.window.showInformationMessage(`${langName} Language Server initialized successfully!`);
    } catch (e) {
      console.error("[LSP] Error in onInitialized:", e);
    }
  }
  handleShutdown() {
    try {
      this.log("[LSP] Shutdown requested");
      if (this.projects) {
        this.log(`[LSP] Final metrics: ${{
          server: this.serverMetrics,
          mainProject: this.projects.main.getMetrics(),
          anonymousProject: this.projects.anonymous.getMetrics()
        }}`);
        this.projects.main.destroy();
        this.projects.anonymous.destroy();
      }
      this.log("[LSP] Cleanup complete");
    } catch (e) {
      console.error("[LSP] Shutdown error:", e);
    }
  }
  getProjects() {
    return this.projects;
  }
  getServerMetrics() {
    return this.serverMetrics;
  }
  getSyntax() {
    return this.config.syntax;
  }
  log(message) {
    if (this.config.debug)
      console.log(message);
  }
};
export {
  LSP
};
//# sourceMappingURL=lsp.mjs.map