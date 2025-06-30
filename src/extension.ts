import * as vscode from 'vscode';
import { AnnotationManager } from './annotationManager';
import { ConfigurationPanel } from './configurationPanel';
import { PresetManager } from './presetManager';

let annotationManager: AnnotationManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension Code Highlighter v2.0 activée');
    
    annotationManager = new AnnotationManager(context);
    
    // Commande pour annoter la sélection
    const annotateCommand = vscode.commands.registerCommand('codeHighlighter.annotateSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {
            vscode.window.showWarningMessage('Veuillez sélectionner du code à annoter');
            return;
        }

        try {
            const panel = new ConfigurationPanel(context.extensionUri);
            const config = await panel.show();
            
            if (config) {
                await annotationManager.addAnnotation(editor, editor.selection, config.title, config.color);
                vscode.window.showInformationMessage('Annotation ajoutée avec succès');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de l'ajout d'annotation: ${error}`);
        }
    });

    // Commande pour supprimer l'annotation de la sélection
    const clearSelectionCommand = vscode.commands.registerCommand('codeHighlighter.clearSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const removed = await annotationManager.removeAnnotationAtPosition(editor, editor.selection.start);
        if (removed) {
            vscode.window.showInformationMessage('Annotation supprimée');
        } else {
            vscode.window.showInformationMessage('Aucune annotation trouvée à cette position');
        }
    });

    // Commande pour supprimer toutes les annotations
    const clearAllCommand = vscode.commands.registerCommand('codeHighlighter.clearAll', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        await annotationManager.clearAllAnnotations(editor);
        vscode.window.showInformationMessage('Toutes les annotations ont été supprimées');
    });

    // Commande pour exporter en Markdown
    const exportMarkdownCommand = vscode.commands.registerCommand('codeHighlighter.exportMarkdown', async () => {
        try {
            await annotationManager.exportMarkdown();
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de l'export Markdown: ${error}`);
        }
    });

    // Commande pour exporter en JSDoc
    const exportJSDocCommand = vscode.commands.registerCommand('codeHighlighter.exportJSDoc', async () => {
        try {
            await annotationManager.exportJSDoc();
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de l'export JSDoc: ${error}`);
        }
    });

    // Commande pour sauvegarder un preset
    const savePresetCommand = vscode.commands.registerCommand('codeHighlighter.savePreset', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {
            vscode.window.showWarningMessage('Veuillez sélectionner du code annoté');
            return;
        }

        // Cette commande sera principalement utilisée via l'interface de configuration
        vscode.window.showInformationMessage('Utilisez l\'interface de configuration pour sauvegarder des presets');
    });

    // Commande pour gérer les presets
    const managePresetsCommand = vscode.commands.registerCommand('codeHighlighter.managePresets', async () => {
        try {
            await PresetManager.managePresets();
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur lors de la gestion des presets: ${error}`);
        }
    });

    // Gérer le changement d'éditeur actif
    const onDidChangeActiveEditor = vscode.window.onDidChangeActiveTextEditor(() => {
        if (annotationManager) {
            annotationManager.refreshDecorations();
        }
    });

    // Gérer les modifications de document
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            annotationManager.handleDocumentChange(editor, event);
        }
    });

    // Gérer les changements de configuration
    const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('codeHighlighter')) {
            annotationManager.refreshDecorations();
        }
    });

    context.subscriptions.push(
        annotateCommand,
        clearSelectionCommand,
        clearAllCommand,
        exportMarkdownCommand,
        exportJSDocCommand,
        savePresetCommand,
        managePresetsCommand,
        onDidChangeActiveEditor,
        onDidChangeTextDocument,
        onDidChangeConfiguration
    );
}

export function deactivate() {
    if (annotationManager) {
        annotationManager.dispose();
    }
}