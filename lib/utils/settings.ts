// settings.ts — Settings and configuration management.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { Connection } from 'vscode-languageserver';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

	export interface ExtSettings {
		path				: string;
		showWarnings?		: boolean;
		showInfos?			: boolean;
		maxDiagnostics?		: number;
		enableMetrics?		: boolean;
	}

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class SettingsManager {

        // ┌──────────────────────────────── INIT ────────────────────────────────┐

			private connection					: Connection;
			private hasConfigurationCapability 	= true;
			private documentSettings 			= new Map<string, Thenable<ExtSettings>>();

			private globalSettings				: ExtSettings;

			constructor(connection: Connection) {
				this.connection = connection;
				this.globalSettings = this.createDefaultSettings();
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ────────────────────────────────┐

			getDocumentSettings(resource: string): Thenable<ExtSettings> {
				if (!this.hasConfigurationCapability) {
					return Promise.resolve(this.globalSettings);
				}

				let result = this.documentSettings.get(resource);
				if (!result) {
					result = this.connection.workspace.getConfiguration({
						scopeUri: resource,
						section: 'kemet'
					});
					this.documentSettings.set(resource, result);
				}
				return result;
			}

			setConfigurationCapability(hasCapability: boolean): void {
				this.hasConfigurationCapability = hasCapability;
			}

			handleConfigurationChange(change: any): void {
				if (this.hasConfigurationCapability) {
					this.documentSettings.clear();
				} else {
					this.globalSettings = <ExtSettings>(
						(change.settings.kemet || this.createDefaultSettings())
					);
				}
			}

			clearDocumentSettings(resource: string): void {
				this.documentSettings.delete(resource);
			}

			clearAllSettings(): void {
				this.documentSettings.clear();
			}

        // └──────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ────────────────────────────────┐

			createDefaultSettings(): ExtSettings {
                return {
					path				: '',
					showWarnings		: true,
					showInfos			: true,
					maxDiagnostics		: 100,
					enableMetrics		: false
				} as ExtSettings;
            }

        // └──────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝