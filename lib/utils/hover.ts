// hover.ts — Hover information provider
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { Connection, TextDocuments, CompletionItem, CompletionItemKind, TextDocumentPositionParams, Hover, MarkupKind, }
								from 'vscode-languageserver';
	import { TextDocument } 	from 'vscode-languageserver-textdocument';
	import * as ProjectLib 		from '@je-es/project';
	import { Span } 			from '@je-es/parser';
	import { fileURLToPath } 	from 'url';
	import * as Path 			from 'path';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

	export interface ServerMetrics {
		totalValidations		: number;
		totalErrors				: number;
		averageValidationTime	: number;
		cacheHitRate			: number;
	}

	export interface KeywordDoc {
		signature				: string;
		description				: string;
		example?				: string;
	}

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

	const KEYWORDS = {
		declarations: [
			'let', 'fn', 'def', 'use', 'pub', 'test'
		],

		types: [
			'i8', 'i16', 'i32', 'i64', 'isize', 'u8', 'u16', 'u32', 'u64', 'usize',
			'f16', 'f32', 'f64', 'bool', 'str', 'char', 'void', 'any', 'type',
			'struct', 'enum', 'errset', 'null_t', 'und_t'
		],

		controlFlow: [
			'if', 'else', 'switch', 'case', 'default', 'for', 'while',
			'break', 'continue', 'return', 'defer', 'throw'
		],

		modifiers: [
			'mut', 'pub', 'static', 'inline', 'comptime'
		],

		operators: [
			'as', 'typeof', 'sizeof', 'try', 'catch', 'orelse'
		],

		literals: [
			'true', 'false', 'null', 'und'
		],

		builtins: [
			'@print', '@i', 'self'
		]
	};

	const KEYWORD_DOCS: { [key: string]: KeywordDoc } = {
		// Declarations
		'let': {
			signature: 'let [pub] [mut] name: type = value',
			description: 'Declare a variable',
			example: 'let mut counter: i32 = 0;'
		},

		'fn': {
			signature: 'fn [pub] name(params) -> type { }',
			description: 'Declare a function',
			example: 'pub fn add(a: i32, b: i32) -> i32 { return a + b; }'
		},

		'def': {
			signature: 'def [pub] Name = type',
			description: 'Define a type alias',
			example: 'def MyInt = i32;'
		},

		'use': {
			signature: 'use symbol [as alias] from "path"',
			description: 'Import a symbol from another module',
			example: 'use MyType as T from "./types.k";'
		},

		// Type keywords
		'struct': {
			signature: 'struct { fields... }',
			description: 'Define a structure type',
			example: 'struct { x: i32, y: i32 }'
		},

		'enum': {
			signature: 'enum { Variant1, Variant2, ... }',
			description: 'Define an enumeration type',
			example: 'enum { Some: i32, None }'
		},

		'errset': {
			signature: 'errset { Error1, Error2, ... }',
			description: 'Define an error set type',
			example: 'errset { FileNotFound, AccessDenied }'
		},

		// Primitive types
		'i8': {
			signature: 'i8',
			description: 'Signed 8-bit integer (-128 to 127)'
		},

		'i16': {
			signature: 'i16',
			description: 'Signed 16-bit integer (-32,768 to 32,767)'
		},

		'i32': {
			signature: 'i32',
			description: 'Signed 32-bit integer (-2,147,483,648 to 2,147,483,647)'
		},

		'i64': {
			signature: 'i64',
			description: 'Signed 64-bit integer'
		},

		'u8': {
			signature: 'u8',
			description: 'Unsigned 8-bit integer (0 to 255)'
		},

		'u16': {
			signature: 'u16',
			description: 'Unsigned 16-bit integer (0 to 65,535)'
		},

		'u32': {
			signature: 'u32',
			description: 'Unsigned 32-bit integer (0 to 4,294,967,295)'
		},

		'u64': {
			signature: 'u64',
			description: 'Unsigned 64-bit integer'
		},

		'f32': {
			signature: 'f32',
			description: 'Single-precision 32-bit floating point'
		},

		'f64': {
			signature: 'f64',
			description: 'Double-precision 64-bit floating point'
		},

		'bool': {
			signature: 'bool',
			description: 'Boolean type (true or false)'
		},

		'str': {
			signature: 'str',
			description: 'String type (alias for []u8)'
		},

		'void': {
			signature: 'void',
			description: 'Void type (represents no value)'
		},

		// Control flow
		'if': {
			signature: 'if condition stmt [else stmt]',
			description: 'Conditional expression',
			example: 'if x > 0 { @print("positive"); }'
		},

		'while': {
			signature: 'while condition stmt',
			description: 'Loop while condition is true',
			example: 'while i < 10 { i = i + 1; }'
		},

		'for': {
			signature: 'for range stmt',
			description: 'Iterate over a range',
			example: 'for 0..10 { @print(@i); }'
		},

		'return': {
			signature: 'return [expr]',
			description: 'Return from a function',
			example: 'return x + y;'
		},

		// Modifiers
		'mut': {
			signature: 'mut',
			description: 'Make a variable mutable',
			example: 'let mut counter = 0;'
		},

		'pub': {
			signature: 'pub',
			description: 'Make a symbol public (exported)',
			example: 'pub let API_KEY = "...";'
		},

		// Operators
		'try': {
			signature: 'try expr',
			description: 'Try an expression that may error',
			example: 'let result = try riskyOperation();'
		},

		'catch': {
			signature: 'expr catch stmt',
			description: 'Handle errors from try expression',
			example: 'try riskyOp() catch { @print("error"); }'
		},

		// Literals
		'true': {
			signature: 'true',
			description: 'Boolean true value'
		},

		'false': {
			signature: 'false',
			description: 'Boolean false value'
		},

		'null': {
			signature: 'null',
			description: 'Null value'
		},

		'und': {
			signature: 'und',
			description: 'Undefined value'
		},
	};

	const BUILTIN_DOCS: { [key: string]: string } = {

		'@print':
		'```kemet\nfn @print(text: str) -> void\n```\n\nBuilt-in function to print text to output.',

		'@i':
		'```kemet\n@i: usize\n```\n\nLoop iteration index (available in `for` loops).',

		'self':
		'```kemet\nself\n```\n\nReference to the current instance (available in struct methods).'

	};

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class HoverHandler {

        // ┌──────────────────────────────── INIT ────────────────────────────────┐

			private connection			: Connection;
			private projects			: { main: ProjectLib.Project; anonymous: ProjectLib.Project };
			private documents			: TextDocuments<TextDocument>;

			constructor(
				connection: Connection,
				documents: TextDocuments<TextDocument>,
				projects: { main: ProjectLib.Project; anonymous: ProjectLib.Project }
			) {
				this.connection = connection;
				this.documents = documents;
				this.projects = projects;

				this.setupHandlers();
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ────────────────────────────────┐

			private handleHover(params: TextDocumentPositionParams): Hover | null {
				try {
					console.log('[HOVER] Request received at position:', params.position);

					const document = this.documents.get(params.textDocument.uri);
					if (!document) {
						console.warn('[HOVER] Document not found');
						return null;
					}

					const wordInfo = this.getWordAndSpanAtPosition(document, params.position);
					if (!wordInfo) {
						console.log('[HOVER] No word at position');
						return null;
					}

					const { word, span } = wordInfo;
					console.log(`[HOVER] Word: "${word}"`);

					// Check if it's a keyword
					const allKeywords = [
						...KEYWORDS.declarations,
						...KEYWORDS.types,
						...KEYWORDS.controlFlow,
						...KEYWORDS.modifiers,
						...KEYWORDS.operators,
						...KEYWORDS.literals
					];

					if (allKeywords.includes(word)) {
						console.log(`[HOVER] Found keyword: ${word}`);
						return this.getKeywordHover(word);
					}

					// Check if it's a builtin
					if (word.startsWith('@') || word === 'self') {
						const doc = BUILTIN_DOCS[word];
						if (doc) {
							console.log(`[HOVER] Found builtin: ${word}`);
							return {
								contents: {
									kind: MarkupKind.Markdown,
									value: doc
								}
							};
						}
					}

					// Look up symbol in scope manager
					return this.getSymbolHover(document, params, word, span);

				} catch (error) {
					console.error('[HOVER] Error:', error);
					if (error instanceof Error) {
						console.error('[HOVER] Stack:', error.stack);
					}
					return null;
				}
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ---- ────────────────────────────────┐

			private getSymbolHover(
				document: TextDocument,
				params: TextDocumentPositionParams,
				word: string,
				span: Span
			): Hover | null {
				try {
					const uri = params.textDocument.uri;
					const text = document.getText();

					// Determine which project to use
					const { project, modulePath, currentModuleName } = this.determineProject(uri);

					// Run lint to get fresh scope manager state
					console.log('[HOVER] Running lint...');
					const result = project.lint(text, modulePath);

					// Access scope manager
					const scopeManager = this.getScopeManager(project);
					if (!scopeManager) {
						console.warn('[HOVER] Could not access scope manager');
						return null;
					}

					console.log(`[HOVER] Looking up "${word}" at span:`, span);
					console.log(`[HOVER] Current module: ${currentModuleName}`);

					// Use LSP-aware symbol lookup
					const symbol = scopeManager.lookupSymbolFromLSP(word, span, currentModuleName);

					if (!symbol) {
						console.log(`[HOVER] Symbol "${word}" not found`);
						return null;
					}

					console.log(`[HOVER] Found symbol: ${word} (${symbol.kind})`);
					return this.formatSymbolHover(symbol);

				} catch (error) {
					console.error('[HOVER] Error getting symbol hover:', error);
					return null;
				}
			}

			private getKeywordHover(keyword: string): Hover | null {
				const doc = KEYWORD_DOCS[keyword];
				if (!doc) return null;

				const parts: string[] = [];
				const keywordType = KEYWORDS.types.includes(keyword) ? 'type' : 'keyword';
				parts.push(`**${keyword}** (${keywordType})`);
				parts.push('');
				parts.push('```kemet');
				parts.push(doc.signature);
				parts.push('```');
				parts.push('');
				parts.push(doc.description);

				if (doc.example) {
					parts.push('');
					parts.push('**Example:**');
					parts.push('```kemet');
					parts.push(doc.example);
					parts.push('```');
				}

				return {
					contents: {
						kind: MarkupKind.Markdown,
						value: parts.join('\n')
					}
				};
			}

			private getWordAndSpanAtPosition(
				document: TextDocument,
				position: { line: number; character: number }
			): { word: string; span: Span } | null {
				const text = document.getText();
				const offset = document.offsetAt(position);

				// Find word boundaries
				let start = offset;
				let end = offset;

				// Go backwards to find start
				while (start > 0 && /[a-zA-Z0-9_@]/.test(text[start - 1])) {
					start--;
				}

				// Go forwards to find end
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

			private getScopeManager(project: ProjectLib.Project): any {
				if (project.analyzer) {
					return project.analyzer.config?.services?.scopeManager;
				}

				const analyzer = (project as any)._analyzer || (project as any).analyzer;
				if (analyzer) {
					return analyzer.config?.services?.scopeManager;
				}

				if (typeof (project as any).getScopeManager === 'function') {
					return (project as any).getScopeManager();
				}

				return null;
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ---- ────────────────────────────────┐

			private formatType(type: any): string {
				if (!type || !type.kind) return 'unknown';

				switch (type.kind) {
					case 'i8': case 'i16': case 'i32': case 'i64':
					case 'u8': case 'u16': case 'u32': case 'u64':
					case 'f32': case 'f64':
					case 'bool': case 'void': case 'str':
						return type.kind;
					case 'pointer':
						return `*${this.formatType(type.getPointer()?.target)}`;
					case 'array':
						return `[]${this.formatType(type.getArray()?.target)}`;
					case 'optional':
						return `?${this.formatType(type.getOptional()?.target)}`;
					case 'function':
						return 'fn';
					case 'struct':
						return 'struct';
					case 'enum':
						return 'enum';
					default:
						return type.kind;
				}
			}

			private formatSymbolHover(symbol: any): Hover {
				const parts: string[] = [];

				// Header
				const kindName = symbol.kind.toLowerCase();
				parts.push(`**${symbol.name}** (${kindName})`);
				parts.push('');

				// Signature/Type
				if (symbol.kind === 'Function') {
					parts.push('```kemet');
					const visibility = symbol.visibility.kind === 'Public' ? 'pub ' : '';
					const metadata = symbol.metadata || {};
					const params = metadata.params || [];
					const returnType = metadata.returnType ? this.formatType(metadata.returnType) : 'void';
					const errorType = metadata.errorType ? this.formatType(metadata.errorType) : null;

					const paramStrs = params.map((p: any) => {
						const mut = p.mutability?.kind === 'Mutable' ? 'mut ' : '';
						return `${mut}${p.name}: ${p.type ? this.formatType(p.type) : 'unknown'}`;
					});

					const errorPart = errorType ? `${errorType}!` : '';
					parts.push(`${visibility}fn ${symbol.name}(${paramStrs.join(', ')}) -> ${errorPart}${returnType}`);
					parts.push('```');
				} else if (symbol.kind === 'Variable' || symbol.kind === 'Parameter') {
					parts.push('```kemet');
					const visibility = symbol.visibility?.kind === 'Public' ? 'pub ' : '';
					const mutability = symbol.mutability?.kind === 'Mutable' ? 'mut ' : '';
					const typeStr = symbol.type ? this.formatType(symbol.type) : 'unknown';
					parts.push(`${visibility}let ${mutability}${symbol.name}: ${typeStr}`);
					parts.push('```');
				}

				// Additional info
				const info: string[] = [];
				if (symbol.visibility?.kind === 'Public') info.push('**public**');
				if (symbol.mutability?.kind === 'Mutable') info.push('**mutable**');
				if (symbol.isExported) info.push('**exported**');
				if (symbol.metadata?.isBuiltin) info.push('**built-in**');

				if (info.length > 0) {
					parts.push('');
					parts.push(info.join(' • '));
				}

				// Module info
				if (symbol.module) {
					parts.push('');
					parts.push(`Module: \`${symbol.module}\``);
				}

				return {
					contents: {
						kind: MarkupKind.Markdown,
						value: parts.join('\n')
					}
				};
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ────────────────────────────────┐

			private setupHandlers(): void {
				this.connection.onHover((params: TextDocumentPositionParams) => {
					return this.handleHover(params);
				});
			}

			private determineProject(uri: string): {
				project: ProjectLib.Project;
				modulePath?: string;
				currentModuleName: string
			} {
				if (uri.startsWith('file://')) {
					try {
						const filePath = fileURLToPath(uri);
						const relative = Path.relative(this.projects.main.rootPath, filePath);
						const isInProject = !relative.startsWith('..') && !Path.isAbsolute(relative);

						if (isInProject && filePath.endsWith('.k')) {
							const moduleName = Path.basename(filePath, '.k');
							return {
								project: this.projects.main,
								modulePath: filePath,
								currentModuleName: moduleName
							};
						}
					} catch (e) {
						console.warn('[HOVER] Error determining project:', e);
					}
				}

				return {
					project: this.projects.anonymous,
					currentModuleName: 'main'
				};
			}

        // └──────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝