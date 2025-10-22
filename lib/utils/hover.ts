// hover.ts — Hover information provider
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { Connection, TextDocuments, TextDocumentPositionParams, Hover, MarkupKind }
									from 'vscode-languageserver';
	import { TextDocument } 		from 'vscode-languageserver-textdocument';
	import * as AnalyzerLib			from '@je-es/ast-analyzer';
	import * as ProjectLib 			from '@je-es/project';
	import type { Syntax } 			from '@je-es/syntax';
	import { Span } 				from '@je-es/parser';
	import { determineProject, formatType, getScopeManager, getWordAndSpanAtPosition }
									from './common';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class HoverHandler {

        // ┌──────────────────────────────── INIT ────────────────────────────────┐

			private connection	: Connection;
			private projects	: { main: ProjectLib.Project; anonymous: ProjectLib.Project };
			private documents	: TextDocuments<TextDocument>;
			private syntax		: Syntax;
			private debug 		= false;

			constructor(
				connection	: Connection,
				documents	: TextDocuments<TextDocument>,
				projects	: { main: ProjectLib.Project; anonymous: ProjectLib.Project },
				syntax		: Syntax,
				debug		= false
			) {
				this.connection = connection;
				this.documents 	= documents;
				this.projects 	= projects;
				this.syntax 	= syntax;
				this.debug 		= debug;

				this.setupHandlers();
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ────────────────────────────────┐

			private handleHover(params: TextDocumentPositionParams): Hover | null {
				try {
					this.log(`[HOVER] Request received at position: ${params.position}`);

					const document = this.documents.get(params.textDocument.uri);
					if (!document) {
						console.warn('[HOVER] Document not found');
						return null;
					}

					const wordInfo = getWordAndSpanAtPosition(document, params.position);
					if (!wordInfo) {
						this.log('[HOVER] No word at position');
						return null;
					}

					const { word, span } = wordInfo;
					this.log(`[HOVER] Word: "${word}"`);

					// Check if it's a keyword
					if (this.syntax.isKeyword(word)) {
						this.log(`[HOVER] Found keyword: ${word}`);
						return this.getKeywordHover(word);
					}

					// Check if it's a builtin
					if (this.syntax.isBuiltin(word) || word === 'self') {
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
					const { project, modulePath, currentModuleName } = determineProject(uri, this.projects);

					// Run lint to get fresh scope manager state
					this.log('[HOVER] Running lint...');
					// const result = project.lint(text, modulePath);

					// Access scope manager
					const scopeManager = getScopeManager(project);
					if (!scopeManager) {
						console.warn('[HOVER] Could not access scope manager');
						return null;
					}

					this.log(`[HOVER] Looking up "${word}" at span: ${span}`);
					this.log(`[HOVER] Current module: ${currentModuleName}`);

					// Use LSP-aware symbol lookup
					const symbol = scopeManager.lookupSymbolFromLSP(word, span, currentModuleName);

					if (!symbol) {
						this.log(`[HOVER] Symbol "${word}" not found`);
						return null;
					}

					this.log(`[HOVER] Found symbol: ${word} (${symbol.kind})`);
					return this.formatSymbolHover(symbol);

				} catch (error) {
					console.error('[HOVER] Error getting symbol hover:', error);
					return null;
				}
			}

			private getKeywordHover(keyword: string): Hover | null {
				const doc = this.syntax.getKeywordDoc(keyword);
				if (!doc) return null;

				const keywords = this.syntax.getLSPKeywords();
				if (!keywords) return null;

				const parts: string[] = [];
				const keywordType = keywords.types.includes(keyword) ? 'type' : 'keyword';
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

			private formatSymbolHover(symbol: AnalyzerLib.Symbol): Hover {
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
					const returnType = metadata.returnType ? formatType(metadata.returnType) : 'void';
					const errorType = metadata.errorType ? formatType(metadata.errorType) : null;

					const paramStrs = params.map((p: any) => {
						const mut = p.mutability?.kind === 'Mutable' ? 'mut ' : '';
						return `${mut}${p.name}: ${p.type ? formatType(p.type) : 'unknown'}`;
					});

					const errorPart = errorType ? `${errorType}!` : '';
					parts.push(`${visibility}fn ${symbol.name}(${paramStrs.join(', ')}) -> ${errorPart}${returnType}`);
					parts.push('```');
				} else if (symbol.kind === 'Variable' || symbol.kind === 'Parameter') {
					parts.push('```kemet');
					const visibility = symbol.visibility?.kind === 'Public' ? 'pub ' : '';
					const mutability = symbol.mutability?.kind === 'Mutable' ? 'mut ' : '';
					const typeStr = symbol.type ? formatType(symbol.type) : 'unknown';
					parts.push(`${visibility}let ${mutability}${symbol.name}: ${typeStr}`);
					parts.push('```');
				} else if(symbol.kind === 'Definition') {
					// def x = fn(i32, i32) -> i32 or maybe struct/enum/or any other type !
					parts.push('```kemet');
					const visibility = symbol.visibility?.kind === 'Public' ? 'pub ' : '';
					const typeStr = symbol.type ? formatType(symbol.type) : 'unknown';
					parts.push(`${visibility}def ${symbol.name}: ${typeStr}`);
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

			private log(message: string) {
				if(this.debug)
            	console.log(message);
			}

        // └──────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝