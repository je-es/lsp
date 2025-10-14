// constants.ts — Shared constants for the language server
//                Re-exports from syntax configuration
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { CompletionItemKind } from 'vscode-languageserver';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

	// Re-export types from syntax
	export type { KeywordDoc, LSPKeywords, LSPConfig } from '@je-es/syntax';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

	/**
	 * Get LSP configuration from a syntax object.
	 * This allows the LSP to use language-specific configuration.
	 */
	export function getKeywordsFromSyntax(syntax: any): any {
		return syntax.lsp?.keywords;
	}

	export function getKeywordDocsFromSyntax(syntax: any): any {
		return syntax.lsp?.keywordDocs;
	}

	export function getBuiltinDocsFromSyntax(syntax: any): any {
		return syntax.lsp?.builtinDocs;
	}

	/**
	 * Symbol kind to LSP CompletionItemKind mapping.
	 */
	export const SYMBOL_KIND_TO_COMPLETION_KIND: { [key: string]: CompletionItemKind } = {
		'Function'		: CompletionItemKind.Function,
		'Variable'		: CompletionItemKind.Variable,
		'Parameter'		: CompletionItemKind.Variable,
		'Definition'	: CompletionItemKind.Class,
		'StructField'	: CompletionItemKind.Field,
		'EnumVariant'	: CompletionItemKind.EnumMember,
		'Use'			: CompletionItemKind.Module
	};

// ╚══════════════════════════════════════════════════════════════════════════════════════╝