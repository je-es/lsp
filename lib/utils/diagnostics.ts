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
	import { determineProject } from './common';

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
			private debug				= false;

			constructor(
				connection		: Connection,
				documents		: TextDocuments<TextDocument>,
				projects		: { main: ProjectLib.Project; anonymous: ProjectLib.Project },
				settingsManager	: SettingsManager,
				serverMetrics	: ServerMetrics,
				debug			= false
			) {
				this.connection 		= connection;
				this.documents 			= documents;
				this.projects 			= projects;
				this.settingsManager 	= settingsManager;
				this.serverMetrics 		= serverMetrics;
				this.debug 				= debug;

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

					this.log(`[DIAGNOSTICS] Returning ${diagnostics.length} diagnostics for ${document.uri}`);

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
							source: 'kls'
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

					this.log(`[DIAGNOSTICS] Starting validation for: ${uri}`);

					const settings = await this.settingsManager.getDocumentSettings(uri);

					// Determine which project to use
					const { project, modulePath } = determineProject(uri, this.projects);

					// Lint the document
					const result = await project.lintAsync(text, modulePath);

					this.log(`[DIAGNOSTICS] Lint result: has_error=${result.has_error}, has_warning=${result.has_warning}`);

					// Collect all diagnostics
					const allErrors = result.diagnosticManager.getAllErrors();
					const allWarnings = result.diagnosticManager.getAllWarnings();
					const allInfos = result.diagnosticManager.getAllInfos();

					this.log(`[DIAGNOSTICS] DiagnosticManager stats:`);
					this.log(`  - Errors: ${allErrors.length}`);
					this.log(`  - Warnings: ${allWarnings.length}`);
					this.log(`  - Infos: ${allInfos.length}`);

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
							source: 'kls'
						});

						this.updateMetrics(startTime, allErrors.length);
						return truncated;
					}

					this.updateMetrics(startTime, allErrors.length);

					const duration = Date.now() - startTime;
					this.log(`[DIAGNOSTICS] Returning ${diagnostics.length} diagnostics in ${duration}ms`);
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
						source: 'kls'
					}];
				}
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── ---- ────────────────────────────────┐

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
						source: 'kls',
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

			private log(message: string) {
				if(this.debug)
            	console.log(message);
			}

        // └──────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝