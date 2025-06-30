import * as vscode from 'vscode';
import { Annotation } from './annotationManager';

export class AnnotationHoverProvider implements vscode.HoverProvider {
    private annotations: Map<string, Map<string, Annotation>> = new Map();

    public updateAnnotations(annotations: Map<string, Map<string, Annotation>>): void {
        this.annotations = annotations;
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const documentKey = document.uri.toString();
        const documentAnnotations = this.annotations.get(documentKey);

        if (!documentAnnotations) {
            return null;
        }

        // Chercher l'annotation qui contient la position
        for (const annotation of documentAnnotations.values()) {
            if (annotation.range.contains(position)) {
                return this.createHover(annotation);
            }
        }

        return null;
    }

    private createHover(annotation: Annotation): vscode.Hover {
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.supportHtml = true;

        // En-tête avec icône et titre
        markdown.appendMarkdown(`### 📝 ${annotation.title}\n\n`);

        // Informations sur l'annotation
        markdown.appendMarkdown(`**Lignes:** ${annotation.range.start.line + 1} - ${annotation.range.end.line + 1}\n\n`);
        
        // Aperçu de la couleur
        const colorPreview = `<span style="display: inline-block; width: 16px; height: 16px; background-color: ${annotation.color}; border-radius: 3px; margin-right: 8px; vertical-align: middle;"></span>`;
        markdown.appendMarkdown(`**Couleur:** ${colorPreview}\`${annotation.color}\`\n\n`);

        // Actions disponibles
        markdown.appendMarkdown(`---\n\n`);
        markdown.appendMarkdown(`*Clic droit pour modifier ou supprimer cette annotation*`);

        return new vscode.Hover(markdown, annotation.range);
    }
}