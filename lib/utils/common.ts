// common.ts — Shared utilities and helper functions
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { TextDocument } 		from 'vscode-languageserver-textdocument';
	import { CompletionItemKind } 	from 'vscode-languageserver';
	import * as ProjectLib 			from '@je-es/project';
	import * as AST 		    	from '@je-es/ast';
	import { Span } 				from '@je-es/ast';
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
	export function formatType(type: AST.TypeNode): string {
		return type.toString();
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

// ╚══════════════════════════════════════════════════════════════════════════════════════╝