// diagnostics.ts — Diagnostics validation and reporting
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { Connection, TextDocuments, Diagnostic, DiagnosticSeverity, DocumentDiagnosticReportKind, type DocumentDiagnosticReport, }
								from 'vscode-languageserver';
	import { TextDocument } 	from 'vscode-languageserver-textdocument';
	import * as ProjectLib 		from '@je-es/project';
	import { Span } 			from '@je-es/parser';
	import { Diagnostic as KemetDiagnostic }
								from '@je-es/ast-analyzer';
	import { SettingsManager } 	from './settings';
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

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class DiagnosticsHandler {

        // ┌──────────────────────────────── INIT ────────────────────────────────┐

			private connection			: Connection;
			private documents			: TextDocuments<TextDocument>;
			private projects			: { main: ProjectLib.Project; anonymous: ProjectLib.Project };
			private settingsManager		: SettingsManager;
			private serverMetrics		: ServerMetrics;
			private inFlightValidations = new Map<string, Promise<Diagnostic[]>>();

			constructor(
				connection		: Connection,
				documents		: TextDocuments<TextDocument>,
				projects		: { main: ProjectLib.Project; anonymous: ProjectLib.Project },
				settingsManager	: SettingsManager,
				serverMetrics	: ServerMetrics
			) {
				this.connection 		= connection;
				this.documents 			= documents;
				this.projects 			= projects;
				this.settingsManager 	= settingsManager;
				this.serverMetrics 		= serverMetrics;

				this.setupHandlers();
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ────────────────────────────────┐

			private async handleDiagnostics(params: any): Promise<DocumentDiagnosticReport> {
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

					const diagnostics = await validationPromise;

					console.log(`[DIAGNOSTICS] Returning ${diagnostics.length} diagnostics for ${document.uri}`);

					return {
						kind: DocumentDiagnosticReportKind.Full,
						items: diagnostics
					};
				} catch (e) {
					console.error('[DIAGNOSTICS] Error:', e);

					return {
						kind: DocumentDiagnosticReportKind.Full,
						items: [{
							severity: DiagnosticSeverity.Error,
							range: {
								start: { line: 0, character: 0 },
								end: { line: 0, character: 0 }
							},
							message: `LSP internal error: ${e instanceof Error ? e.message : 'Unknown error'}`,
							source: 'kemet-lsp'
						}]
					};
				}
			}

			private async validateDocument(document: TextDocument): Promise<Diagnostic[]> {
				const startTime = Date.now();

				try {
					const diagnostics: Diagnostic[] = [];
					const text = document.getText();
					const uri = document.uri;

					console.log(`[DIAGNOSTICS] Starting validation for: ${uri}`);

					const settings = await this.settingsManager.getDocumentSettings(uri);

					// Determine which project to use
					const { project, modulePath } = this.determineProject(uri);

					// Lint the document
					const result = await project.lintAsync(text, modulePath);

					console.log(`[DIAGNOSTICS] Lint result: has_error=${result.has_error}, has_warning=${result.has_warning}`);

					// Collect all diagnostics
					const allErrors = result.diagnosticManager.getAllErrors();
					const allWarnings = result.diagnosticManager.getAllWarnings();
					const allInfos = result.diagnosticManager.getAllInfos();

					console.log(`[DIAGNOSTICS] DiagnosticManager stats:`);
					console.log(`  - Errors: ${allErrors.length}`);
					console.log(`  - Warnings: ${allWarnings.length}`);
					console.log(`  - Infos: ${allInfos.length}`);

					const allKemetDiags = [...allErrors, ...allWarnings, ...allInfos];

					// Convert Kemet diagnostics to LSP diagnostics
					for (const kemetDiag of allKemetDiags) {
						const diagnostic = this.convertKemetDiagnostic(kemetDiag, document, settings);
						if (diagnostic) {
							diagnostics.push(diagnostic);
						}
					}

					// Truncate if needed
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
							source: 'kemet-lsp'
						});

						this.updateMetrics(startTime, allErrors.length);
						return truncated;
					}

					this.updateMetrics(startTime, allErrors.length);

					const duration = Date.now() - startTime;
					console.log(`[DIAGNOSTICS] Returning ${diagnostics.length} diagnostics in ${duration}ms`);
					return diagnostics;

				} catch (e) {
					console.error('[DIAGNOSTICS] Unexpected error:', e);
					if (e instanceof Error) {
						console.error('[DIAGNOSTICS] Stack:', e.stack);
					}

					this.serverMetrics.totalValidations++;

					return [{
						severity: DiagnosticSeverity.Error,
						range: {
							start: { line: 0, character: 0 },
							end: { line: 0, character: 0 }
						},
						message: `LSP internal error: ${e instanceof Error ? e.message : 'Unknown error'}. Please check the output console.`,
						source: 'kemet-lsp'
					}];
				}
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ---- ────────────────────────────────┐

			private determineProject(uri: string): { project: ProjectLib.Project; modulePath?: string } {
				if (uri.startsWith('file://')) {
					try {
						const filePath = fileURLToPath(uri);
						const relative = Path.relative(this.projects.main.rootPath, filePath);
						const isInProject = !relative.startsWith('..') && !Path.isAbsolute(relative);

						if (isInProject && filePath.endsWith('.k')) {
							console.log(`[DIAGNOSTICS] Using main project for: ${filePath}`);
							return { project: this.projects.main, modulePath: filePath };
						}
					} catch (e) {
						console.warn('[DIAGNOSTICS] Error determining project:', e);
					}
				}

				console.log('[DIAGNOSTICS] Using anonymous project');
				return { project: this.projects.anonymous };
			}

			private convertKemetDiagnostic(
				kemetDiag: KemetDiagnostic,
				document: TextDocument,
				settings: any
			): Diagnostic | null {
				try {
					const span: Span = kemetDiag.targetSpan ?? kemetDiag.contextSpan ?? { start: 0, end: 0 };

					let severity: DiagnosticSeverity;
					if (kemetDiag.kind === 'error') {
						severity = DiagnosticSeverity.Error;
					} else if (kemetDiag.kind === 'warning') {
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
							end: document.positionAt(span.end),
						},
						message: kemetDiag.msg,
						source: 'kemet-lsp',
						code: kemetDiag.code
					};
				} catch (e) {
					console.warn('[DIAGNOSTICS] Error converting diagnostic:', e);
					return null;
				}
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ────────────────────────────────┐

			private setupHandlers(): void {
				this.connection.languages.diagnostics.on(async (params) => {
					return this.handleDiagnostics(params);
				});
			}

			private updateMetrics(startTime: number, errorCount: number): void {
				this.serverMetrics.totalValidations++;
				this.serverMetrics.totalErrors += errorCount;
				const duration = Date.now() - startTime;
				this.serverMetrics.averageValidationTime =
					(this.serverMetrics.averageValidationTime * (this.serverMetrics.totalValidations - 1) + duration) /
					this.serverMetrics.totalValidations;
			}

			clearInflightValidation(uri: string): void {
				this.inFlightValidations.delete(uri);
			}

        // └──────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝