import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Annotation } from './annotationManager';

export interface SerializedAnnotation {
    id: string;
    startLine: number;
    startCharacter: number;
    endLine: number;
    endCharacter: number;
    title: string;
    color: string;
    timestamp: number;
}

export interface AnnotationData {
    version: string;
    annotations: { [documentPath: string]: SerializedAnnotation[] };
    lastModified: number;
}

export class PersistenceManager {
    private static readonly STORAGE_KEY = 'codeHighlighter.annotations';
    private static readonly FILE_NAME = '.annotations.json';
    private static readonly VERSION = '2.0.0';

    constructor(private context: vscode.ExtensionContext) {}

    public async saveAnnotations(annotations: Map<string, Map<string, Annotation>>): Promise<void> {
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        const enablePersistence = config.get<boolean>('enablePersistence', true);
        
        if (!enablePersistence) {
            return;
        }

        const mode = config.get<string>('persistenceMode', 'workspace');
        const serializedData = this.serializeAnnotations(annotations);

        try {
            if (mode === 'file') {
                await this.saveToFile(serializedData);
            } else {
                await this.saveToWorkspace(serializedData);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de la sauvegarde: ${error}`);
        }
    }

    public async loadAnnotations(): Promise<Map<string, Map<string, SerializedAnnotation>>> {
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        const enablePersistence = config.get<boolean>('enablePersistence', true);
        
        if (!enablePersistence) {
            return new Map();
        }

        const mode = config.get<string>('persistenceMode', 'workspace');

        try {
            let data: AnnotationData | null = null;
            
            if (mode === 'file') {
                data = await this.loadFromFile();
            } else {
                data = await this.loadFromWorkspace();
            }

            if (data) {
                return this.deserializeAnnotations(data);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors du chargement: ${error}`);
        }

        return new Map();
    }

    private serializeAnnotations(annotations: Map<string, Map<string, Annotation>>): AnnotationData {
        const serialized: { [documentPath: string]: SerializedAnnotation[] } = {};

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

    private deserializeAnnotations(data: AnnotationData): Map<string, Map<string, SerializedAnnotation>> {
        const annotations = new Map<string, Map<string, SerializedAnnotation>>();

        for (const [documentKey, documentAnnotations] of Object.entries(data.annotations)) {
            const docMap = new Map<string, SerializedAnnotation>();
            for (const annotation of documentAnnotations) {
                docMap.set(annotation.id, annotation);
            }
            annotations.set(documentKey, docMap);
        }

        return annotations;
    }

    private async saveToWorkspace(data: AnnotationData): Promise<void> {
        await this.context.workspaceState.update(PersistenceManager.STORAGE_KEY, data);
    }

    private async loadFromWorkspace(): Promise<AnnotationData | null> {
        return this.context.workspaceState.get<AnnotationData>(PersistenceManager.STORAGE_KEY) || null;
    }

    private async saveToFile(data: AnnotationData): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('Aucun workspace ouvert pour sauvegarder le fichier');
        }

        const filePath = path.join(workspaceFolders[0].uri.fsPath, PersistenceManager.FILE_NAME);
        const jsonData = JSON.stringify(data, null, 2);
        
        await fs.promises.writeFile(filePath, jsonData, 'utf8');
    }

    private async loadFromFile(): Promise<AnnotationData | null> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }

        const filePath = path.join(workspaceFolders[0].uri.fsPath, PersistenceManager.FILE_NAME);
        
        try {
            const jsonData = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(jsonData) as AnnotationData;
        } catch (error) {
            // Fichier n'existe pas ou erreur de lecture
            return null;
        }
    }

    public async exportToMarkdown(annotations: Map<string, Map<string, Annotation>>): Promise<void> {
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

    public async exportToJSDoc(annotations: Map<string, Map<string, Annotation>>): Promise<void> {
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

    private generateMarkdown(annotations: Map<string, Map<string, Annotation>>): string {
        let markdown = `# Annotations de Code\n\n`;
        markdown += `*Généré le ${new Date().toLocaleString()}*\n\n`;

        for (const [documentKey, documentAnnotations] of annotations) {
            if (documentAnnotations.size === 0) continue;

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

    private generateJSDoc(annotations: Map<string, Map<string, Annotation>>): string {
        let jsdoc = `/**\n * Annotations de Code\n * Généré le ${new Date().toLocaleString()}\n */\n\n`;

        for (const [documentKey, documentAnnotations] of annotations) {
            if (documentAnnotations.size === 0) continue;

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

    private getColorEmoji(color: string): string {
        const colorMap: { [key: string]: string } = {
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