import * as vscode from 'vscode';

export interface AnnotationPreset {
    name: string;
    title: string;
    color: string;
}

export class PresetManager {
    private static readonly CONFIG_KEY = 'codeHighlighter.presets';

    public static getPresets(): AnnotationPreset[] {
        const config = vscode.workspace.getConfiguration('codeHighlighter');
        return config.get<AnnotationPreset[]>('presets', []);
    }

    public static async savePreset(preset: AnnotationPreset): Promise<void> {
        const presets = this.getPresets();
        
        // Vérifier si un preset avec ce nom existe déjà
        const existingIndex = presets.findIndex(p => p.name === preset.name);
        
        if (existingIndex >= 0) {
            const overwrite = await vscode.window.showQuickPick(
                ['Oui', 'Non'],
                {
                    placeHolder: `Un preset "${preset.name}" existe déjà. Voulez-vous le remplacer ?`
                }
            );
            
            if (overwrite !== 'Oui') {
                return;
            }
            
            presets[existingIndex] = preset;
        } else {
            presets.push(preset);
        }

        const config = vscode.workspace.getConfiguration('codeHighlighter');
        await config.update('presets', presets, vscode.ConfigurationTarget.Global);
        
        vscode.window.showInformationMessage(`Preset "${preset.name}" sauvegardé avec succès`);
    }

    public static async deletePreset(presetName: string): Promise<void> {
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

    public static async showPresetPicker(): Promise<AnnotationPreset | undefined> {
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

    public static async managePresets(): Promise<void> {
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