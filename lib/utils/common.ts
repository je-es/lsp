// common.ts — Shared utilities and helper functions
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { TextDocument } 		from 'vscode-languageserver-textdocument';
	import { CompletionItemKind } 	from 'vscode-languageserver';
	import * as ProjectLib 			from '@je-es/project';
	import { Span } 				from '@je-es/parser';
	import { fileURLToPath }		from 'url';
	import * as Path 				from 'path';
	import { SYMBOL_KIND_TO_COMPLETION_KIND } from './constants';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

	export interface ProjectContext {
		project				: ProjectLib.Project;
		modulePath?			: string;
		currentModuleName	: string;
	}

	export interface WordInfo {
		word				: string;
		span				: Span;
	}

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

	/**
	 * Determine which project to use based on the document URI.
	 * Returns main project if the file is within the project, otherwise anonymous project.
	 */
	export function determineProject(
		uri			: string,
		projects	: { main: ProjectLib.Project; anonymous: ProjectLib.Project }
	): ProjectContext {
		if (uri.startsWith('file://')) {
			try {
				const filePath 		= fileURLToPath(uri);
				const relative 		= Path.relative(projects.main.rootPath, filePath);
				const isInProject 	= !relative.startsWith('..') && !Path.isAbsolute(relative);

				if (isInProject && filePath.endsWith('.k')) {
					const moduleName = Path.basename(filePath, '.k');
					return {
						project				: projects.main,
						modulePath			: filePath,
						currentModuleName	: moduleName
					};
				}
			} catch (e) {
				console.warn('[COMMON] Error determining project:', e);
			}
		}

		return {
			project				: projects.anonymous,
			currentModuleName	: 'main'
		};
	}

	/**
	 * Access the scope manager from a project's analyzer.
	 * Tries multiple access patterns for compatibility.
	 */
	export function getScopeManager(project: ProjectLib.Project): any {
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

	/**
	 * Format a type for display in completions/hover.
	 */
	export function formatType(type: any): string {
		if (!type || !type.kind) return 'unknown';

		switch (type.kind) {
			case 'i8'	: case 'i16': case 'i32': case 'i64':
			case 'u8'	: case 'u16': case 'u32': case 'u64':
			case 'f32'	: case 'f64':
			case 'bool'	: case 'void': case 'str':
				return type.kind;
			case 'pointer':
				return `*${formatType(type.getPointer()?.target)}`;
			case 'array':
				return `[]${formatType(type.getArray()?.target)}`;
			case 'optional':
				return `?${formatType(type.getOptional()?.target)}`;
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

	/**
	 * Convert a symbol kind to LSP CompletionItemKind.
	 */
	export function getCompletionItemKind(symbolKind: string): CompletionItemKind {
		return SYMBOL_KIND_TO_COMPLETION_KIND[symbolKind] || CompletionItemKind.Text;
	}

	/**
	 * Get word and span at a specific position in a document.
	 */
	export function getWordAndSpanAtPosition(
		document: TextDocument,
		position: { line: number; character: number }
	): WordInfo | null {
		const text   = document.getText();
		const offset = document.offsetAt(position);

		// Find word boundaries
		let start = offset;
		let end   = offset;

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

	/**
	 * Get detailed symbol information for display.
	 */
	export function getSymbolDetail(symbol: any): string {
		if (symbol.type) {
			return `${symbol.kind}: ${formatType(symbol.type)}`;
		}
		return symbol.kind;
	}

	/**
	 * Get symbol documentation string.
	 */
	export function getSymbolDocumentation(symbol: any): string {
		const parts: string[] = [];

		if (symbol.visibility?.kind === 'Public') parts.push('public');
		if (symbol.mutability?.kind === 'Mutable') parts.push('mut');
		if (symbol.metadata?.callable) parts.push('callable');
		if (symbol.isExported) parts.push('exported');

		return parts.join(', ');
	}

	/**
	 * Check if a symbol should be included in completions based on visibility and context.
	 */
	export function shouldIncludeSymbol( symbol: any, currentModuleName: string, modulePath?: string ): boolean {
		// Skip synthetic symbols
		if (symbol.metadata?.isSynthetic) {
			return false;
		}

		const symbolModule = symbol.module || '';
		const isFromCurrentModule =
			symbolModule === modulePath ||
			symbolModule === currentModuleName ||
			symbolModule === '';

		const isImport = symbol.kind === 'Use';
		const isBuiltin = symbol.metadata?.isBuiltin === true;
		const isPublicExported = symbol.isExported && symbol.visibility?.kind === 'Public';

		return isFromCurrentModule || isImport || isBuiltin || isPublicExported;
	}

	/**
	 * Get keyword detail and documentation for completion resolve.
	 */
	export function getKeywordCompletionInfo(keyword: string, doc: any): { detail: string; documentation: string } {
		return {
			detail: doc.signature,
			documentation: `${doc.description}${doc.example ? '\n\nExample:\n' + doc.example : ''}`
		};
	}

	/**
	 * Format symbol for hover display with full signature and metadata.
	 */
	export function formatSymbolForHover(symbol: any): string[] {
		const parts: string[] = [];

		// Header
		const kindName = symbol.kind.toLowerCase();
		parts.push(`**${symbol.name}** (${kindName})`);
		parts.push('');

		// Signature/Type
		if (symbol.kind === 'Function') {
			parts.push('```kemet');
			const visibility 	= symbol.visibility?.kind === 'Public' ? 'pub ' : '';
			const metadata 		= symbol.metadata || {};
			const params 		= metadata.params || [];
			const returnType 	= metadata.returnType ? formatType(metadata.returnType) : 'void';
			const errorType 	= metadata.errorType ? formatType(metadata.errorType) : null;

			const paramStrs 	= params.map((p: any) => {
				const mut = p.mutability?.kind === 'Mutable' ? 'mut ' : '';
				return `${mut}${p.name}: ${p.type ? formatType(p.type) : 'unknown'}`;
			});

			const errorPart 	= errorType ? `${errorType}!` : '';
			parts.push(`${visibility}fn ${symbol.name}(${paramStrs.join(', ')}) -> ${errorPart}${returnType}`);
			parts.push('```');
		} else if (symbol.kind === 'Variable' || symbol.kind === 'Parameter') {
			parts.push('```kemet');
			const visibility = symbol.visibility?.kind === 'Public' ? 'pub ' : '';
			const mutability = symbol.mutability?.kind === 'Mutable' ? 'mut ' : '';
			const typeStr = symbol.type ? formatType(symbol.type) : 'unknown';
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

		return parts;
	}

// ╚══════════════════════════════════════════════════════════════════════════════════════╝