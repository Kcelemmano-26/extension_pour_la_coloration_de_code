import * as vscode from 'vscode';
import { PersistenceManager, SerializedAnnotation } from './persistenceManager';
import { AnnotationHoverProvider } from './hoverProvider';

export interface Annotation {
    id: string;
    range: vscode.Range;
    title: string;
    color: string;
    decoration: vscode.TextEditorDecorationType;
}

export class AnnotationManager {
    private annotations: Map<string, Map<string, Annotation>> = new Map();
    private headerDecorations: Map<string, vscode.TextEditorDecorationType> = new Map();
    private persistenceManager: PersistenceManager;
    private hoverProvider: AnnotationHoverProvider;
    private hoverDisposable: vscode.Disposable | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.persistenceManager = new PersistenceManager(context);
        this.hoverProvider = new AnnotationHoverProvider();
        
        // Enregistrer le hover provider
        this.registerHoverProvider();
        
        // Charger les annotations sauvegardées
        this.loadAnnotations();

        // Nettoyer les décorations quand un document est fermé
        vscode.workspace.onDidCloseTextDocument((document) => {
            this.clearAnnotationsForDocument(document.uri.toString());
        });

        // Sauvegarder automatiquement les annotations
        vscode.workspace.onDidSaveTextDocument(() => {
            this.saveAnnotations();
        });
    }

    private registerHoverProvider(): void {
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        const enableHover = config.get<boolean>('enableHoverPreview', true);
        
        if (enableHover && !this.hoverDisposable) {
            this.hoverDisposable = vscode.languages.registerHoverProvider(
                { scheme: 'file' },
                this.hoverProvider
            );
        } else if (!enableHover && this.hoverDisposable) {
            this.hoverDisposable.dispose();
            this.hoverDisposable = undefined;
        }
    }

    public async addAnnotation(editor: vscode.TextEditor, selection: vscode.Selection, title: string, color: string): Promise<void> {
        const documentKey = editor.document.uri.toString();
        const annotationId = this.generateId();
        
        // Créer la décoration pour le fond
        const decoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.hexToRgba(color, 0.3),
            borderRadius: '3px',
            isWholeLine: false
        });

        // Créer la décoration pour l'en-tête
        const headerDecoration = vscode.window.createTextEditorDecorationType({
            before: {
                contentText: `📝 ${title}`,
                backgroundColor: color,
                color: this.getContrastColor(color),
                fontWeight: 'bold',
                margin: '0 0 2px 0',
                textDecoration: 'none; display: block; padding: 2px 8px; border-radius: 3px 3px 0 0; font-size: 0.9em;'
            }
        });

        const annotation: Annotation = {
            id: annotationId,
            range: new vscode.Range(selection.start, selection.end),
            title,
            color,
            decoration
        };

        // Stocker l'annotation
        if (!this.annotations.has(documentKey)) {
            this.annotations.set(documentKey, new Map());
        }
        this.annotations.get(documentKey)!.set(annotationId, annotation);

        // Appliquer les décorations
        this.applyDecorations(editor, documentKey);
        
        // Appliquer l'en-tête
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        const showHeaders = config.get<boolean>('showHeaders', true);
        
        if (showHeaders) {
            const headerRange = new vscode.Range(selection.start.line, 0, selection.start.line, 0);
            editor.setDecorations(headerDecoration, [headerRange]);
            
            // Stocker la décoration d'en-tête pour pouvoir la nettoyer plus tard
            this.headerDecorations.set(`${documentKey}-${annotationId}`, headerDecoration);
        }

        // Mettre à jour le hover provider
        this.hoverProvider.updateAnnotations(this.annotations);
        
        // Sauvegarder automatiquement
        await this.saveAnnotations();
    }

    public async removeAnnotationAtPosition(editor: vscode.TextEditor, position: vscode.Position): Promise<boolean> {
        const documentKey = editor.document.uri.toString();
        const documentAnnotations = this.annotations.get(documentKey);
        
        if (!documentAnnotations) {
            return false;
        }

        for (const [id, annotation] of documentAnnotations) {
            if (annotation.range.contains(position)) {
                // Nettoyer les décorations
                annotation.decoration.dispose();
                
                const headerKey = `${documentKey}-${id}`;
                const headerDecoration = this.headerDecorations.get(headerKey);
                if (headerDecoration) {
                    headerDecoration.dispose();
                    this.headerDecorations.delete(headerKey);
                }
                
                documentAnnotations.delete(id);
                this.applyDecorations(editor, documentKey);
                
                // Mettre à jour le hover provider
                this.hoverProvider.updateAnnotations(this.annotations);
                
                // Sauvegarder automatiquement
                await this.saveAnnotations();
                
                return true;
            }
        }
        
        return false;
    }

    public async clearAllAnnotations(editor: vscode.TextEditor): Promise<void> {
        const documentKey = editor.document.uri.toString();
        this.clearAnnotationsForDocument(documentKey);
        this.applyDecorations(editor, documentKey);
        
        // Mettre à jour le hover provider
        this.hoverProvider.updateAnnotations(this.annotations);
        
        // Sauvegarder automatiquement
        await this.saveAnnotations();
    }

    public refreshDecorations(): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const documentKey = editor.document.uri.toString();
        this.applyDecorations(editor, documentKey);
        
        // Re-enregistrer le hover provider si nécessaire
        this.registerHoverProvider();
    }

    public handleDocumentChange(editor: vscode.TextEditor, event: vscode.TextDocumentChangeEvent): void {
        // Pour simplifier, on actualise toutes les décorations après modification
        // Dans une version plus avancée, on pourrait ajuster les ranges des annotations
        this.refreshDecorations();
    }

    public async exportMarkdown(): Promise<void> {
        await this.persistenceManager.exportToMarkdown(this.annotations);
    }

    public async exportJSDoc(): Promise<void> {
        await this.persistenceManager.exportToJSDoc(this.annotations);
    }

    public dispose(): void {
        // Nettoyer toutes les décorations
        for (const documentAnnotations of this.annotations.values()) {
            for (const annotation of documentAnnotations.values()) {
                annotation.decoration.dispose();
            }
        }
        
        for (const decoration of this.headerDecorations.values()) {
            decoration.dispose();
        }
        
        if (this.hoverDisposable) {
            this.hoverDisposable.dispose();
        }
        
        this.annotations.clear();
        this.headerDecorations.clear();
    }

    private async saveAnnotations(): Promise<void> {
        await this.persistenceManager.saveAnnotations(this.annotations);
    }

    private async loadAnnotations(): Promise<void> {
        try {
            const serializedAnnotations = await this.persistenceManager.loadAnnotations();
            
            for (const [documentKey, documentAnnotations] of serializedAnnotations) {
                const docMap = new Map<string, Annotation>();
                
                for (const [id, serialized] of documentAnnotations) {
                    // Recréer les décorations
                    const decoration = vscode.window.createTextEditorDecorationType({
                        backgroundColor: this.hexToRgba(serialized.color, 0.3),
                        borderRadius: '3px',
                        isWholeLine: false
                    });

                    const annotation: Annotation = {
                        id: serialized.id,
                        range: new vscode.Range(
                            serialized.startLine,
                            serialized.startCharacter,
                            serialized.endLine,
                            serialized.endCharacter
                        ),
                        title: serialized.title,
                        color: serialized.color,
                        decoration
                    };
                    
                    docMap.set(id, annotation);
                }
                
                this.annotations.set(documentKey, docMap);
            }
            
            // Mettre à jour le hover provider
            this.hoverProvider.updateAnnotations(this.annotations);
            
            // Appliquer les décorations si un éditeur est ouvert
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                this.refreshDecorations();
            }
        } catch (error) {
            console.error('Erreur lors du chargement des annotations:', error);
        }
    }

    private applyDecorations(editor: vscode.TextEditor, documentKey: string): void {
        const documentAnnotations = this.annotations.get(documentKey);
        if (!documentAnnotations) {
            return;
        }

        // Grouper les annotations par couleur pour optimiser les performances
        const decorationGroups = new Map<string, vscode.Range[]>();
        
        for (const annotation of documentAnnotations.values()) {
            const key = annotation.color;
            if (!decorationGroups.has(key)) {
                decorationGroups.set(key, []);
            }
            decorationGroups.get(key)!.push(annotation.range);
        }

        // Appliquer chaque groupe de décorations
        for (const annotation of documentAnnotations.values()) {
            const ranges = decorationGroups.get(annotation.color) || [];
            if (ranges.includes(annotation.range)) {
                editor.setDecorations(annotation.decoration, [annotation.range]);
                // Retirer de la liste pour éviter les doublons
                const index = ranges.indexOf(annotation.range);
                ranges.splice(index, 1);
            }
        }

        // Appliquer les en-têtes
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        const showHeaders = config.get<boolean>('showHeaders', true);
        
        if (showHeaders) {
            for (const [id, annotation] of documentAnnotations) {
                const headerKey = `${documentKey}-${id}`;
                let headerDecoration = this.headerDecorations.get(headerKey);
                
                if (!headerDecoration) {
                    headerDecoration = vscode.window.createTextEditorDecorationType({
                        before: {
                            contentText: `📝 ${annotation.title}`,
                            backgroundColor: annotation.color,
                            color: this.getContrastColor(annotation.color),
                            fontWeight: 'bold',
                            margin: '0 0 2px 0',
                            textDecoration: 'none; display: block; padding: 2px 8px; border-radius: 3px 3px 0 0; font-size: 0.9em;'
                        }
                    });
                    this.headerDecorations.set(headerKey, headerDecoration);
                }
                
                const headerRange = new vscode.Range(annotation.range.start.line, 0, annotation.range.start.line, 0);
                editor.setDecorations(headerDecoration, [headerRange]);
            }
        }
    }

    private clearAnnotationsForDocument(documentKey: string): void {
        const documentAnnotations = this.annotations.get(documentKey);
        if (!documentAnnotations) {
            return;
        }

        for (const [id, annotation] of documentAnnotations) {
            annotation.decoration.dispose();
            
            const headerKey = `${documentKey}-${id}`;
            const headerDecoration = this.headerDecorations.get(headerKey);
            if (headerDecoration) {
                headerDecoration.dispose();
                this.headerDecorations.delete(headerKey);
            }
        }
        
        this.annotations.delete(documentKey);
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private hexToRgba(hex: string, alpha: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    private getContrastColor(hexColor: string): string {
        // Calculer la luminosité de la couleur
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }
}