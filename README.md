<!----------------------------------- BEG ----------------------------------->
<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="lsp" height="70" />
    </p>
</div>

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

<p align="center" style="font-style:italic; color:gray;">
    <br>
    A customizable language server protocol with full integration with vscode..!
    <br>
</p>

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>
<br>

<!--------------------------------------------------------------------------->



<!----------------------------------- HMM ----------------------------------->

## [8] [`@je-es/lsp`](https://github.com/je-es/lsp) 🚀

> _To understand the full context, please refer to [these documents](https://github.com/kemet-lang/.github/blob/main/profile/roadmap/MVP.md)._

```bash
# install using npm
npm install @je-es/lsp
```

```ts
// import using typescript
import * as lsp from "@je-es/lsp";
```


> Example:

```ts
// for vscode
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

// core
import { LSP } from '@je-es/lsp';

// your syntax
import { KemetSyntax } from '@kemet-lang/rules';
```

> then inside the vscode lsp `server.ts` file :

```ts
try {
    // Create connection and document manager
    const connection 	= createConnection(ProposedFeatures.all);
    const documents 	= new TextDocuments(TextDocument);

    // Initialize the LSP with syntax and workspace root
    const lsp = new LSP(connection, documents, {
        syntax		: KemetSyntax,
        rootPath	: process.cwd()
    });

    // Start the server
    lsp.start();

    console.log('[SERVER] Kemet LSP Server started successfully! 🚀');
} catch (error) {
    console.error('[SERVER] FATAL ERROR during initialization:', error);
    if (error instanceof Error) {
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
    }
    process.exit(1);
}
```


---


> #### 1. [@je-es/lexer](https://github.com/je-es/lexer)

> #### 2. [@je-es/parser](https://github.com/je-es/parser)

> #### 3. [@je-es/syntax](https://github.com/je-es/syntax)

> #### 4. [@je-es/ast](https://github.com/je-es/ast)

> #### 5. [@kemet-lang/rules](https://github.com/kemet-lang/rules)

> #### 6. [@je-es/ast-analyzer](https://github.com/je-es/ast-analyzer)

> #### 7. [@je-es/project](https://github.com/je-es/project)

> #### 8. [`@je-es/lsp`](https://github.com/je-es/lsp)

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

<p align="center">
    <b>
        <br>
        <i style="color: gray;">"
        Currently I'm working on a larger lsp, so I'll skip writing documentation for now due to time constraints.
        "</i>
        <br>
    </b>
</p>

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

<!--------------------------------------------------------------------------->



<!----------------------------------- END ----------------------------------->

<br>
<div align="center">
    <a href="https://github.com/maysara-elshewehy">
        <img src="https://img.shields.io/badge/Made with ❤️ by-Maysara-blue"/>
    </a>
</div>

<!-------------------------------------------------------------------------->