// completion.ts — Smart autocomplete with scope-aware suggestions
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { Connection, TextDocuments, CompletionItem, CompletionItemKind, TextDocumentPositionParams }
								from 'vscode-languageserver';
	import { determineProject, getCompletionItemKind, getScopeManager, getSymbolDetail, getSymbolDocumentation }
								from './common';
	import { TextDocument } 	from 'vscode-languageserver-textdocument';
	import * as ProjectLib 		from '@je-es/project';
	import type { Syntax } 		from '@je-es/syntax';

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



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class CompletionHandler {

        // ┌──────────────────────────────── INIT ────────────────────────────────┐

			private connection	: Connection;
			private projects	: { main: ProjectLib.Project; anonymous: ProjectLib.Project };
			private documents	: TextDocuments<TextDocument>;
			private syntax		: Syntax;

			constructor(
				connection	: Connection,
				documents	: TextDocuments<TextDocument>,
				projects: { main: ProjectLib.Project; anonymous: ProjectLib.Project },
				syntax: Syntax
			) {
				this.connection = connection;
				this.documents = documents;
				this.projects = projects;
				this.syntax = syntax;

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
						const doc = this.syntax.getKeywordDoc(keyword);
						if (doc) {
							item.detail = doc.signature;
							item.documentation = `${doc.description}${doc.example ? '\n\nExample:\n' + doc.example : ''}`;
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
				const keywords = this.syntax.getLSPKeywords();
				
				if (!keywords) {
					console.warn('[COMPLETION] No LSP keywords available in syntax');
					return items;
				}

				let selectedKeywords: string[] = [];

				// Context-aware keyword suggestions
				if (context.isAfterLet) {
					selectedKeywords = ['mut', ...keywords.types];
				} else if (context.isAfterFn || context.isAfterDef) {
					return [];
				} else if (context.isAfterUse) {
					return [];
				} else if (context.isInFunction) {
					selectedKeywords = [
						...keywords.controlFlow,
						...keywords.declarations.filter(k => k !== 'pub'),
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
					const item: CompletionItem = {
						label: keyword,
						kind: keywords.types.includes(keyword)
							? CompletionItemKind.TypeParameter
							: keywords.controlFlow.includes(keyword)
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
				const keywords = this.syntax.getLSPKeywords();
				if (!keywords) return [];

				return keywords.builtins.map((builtin, index) => ({
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
					const uri  = position.textDocument.uri;
					const text = document.getText();

					// Determine which project to use
					const { project, modulePath, currentModuleName } = determineProject(uri, this.projects);

					// Run fresh lint with current content
					console.log('[COMPLETION] Running lint for autocomplete...');
					const startLint = Date.now();
					const result = project.lint(text, modulePath);
					console.log(`[COMPLETION] Lint completed in ${Date.now() - startLint}ms`);

					// Access scope manager
					const scopeManager = getScopeManager(project);
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
							kind: getCompletionItemKind(symbol.kind),
							data: `symbol_${symbol.id}`,
							detail: getSymbolDetail(symbol),
							documentation: getSymbolDocumentation(symbol),
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

        // └──────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝