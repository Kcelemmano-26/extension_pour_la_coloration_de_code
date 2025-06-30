"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PersistenceManager {
    constructor(context) {
        this.context = context;
    }
    async saveAnnotations(annotations) {
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        const enablePersistence = config.get('enablePersistence', true);
        if (!enablePersistence) {
            return;
        }
        const mode = config.get('persistenceMode', 'workspace');
        const serializedData = this.serializeAnnotations(annotations);
        try {
            if (mode === 'file') {
                await this.saveToFile(serializedData);
            }
            else {
                await this.saveToWorkspace(serializedData);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de la sauvegarde: ${error}`);
        }
    }
    async loadAnnotations() {
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        const enablePersistence = config.get('enablePersistence', true);
        if (!enablePersistence) {
            return new Map();
        }
        const mode = config.get('persistenceMode', 'workspace');
        try {
            let data = null;
            if (mode === 'file') {
                data = await this.loadFromFile();
            }
            else {
                data = await this.loadFromWorkspace();
            }
            if (data) {
                return this.deserializeAnnotations(data);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erreur lors du chargement: ${error}`);
        }
        return new Map();
    }
    serializeAnnotations(annotations) {
        const serialized = {};
        for (const [documentKey, documentAnnotations] of annotations) {
            serialized[documentKey] = [];
            for (const [id, annotation] of documentAnnotations) {
                serialized[documentKey].push({
                    id,
                    startLine: annotation.range.start.line,
                    startCharacter: annotation.range.start.character,
                    endLine: annotation.range.end.line,
                    endCharacter: annotation.range.end.character,
                    title: annotation.title,
                    color: annotation.color,
                    timestamp: Date.now()
                });
            }
        }
        return {
            version: PersistenceManager.VERSION,
            annotations: serialized,
            lastModified: Date.now()
        };
    }
    deserializeAnnotations(data) {
        const annotations = new Map();
        for (const [documentKey, documentAnnotations] of Object.entries(data.annotations)) {
            const docMap = new Map();
            for (const annotation of documentAnnotations) {
                docMap.set(annotation.id, annotation);
            }
            annotations.set(documentKey, docMap);
        }
        return annotations;
    }
    async saveToWorkspace(data) {
        await this.context.workspaceState.update(PersistenceManager.STORAGE_KEY, data);
    }
    async loadFromWorkspace() {
        return this.context.workspaceState.get(PersistenceManager.STORAGE_KEY) || null;
    }
    async saveToFile(data) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('Aucun workspace ouvert pour sauvegarder le fichier');
        }
        const filePath = path.join(workspaceFolders[0].uri.fsPath, PersistenceManager.FILE_NAME);
        const jsonData = JSON.stringify(data, null, 2);
        await fs.promises.writeFile(filePath, jsonData, 'utf8');
    }
    async loadFromFile() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }
        const filePath = path.join(workspaceFolders[0].uri.fsPath, PersistenceManager.FILE_NAME);
        try {
            const jsonData = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(jsonData);
        }
        catch (error) {
            // Fichier n'existe pas ou erreur de lecture
            return null;
        }
    }
    async exportToMarkdown(annotations) {
        const markdown = this.generateMarkdown(annotations);
        const fileName = `annotations-${new Date().toISOString().split('T')[0]}.md`;
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(fileName),
            filters: {
                'Markdown': ['md']
            }
        });
        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(markdown, 'utf8'));
            vscode.window.showInformationMessage(`Export Markdown sauvegardé: ${uri.fsPath}`);
        }
    }
    async exportToJSDoc(annotations) {
        const jsdoc = this.generateJSDoc(annotations);
        const fileName = `annotations-jsdoc-${new Date().toISOString().split('T')[0]}.js`;
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(fileName),
            filters: {
                'JavaScript': ['js'],
                'TypeScript': ['ts']
            }
        });
        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(jsdoc, 'utf8'));
            vscode.window.showInformationMessage(`Export JSDoc sauvegardé: ${uri.fsPath}`);
        }
    }
    generateMarkdown(annotations) {
        let markdown = `# Annotations de Code\n\n`;
        markdown += `*Généré le ${new Date().toLocaleString()}*\n\n`;
        for (const [documentKey, documentAnnotations] of annotations) {
            if (documentAnnotations.size === 0)
                continue;
            const fileName = path.basename(documentKey);
            markdown += `## 📄 ${fileName}\n\n`;
            for (const annotation of documentAnnotations.values()) {
                const colorEmoji = this.getColorEmoji(annotation.color);
                markdown += `### ${colorEmoji} ${annotation.title}\n\n`;
                markdown += `**Lignes:** ${annotation.range.start.line + 1}-${annotation.range.end.line + 1}\n\n`;
                markdown += `**Couleur:** ${annotation.color}\n\n`;
                markdown += `---\n\n`;
            }
        }
        return markdown;
    }
    generateJSDoc(annotations) {
        let jsdoc = `/**\n * Annotations de Code\n * Généré le ${new Date().toLocaleString()}\n */\n\n`;
        for (const [documentKey, documentAnnotations] of annotations) {
            if (documentAnnotations.size === 0)
                continue;
            const fileName = path.basename(documentKey);
            jsdoc += `/**\n * @file ${fileName}\n */\n\n`;
            for (const annotation of documentAnnotations.values()) {
                jsdoc += `/**\n`;
                jsdoc += ` * @annotation ${annotation.title}\n`;
                jsdoc += ` * @lines ${annotation.range.start.line + 1}-${annotation.range.end.line + 1}\n`;
                jsdoc += ` * @color ${annotation.color}\n`;
                jsdoc += ` * @description Annotation ajoutée via Code Highlighter\n`;
                jsdoc += ` */\n\n`;
            }
        }
        return jsdoc;
    }
    getColorEmoji(color) {
        const colorMap = {
            '#3498db': '🔵',
            '#2ecc71': '🟢',
            '#e74c3c': '🔴',
            '#f39c12': '🟠',
            '#9b59b6': '🟣',
            '#1abc9c': '🟦',
            '#34495e': '⚫',
            '#e67e22': '🟤'
        };
        return colorMap[color] || '📝';
    }
}
exports.PersistenceManager = PersistenceManager;
PersistenceManager.STORAGE_KEY = 'codeHighlighter.annotations';
PersistenceManager.FILE_NAME = '.annotations.json';
PersistenceManager.VERSION = '2.0.0';
//# sourceMappingURL=persistenceManager.js.map