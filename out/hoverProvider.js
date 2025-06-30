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
exports.AnnotationHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
class AnnotationHoverProvider {
    constructor() {
        this.annotations = new Map();
    }
    updateAnnotations(annotations) {
        this.annotations = annotations;
    }
    provideHover(document, position, token) {
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
    createHover(annotation) {
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
exports.AnnotationHoverProvider = AnnotationHoverProvider;
//# sourceMappingURL=hoverProvider.js.map