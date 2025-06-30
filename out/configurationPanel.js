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
exports.ConfigurationPanel = void 0;
const vscode = __importStar(require("vscode"));
const presetManager_1 = require("./presetManager");
class ConfigurationPanel {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.disposables = [];
    }
    show() {
        return new Promise((resolve) => {
            this.panel = vscode.window.createWebviewPanel('codeHighlighterConfig', 'Configuration d\'annotation', vscode.ViewColumn.Beside, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            this.panel.webview.html = this.getWebviewContent();
            // Gérer les messages du webview
            this.panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.command) {
                    case 'submit':
                        resolve({
                            title: message.title,
                            color: message.color
                        });
                        this.dispose();
                        return;
                    case 'cancel':
                        resolve(undefined);
                        this.dispose();
                        return;
                    case 'savePreset':
                        await this.handleSavePreset(message.title, message.color);
                        return;
                    case 'loadPreset':
                        await this.handleLoadPreset();
                        return;
                }
            }, null, this.disposables);
            // Gérer la fermeture du panel
            this.panel.onDidDispose(() => {
                resolve(undefined);
                this.dispose();
            }, null, this.disposables);
        });
    }
    async handleSavePreset(title, color) {
        const name = await vscode.window.showInputBox({
            prompt: 'Nom du preset',
            placeHolder: 'Ex: Mon style favori',
            value: title
        });
        if (name) {
            const preset = { name, title, color };
            await presetManager_1.PresetManager.savePreset(preset);
        }
    }
    async handleLoadPreset() {
        const preset = await presetManager_1.PresetManager.showPresetPicker();
        if (preset && this.panel) {
            // Envoyer les données du preset au webview
            this.panel.webview.postMessage({
                command: 'loadPreset',
                title: preset.title,
                color: preset.color
            });
        }
    }
    getWebviewContent() {
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        const customColors = config.get('customColors', []);
        const defaultColors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];
        const allColors = [...defaultColors, ...customColors];
        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration d'annotation</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
        }
        
        .container {
            max-width: 450px;
            margin: 0 auto;
        }
        
        h1 {
            color: var(--vscode-titleBar-activeForeground);
            margin-bottom: 20px;
            font-size: 1.5em;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: var(--vscode-input-foreground);
        }
        
        input[type="text"] {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            box-sizing: border-box;
            font-size: 14px;
        }
        
        input[type="text"]:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }
        
        .preset-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        
        .btn-small {
            padding: 4px 8px;
            font-size: 12px;
            border: 1px solid var(--vscode-button-border);
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border-radius: 3px;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .btn-small:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .color-palette {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-top: 10px;
        }
        
        .color-option {
            width: 60px;
            height: 40px;
            border: 2px solid transparent;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .color-option:hover {
            transform: scale(1.1);
            border-color: var(--vscode-focusBorder);
        }
        
        .color-option.selected {
            border-color: var(--vscode-button-background);
            box-shadow: 0 0 0 2px var(--vscode-button-background);
        }
        
        .color-option::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        
        .color-option.selected::after {
            opacity: 0.8;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 30px;
        }
        
        button {
            padding: 8px 16px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s ease;
        }
        
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .preview {
            margin-top: 15px;
            padding: 10px;
            border-radius: 3px;
            font-size: 12px;
            opacity: 0.8;
            border: 1px dashed var(--vscode-input-border);
        }
        
        .preview-header {
            font-weight: bold;
            margin-bottom: 5px;
            padding: 2px 8px;
            border-radius: 3px 3px 0 0;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Configurer l'annotation</h1>
        
        <form id="configForm">
            <div class="form-group">
                <label for="title">Titre de l'en-tête :</label>
                <input 
                    type="text" 
                    id="title" 
                    placeholder="Ex: Important, À réviser, Bug..."
                    maxlength="50"
                    required
                />
                <div class="preset-actions">
                    <button type="button" class="btn-small" id="loadPresetBtn">📂 Charger preset</button>
                    <button type="button" class="btn-small" id="savePresetBtn">💾 Sauvegarder preset</button>
                </div>
            </div>
            
            <div class="form-group">
                <label>Couleur de fond :</label>
                <div class="color-palette">
                    ${allColors.map(color => `
                        <div class="color-option" data-color="${color}" style="background-color: ${color};" title="${color}"></div>
                    `).join('')}
                </div>
                <div id="preview" class="preview" style="display: none;">
                    <div id="previewHeader" class="preview-header"></div>
                    <div>Aperçu du bloc annoté</div>
                </div>
            </div>
            
            <div class="button-group">
                <button type="button" class="btn-secondary" id="cancelBtn">Annuler</button>
                <button type="submit" class="btn-primary" id="submitBtn">Appliquer</button>
            </div>
        </form>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let selectedColor = '#3498db';
        
        // Sélection par défaut
        document.querySelector('.color-option[data-color="#3498db"]').classList.add('selected');
        
        // Gestion de la sélection de couleur
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                selectedColor = this.dataset.color;
                updatePreview();
            });
        });
        
        // Mise à jour du preview
        function updatePreview() {
            const title = document.getElementById('title').value;
            const preview = document.getElementById('preview');
            const previewHeader = document.getElementById('previewHeader');
            
            if (title) {
                preview.style.display = 'block';
                preview.style.backgroundColor = selectedColor + '4D'; // 30% opacity
                previewHeader.style.backgroundColor = selectedColor;
                previewHeader.style.color = getContrastColor(selectedColor);
                previewHeader.innerHTML = \`📝 \${title}\`;
            } else {
                preview.style.display = 'none';
            }
        }
        
        function getContrastColor(hexColor) {
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5 ? '#000000' : '#ffffff';
        }
        
        document.getElementById('title').addEventListener('input', updatePreview);
        
        // Gestion du formulaire
        document.getElementById('configForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const title = document.getElementById('title').value.trim();
            
            if (!title) {
                document.getElementById('title').focus();
                return;
            }
            
            vscode.postMessage({
                command: 'submit',
                title: title,
                color: selectedColor
            });
        });
        
        document.getElementById('cancelBtn').addEventListener('click', function() {
            vscode.postMessage({
                command: 'cancel'
            });
        });
        
        document.getElementById('savePresetBtn').addEventListener('click', function() {
            const title = document.getElementById('title').value.trim();
            if (!title) {
                document.getElementById('title').focus();
                return;
            }
            
            vscode.postMessage({
                command: 'savePreset',
                title: title,
                color: selectedColor
            });
        });
        
        document.getElementById('loadPresetBtn').addEventListener('click', function() {
            vscode.postMessage({
                command: 'loadPreset'
            });
        });
        
        // Écouter les messages du webview
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'loadPreset':
                    document.getElementById('title').value = message.title;
                    selectedColor = message.color;
                    
                    // Mettre à jour la sélection de couleur
                    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                    const colorOption = document.querySelector(\`[data-color="\${message.color}"]\`);
                    if (colorOption) {
                        colorOption.classList.add('selected');
                    }
                    
                    updatePreview();
                    break;
            }
        });
        
        // Focus automatique sur le champ titre
        document.getElementById('title').focus();
    </script>
</body>
</html>`;
    }
    dispose() {
        if (this.panel) {
            this.panel.dispose();
        }
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
exports.ConfigurationPanel = ConfigurationPanel;
//# sourceMappingURL=configurationPanel.js.map