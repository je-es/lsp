// lsp.ts — A customizable language server protocol with full integration with vscode.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Connection, TextDocuments, InitializeParams, InitializeResult, DidChangeConfigurationNotification, TextDocumentSyncKind, }
                                    from 'vscode-languageserver';
    import { TextDocument }         from 'vscode-languageserver-textdocument';
    import * as ProjectLib          from '@je-es/project';
    import type { Syntax }          from '@je-es/syntax';
    import { DiagnosticsHandler }   from './utils/diagnostics';
    import { CompletionHandler }    from './utils/completion';
    import { HoverHandler }         from './utils/hover';
    import { SettingsManager }      from './utils/settings';
    import { MetricsHandler }       from './utils/metrics';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface LSPConfig {
        syntax          : Syntax;
        rootPath        : string;
    }

    export interface ServerMetrics {
        totalValidations: number;
        totalErrors: number;
        averageValidationTime: number;
        cacheHitRate: number;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class LSP {
        private connection  : Connection;
        private documents   : TextDocuments<TextDocument>;
        private config      : LSPConfig;

        // Projects
        private projects: { main: ProjectLib.Project; anonymous: ProjectLib.Project } | null = null;

        // Feature handlers
        private diagnosticsHandler!: DiagnosticsHandler;
        private completionHandler!: CompletionHandler;
        private hoverHandler!: HoverHandler;
        private settingsManager!: SettingsManager;
        private metricsHandler!: MetricsHandler;

        // Capabilities
        private hasConfigurationCapability = true;
        private hasWorkspaceFolderCapability = false;

        // Server metrics
        private serverMetrics: ServerMetrics = {
            totalValidations: 0,
            totalErrors: 0,
            averageValidationTime: 0,
            cacheHitRate: 0
        };

        constructor(connection: Connection, documents: TextDocuments<TextDocument>, config: LSPConfig) {
            this.connection = connection;
            this.documents = documents;
            this.config = config;

            this.initializeProjects();
            this.initializeHandlers();
        }

        private initializeProjects(): void {
            try {
                console.log('[LSP] Initializing projects...');

                // Load main project config
                const mainProjectConfig = ProjectLib.Project.loadConfigFromPath(this.config.rootPath);
                console.log('[LSP] Config loaded:', mainProjectConfig.name || 'anonymous');

                // Create main project
                const mainProject = ProjectLib.Project.create(
                    this.config.rootPath,
                    {
                        config: mainProjectConfig,
                        syntax: this.config.syntax,
                        isAnonymous: false,
                    }
                );
                console.log('[LSP] Main project created');

                // Create anonymous project for untitled/external files
                const anonProject = ProjectLib.Project.createAnonymous(this.config.syntax);
                console.log('[LSP] Anonymous project created');

                this.projects = { main: mainProject, anonymous: anonProject };

                // Initialize the main project's program
                this.projects.main.initializeProgram();
                console.log('[LSP] Program initialized');

            } catch (error) {
                console.error('[LSP] Failed to initialize projects:', error);
                throw error;
            }
        }

        private initializeHandlers(): void {
            if (!this.projects) {
                throw new Error('Projects must be initialized before handlers');
            }

            console.log('[LSP] Initializing feature handlers...');

            // Settings manager
            this.settingsManager = new SettingsManager(this.connection);

            // Diagnostics handler
            this.diagnosticsHandler = new DiagnosticsHandler(
                this.connection,
                this.documents,
                this.projects,
                this.settingsManager,
                this.serverMetrics
            );

            // Completion handler (now receives syntax)
            this.completionHandler = new CompletionHandler(
                this.connection,
                this.documents,
                this.projects,
                this.config.syntax
            );

            // Hover handler (now receives syntax)
            this.hoverHandler = new HoverHandler(
                this.connection,
                this.documents,
                this.projects,
                this.config.syntax
            );

            // Metrics handler
            this.metricsHandler = new MetricsHandler(
                this.connection,
                this.projects,
                this.serverMetrics
            );

            console.log('[LSP] Feature handlers initialized');
        }

        public start(): void {
            this.setupConnectionHandlers();
            this.setupDocumentHandlers();

            // Start listening
            this.documents.listen(this.connection);
            this.connection.listen();

            console.log('[LSP] Server is now listening for requests');
        }

        private setupConnectionHandlers(): void {
            // Initialize
            this.connection.onInitialize((params: InitializeParams) => {
                return this.handleInitialize(params);
            });

            this.connection.onInitialized(() => {
                this.handleInitialized();
            });

            // Configuration
            this.connection.onDidChangeConfiguration(change => {
                this.settingsManager.handleConfigurationChange(change);
                this.connection.languages.diagnostics.refresh();
            });

            // Watched files
            this.connection.onDidChangeWatchedFiles(_change => {
                console.log('[LSP] Watched file change detected');
                this.connection.languages.diagnostics.refresh();
            });

            // Shutdown
            this.connection.onShutdown(() => {
                this.handleShutdown();
            });

            this.connection.onExit(() => {
                console.log('[LSP] Server exiting');
                process.exit(0);
            });
        }

        private setupDocumentHandlers(): void {
            // Document lifecycle
            this.documents.onDidOpen(async e => {
                console.log(`[LSP] Document opened: ${e.document.uri}`);
                this.connection.languages.diagnostics.refresh();
            });

            this.documents.onDidClose(e => {
                this.settingsManager.clearDocumentSettings(e.document.uri);
                this.diagnosticsHandler.clearInflightValidation(e.document.uri);
            });

            this.documents.onDidChangeContent(async change => {
                if (this.projects) {
                    this.connection.languages.diagnostics.refresh();
                }
            });
        }

        private handleInitialize(params: InitializeParams): InitializeResult {
            try {
                console.log('[LSP] Handling initialization...');

                const capabilities = params.capabilities;
                this.hasConfigurationCapability = !!(capabilities.workspace?.configuration);
                this.hasWorkspaceFolderCapability = !!(capabilities.workspace?.workspaceFolders);

                // Update settings manager
                this.settingsManager.setConfigurationCapability(this.hasConfigurationCapability);

                // Get trigger characters from syntax LSP config
                const triggerChars = this.config.syntax.lsp?.triggerCharacters || ['.', ':', '@', ' '];

                const result: InitializeResult = {
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

                console.log('[LSP] Initialization complete');
                return result;
            } catch (e) {
                console.error('[LSP] Error during initialization:', e);
                throw e;
            }
        }

        private handleInitialized(): void {
            try {
                if (this.hasConfigurationCapability) {
                    this.connection.client.register(DidChangeConfigurationNotification.type, undefined);
                }

                if (this.hasWorkspaceFolderCapability) {
                    this.connection.workspace.onDidChangeWorkspaceFolders(_event => {
                        console.log('[LSP] Workspace folder change event received');
                    });
                }

                const langName = this.config.syntax.config.name || 'Language';
                this.connection.window.showInformationMessage(`${langName} Language Server initialized successfully!`);
            } catch (e) {
                console.error('[LSP] Error in onInitialized:', e);
            }
        }

        private handleShutdown(): void {
            try {
                console.log('[LSP] Shutdown requested');

                if (this.projects) {
                    console.log('[LSP] Final metrics:', {
                        server: this.serverMetrics,
                        mainProject: this.projects.main.getMetrics(),
                        anonymousProject: this.projects.anonymous.getMetrics()
                    });

                    this.projects.main.destroy();
                    this.projects.anonymous.destroy();
                }

                console.log('[LSP] Cleanup complete');
            } catch (e) {
                console.error('[LSP] Shutdown error:', e);
            }
        }

        public getProjects() {
            return this.projects;
        }

        public getServerMetrics() {
            return this.serverMetrics;
        }

        public getSyntax() {
            return this.config.syntax;
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝