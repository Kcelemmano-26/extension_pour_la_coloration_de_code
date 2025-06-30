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
exports.PresetManager = void 0;
const vscode = __importStar(require("vscode"));
class PresetManager {
    static getPresets() {
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        return config.get('presets', []);
    }
    static async savePreset(preset) {
        const presets = this.getPresets();
        // Vérifier si un preset avec ce nom existe déjà
        const existingIndex = presets.findIndex(p => p.name === preset.name);
        if (existingIndex >= 0) {
            const overwrite = await vscode.window.showQuickPick(['Oui', 'Non'], {
                placeHolder: `Un preset "${preset.name}" existe déjà. Voulez-vous le remplacer ?`
            });
            if (overwrite !== 'Oui') {
                return;
            }
            presets[existingIndex] = preset;
        }
        else {
            presets.push(preset);
        }
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        await config.update('presets', presets, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Preset "${preset.name}" sauvegardé avec succès`);
    }
    static async deletePreset(presetName) {
        const presets = this.getPresets();
        const filteredPresets = presets.filter(p => p.name !== presetName);
        if (filteredPresets.length === presets.length) {
            vscode.window.showWarningMessage(`Preset "${presetName}" non trouvé`);
            return;
        }
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        await config.update('presets', filteredPresets, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Preset "${presetName}" supprimé`);
    }
    static async showPresetPicker() {
        const presets = this.getPresets();
        if (presets.length === 0) {
            vscode.window.showInformationMessage('Aucun preset disponible');
            return undefined;
        }
        const items = presets.map(preset => ({
            label: preset.name,
            description: preset.title,
            detail: `Couleur: ${preset.color}`,
            preset
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Sélectionnez un preset d\'annotation'
        });
        return selected?.preset;
    }
    static async managePresets() {
        const presets = this.getPresets();
        if (presets.length === 0) {
            vscode.window.showInformationMessage('Aucun preset à gérer');
            return;
        }
        const items = presets.map(preset => ({
            label: `$(trash) ${preset.name}`,
            description: preset.title,
            detail: `Supprimer ce preset (${preset.color})`,
            preset
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Sélectionnez un preset à supprimer'
        });
        if (selected) {
            await this.deletePreset(selected.preset.name);
        }
    }
}
exports.PresetManager = PresetManager;
PresetManager.CONFIG_KEY = 'codeHighlighter.presets';
//# sourceMappingURL=presetManager.js.map