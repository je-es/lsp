import { Connection, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as ProjectLib from '@je-es/project';

interface LSPConfig {
    syntax: unknown;
    rootPath: string;
}
interface ServerMetrics {
    totalValidations: number;
    totalErrors: number;
    averageValidationTime: number;
    cacheHitRate: number;
}
declare class KemetLSP {
    private connection;
    private documents;
    private config;
    private projects;
    private diagnosticsHandler;
    private completionHandler;
    private hoverHandler;
    private settingsManager;
    private metricsHandler;
    private hasConfigurationCapability;
    private hasWorkspaceFolderCapability;
    private serverMetrics;
    constructor(connection: Connection, documents: TextDocuments<TextDocument>, config: LSPConfig);
    private initializeProjects;
    private initializeHandlers;
    start(): void;
    private setupConnectionHandlers;
    private setupDocumentHandlers;
    private handleInitialize;
    private handleInitialized;
    private handleShutdown;
    getProjects(): {
        main: ProjectLib.Project;
        anonymous: ProjectLib.Project;
    } | null;
    getServerMetrics(): ServerMetrics;
}

export { KemetLSP, type LSPConfig, type ServerMetrics };
