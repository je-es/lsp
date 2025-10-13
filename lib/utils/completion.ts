// completion.ts — Smart autocomplete with scope-aware suggestions
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { Connection, TextDocuments, CompletionItem, CompletionItemKind, TextDocumentPositionParams, }
								from 'vscode-languageserver';
	import { TextDocument } 	from 'vscode-languageserver-textdocument';
	import * as ProjectLib 		from '@je-es/project';
	import { fileURLToPath } 	from 'url';
	import * as Path 			from 'path';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

	export interface CompletionContext {
		isInFunction	: boolean;
		isInStruct		: boolean;
		isInEnum		: boolean;
		isAfterDot		: boolean;
		isAfterUse		: boolean;
		isAfterLet		: boolean;
		isAfterFn		: boolean;
		isAfterDef		: boolean;
		previousToken	: string;
		currentScope	: string;
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

	const KEYWORD_DOCS: { [key: string]: { detail: string, documentation: string } } = {
		'fn': {
			detail: 'fn',
			documentation: 'Declare a function\nExample: fn name(param: type) -> type { }'
		},
		'let': {
			detail: 'let',
			documentation: 'Declare a variable\nExample: let name: type = value;'
		},
		'pub': {
			detail: 'pub',
			documentation: 'Make item public (exported from module)'
		},
		'use': {
			detail: 'use',
			documentation: 'Import from another module\nExample: use symbol from "path"'
		},
		'def': {
			detail: 'def',
			documentation: 'Define a type alias\nExample: def MyType = i32'
		},
		'struct': {
			detail: 'struct',
			documentation: 'Declare a structure\nExample: struct { field: type }'
		},
		'enum': {
			detail: 'enum',
			documentation: 'Declare an enumeration\nExample: enum { Variant }'
		},
		'if': {
			detail: 'if',
			documentation: 'Conditional statement\nExample: if condition { }'
		},
		'else': {
			detail: 'else',
			documentation: 'Alternative branch for if'
		},
		'while': {
			detail: 'while',
			documentation: 'Loop statement\nExample: while condition { }'
		},
		'for': {
			detail: 'for',
			documentation: 'For-range loop\nExample: for 0..10 { }'
		},
		'return': {
			detail: 'return',
			documentation: 'Return from function\nExample: return value;'
		},
		'mut': {
			detail: 'mut',
			documentation: 'Mutable modifier for variables'
		},
		'try': {
			detail: 'try',
			documentation: 'Try an expression that may error'
		},
		'catch': {
			detail: 'catch',
			documentation: 'Catch errors from try expression'
		},
	};

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class CompletionHandler {

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

			private handleCompletion(params: TextDocumentPositionParams): CompletionItem[] {
				try {
					console.log('[COMPLETION] Request received at position:', params.position);

					const document = this.documents.get(params.textDocument.uri);
					if (!document) {
						console.warn('[COMPLETION] Document not found');
						return [];
					}

					const context = this.analyzeCompletionContext(document, params);
					console.log('[COMPLETION] Context:', JSON.stringify(context, null, 2));

					const items: CompletionItem[] = [];

					// Don't suggest anything after dot (member access - needs more context)
					if (!context.isAfterDot) {
						// Add keywords based on context
						items.push(...this.getKeywordCompletions(context));

						// Add builtins
						items.push(...this.getBuiltinCompletions());

						// Add symbols from scope manager
						items.push(...this.getScopeSymbolCompletions(document, params));
					}

					console.log(`[COMPLETION] Returning ${items.length} total items`);
					return items;
				} catch (e) {
					console.error('[COMPLETION] Error:', e);
					if (e instanceof Error) {
						console.error('[COMPLETION] Stack:', e.stack);
					}
					return [];
				}
			}

			private handleCompletionResolve(item: CompletionItem): CompletionItem {
				try {
					// Add detailed documentation for keywords
					if (item.data && typeof item.data === 'string' && item.data.startsWith('keyword_')) {
						const keyword = item.label;
						const doc = KEYWORD_DOCS[keyword];
						if (doc) {
							item.detail = doc.detail;
							item.documentation = doc.documentation;
						}
					}
					return item;
				} catch (e) {
					console.error('[COMPLETION] CompletionResolve error:', e);
					return item;
				}
			}

			private analyzeCompletionContext(
				document: TextDocument,
				position: TextDocumentPositionParams
			): CompletionContext {
				const text = document.getText();
				const offset = document.offsetAt(position.position);
				const lineText = text.substring(
					document.offsetAt({ line: position.position.line, character: 0 }),
					offset
				);

				// Extract previous tokens
				const tokens = lineText.trim().split(/\s+/);
				const previousToken = tokens.length > 1 ? tokens[tokens.length - 2] : '';
				const currentToken = tokens[tokens.length - 1] || '';

				return {
					isInFunction: /\bfn\b/.test(text.substring(0, offset)),
					isInStruct: /\bstruct\s*\{/.test(text.substring(0, offset)),
					isInEnum: /\benum\s*\{/.test(text.substring(0, offset)),
					isAfterDot: currentToken.endsWith('.') || previousToken === '.',
					isAfterUse: previousToken === 'use',
					isAfterLet: previousToken === 'let',
					isAfterFn: previousToken === 'fn',
					isAfterDef: previousToken === 'def',
					previousToken,
					currentScope: 'global'
				};
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ---- ────────────────────────────────┐

			private getKeywordCompletions(context: CompletionContext): CompletionItem[] {
				const items: CompletionItem[] = [];
				let keywords: string[] = [];

				// Context-aware keyword suggestions
				if (context.isAfterLet) {
					keywords = ['mut', ...KEYWORDS.types];
				} else if (context.isAfterFn || context.isAfterDef) {
					return [];
				} else if (context.isAfterUse) {
					return [];
				} else if (context.isInFunction) {
					keywords = [
						...KEYWORDS.controlFlow,
						...KEYWORDS.declarations.filter(k => k !== 'pub'),
						...KEYWORDS.operators,
						...KEYWORDS.literals
					];
				} else {
					keywords = [
						...KEYWORDS.declarations,
						...KEYWORDS.types,
						...KEYWORDS.controlFlow,
						...KEYWORDS.modifiers,
						...KEYWORDS.operators,
						...KEYWORDS.literals
					];
				}

				keywords.forEach((keyword, index) => {
					const item: CompletionItem = {
						label: keyword,
						kind: KEYWORDS.types.includes(keyword)
							? CompletionItemKind.TypeParameter
							: KEYWORDS.controlFlow.includes(keyword)
							? CompletionItemKind.Keyword
							: CompletionItemKind.Keyword,
						data: `keyword_${index}`,
						sortText: `0_${keyword}`
					};
					items.push(item);
				});

				return items;
			}

			private getBuiltinCompletions(): CompletionItem[] {
				return KEYWORDS.builtins.map((builtin, index) => ({
					label: builtin,
					kind: builtin === 'self' ? CompletionItemKind.Variable : CompletionItemKind.Function,
					data: `builtin_${index}`,
					detail: builtin === '@print' ? 'fn(str) -> void' : undefined,
					sortText: `1_${builtin}`
				}));
			}

			private getScopeSymbolCompletions(
				document: TextDocument,
				position: TextDocumentPositionParams
			): CompletionItem[] {
				try {
					const uri = position.textDocument.uri;
					const text = document.getText();

					// Determine which project to use
					const { project, modulePath, currentModuleName } = this.determineProject(uri);

					// Run fresh lint with current content
					console.log('[COMPLETION] Running lint for autocomplete...');
					const startLint = Date.now();
					const result = project.lint(text, modulePath);
					console.log(`[COMPLETION] Lint completed in ${Date.now() - startLint}ms`);

					// Access scope manager
					const scopeManager = this.getScopeManager(project);
					if (!scopeManager) {
						console.error('[COMPLETION] Could not access scope manager');
						return [];
					}

					const allSymbols = scopeManager.getAllSymbols();
					console.log(`[COMPLETION] Found ${allSymbols.length} total symbols`);

					const items: CompletionItem[] = [];
					const seenSymbols = new Set<string>();

					for (const symbol of allSymbols) {
						// Skip duplicates and synthetic symbols
						if (seenSymbols.has(symbol.name) || symbol.metadata?.isSynthetic) {
							continue;
						}

						// Filter symbols appropriately
						const symbolModule = symbol.module || '';
						const isFromCurrentModule =
							symbolModule === modulePath ||
							symbolModule === currentModuleName ||
							symbolModule === '';

						const isImport = symbol.kind === 'Use';
						const isBuiltin = symbol.metadata?.isBuiltin === true;
						const isPublicExported = symbol.isExported && symbol.visibility.kind === 'Public';

						if (!isFromCurrentModule && !isImport && !isBuiltin && !isPublicExported) {
							continue;
						}

						seenSymbols.add(symbol.name);

						const item: CompletionItem = {
							label: symbol.name,
							kind: this.getCompletionItemKind(symbol.kind),
							data: `symbol_${symbol.id}`,
							detail: this.getSymbolDetail(symbol),
							documentation: this.getSymbolDocumentation(symbol),
							sortText: `2_${symbol.name}`
						};

						items.push(item);
					}

					console.log(`[COMPLETION] Returning ${items.length} symbols`);
					return items;

				} catch (error) {
					console.error('[COMPLETION] Error getting scope symbols:', error);
					return [];
				}
			}

			private getScopeManager(project: ProjectLib.Project): any {
				// Try multiple ways to access the analyzer
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

			private getCompletionItemKind(symbolKind: string): CompletionItemKind {
				switch (symbolKind) {
					case 'Function': return CompletionItemKind.Function;
					case 'Variable': return CompletionItemKind.Variable;
					case 'Parameter': return CompletionItemKind.Variable;
					case 'Definition': return CompletionItemKind.Class;
					case 'StructField': return CompletionItemKind.Field;
					case 'EnumVariant': return CompletionItemKind.EnumMember;
					case 'Use': return CompletionItemKind.Module;
					default: return CompletionItemKind.Text;
				}
			}

			private getSymbolDetail(symbol: any): string {
				if (symbol.type) {
					return `${symbol.kind}: ${this.formatType(symbol.type)}`;
				}
				return symbol.kind;
			}

			private getSymbolDocumentation(symbol: any): string {
				const parts: string[] = [];

				if (symbol.visibility.kind === 'Public') parts.push('public');
				if (symbol.mutability.kind === 'Mutable') parts.push('mut');
				if (symbol.metadata?.callable) parts.push('callable');
				if (symbol.isExported) parts.push('exported');

				return parts.join(', ');
			}

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

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ────────────────────────────────┐

			private setupHandlers(): void {
				this.connection.onCompletion((params: TextDocumentPositionParams) => {
					return this.handleCompletion(params);
				});

				this.connection.onCompletionResolve((item: CompletionItem) => {
					return this.handleCompletionResolve(item);
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
							console.log(`[COMPLETION] Using main project, module: ${moduleName}`);
							return {
								project: this.projects.main,
								modulePath: filePath,
								currentModuleName: moduleName
							};
						}
					} catch (e) {
						console.warn('[COMPLETION] Error determining project:', e);
					}
				}

				console.log('[COMPLETION] Using anonymous project');
				return {
					project: this.projects.anonymous,
					currentModuleName: 'main'
				};
			}

        // └──────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝