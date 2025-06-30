# Code Highlighter with Annotations v2.0

Extension Visual Studio Code avancée permettant d'annoter et de mettre en évidence des blocs de code avec des en-têtes personnalisés, des couleurs d'arrière-plan, la persistance des données et des fonctionnalités d'export.

## 🚀 Nouvelles fonctionnalités v1.0

### 💾 Persistance des annotations
- **Sauvegarde automatique** : Les annotations sont automatiquement sauvegardées
- **Modes de persistance** :
  - `workspace` : Sauvegarde dans VS Code (par défaut)
  - `file` : Sauvegarde dans un fichier `.annotations.json`
- **Restauration automatique** : Les annotations sont rechargées à l'ouverture

### 📄 Export de documentation
- **Export Markdown** : Génère un fichier `.md` avec toutes les annotations
- **Export JSDoc** : Crée des commentaires JSDoc compatibles
- **Format structuré** : Organisation par fichier avec métadonnées

### 🎨 Système de presets
- **Presets prédéfinis** : Important, À réviser, Bug, TODO, Note
- **Presets personnalisés** : Sauvegardez vos configurations favorites
- **Gestion complète** : Chargement, sauvegarde et suppression
- **Couleurs personnalisées** : Ajoutez vos propres couleurs via les paramètres

### 🔍 Prévisualisation au survol
- **Hover intelligent** : Aperçu détaillé au survol des annotations
- **Informations complètes** : Titre, lignes, couleur et actions
- **Design moderne** : Interface élégante avec Markdown stylé

## 📦 Fonctionnalités principales

- **Annotation de code** : Sélectionnez du code et ajoutez un en-tête personnalisé
- **Mise en évidence visuelle** : 8+ couleurs prédéfinies + couleurs personnalisées
- **Interface intuitive** : Popup de configuration avec aperçu en temps réel
- **Non-destructif** : Aucune modification du fichier source
- **Multi-langages** : Compatible avec tous les langages supportés par VS Code
- **Gestion complète** : Ajout, suppression et nettoyage des annotations

## 📦 Installation

### Depuis le code source

1. Clonez ou téléchargez ce projet
2. Ouvrez un terminal dans le dossier du projet
3. Installez les dépendances :
   ```bash
   npm install
   ```
4. Compilez l'extension :
   ```bash
   npm run compile
   ```
5. Ouvrez VS Code et appuyez sur `F5` pour lancer une nouvelle instance avec l'extension

### Depuis un package .vsix

1. Générez le package :
   ```bash
   npm install -g vsce
   vsce package
   ```
2. Installez le fichier .vsix généré :
   ```bash
   code --install-extension code-highlighter-annotations-1.0.0.vsix
   ```

## 🎯 Utilisation

### Annoter du code

1. **Sélectionnez** le code à annoter
2. **Clic droit** > "Annoter la sélection" ou `Ctrl+Alt+H` (Mac: `Cmd+Alt+H`)
3. **Configurez** l'annotation :
   - Saisissez un titre pour l'en-tête
   - Choisissez une couleur
   - Utilisez les presets pour gagner du temps
   - Visualisez l'aperçu en temps réel
4. **Cliquez** sur "Appliquer"

### Gérer les presets

- **Sauvegarder** : Dans l'interface de configuration, cliquez sur "💾 Sauvegarder preset"
- **Charger** : Cliquez sur "📂 Charger preset" et sélectionnez votre preset
- **Gérer** : Palette de commandes > "Code Highlighter: Gérer les presets"

### Exporter la documentation

- **Markdown** : `Ctrl+Alt+M` ou menu contextuel > "Code Highlighter Export" > "Exporter en Markdown"
- **JSDoc** : Menu contextuel > "Code Highlighter Export" > "Exporter en JSDoc"

### Prévisualisation

- **Survol** : Passez la souris sur une annotation pour voir les détails
- **Informations** : Titre, lignes concernées, couleur et actions disponibles

## ⌨️ Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Alt+H` (Mac: `Cmd+Alt+H`) | Annoter la sélection |
| `Ctrl+Alt+Shift+H` (Mac: `Cmd+Alt+Shift+H`) | Supprimer l'annotation |
| `Ctrl+Alt+M` (Mac: `Cmd+Alt+M`) | Exporter en Markdown |

## ⚙️ Configuration avancée

### Paramètres disponibles

```json
{
  "codeHighlighter.defaultColor": "#3498db",
  "codeHighlighter.showHeaders": true,
  "codeHighlighter.enablePersistence": true,
  "codeHighlighter.persistenceMode": "workspace",
  "codeHighlighter.enableHoverPreview": true,
  "codeHighlighter.customColors": ["#ff6b6b", "#4ecdc4"],
  "codeHighlighter.presets": [
    {"name": "Critical", "title": "Critique", "color": "#e74c3c"}
  ]
}
```

### Modes de persistance

- **`workspace`** : Sauvegarde dans VS Code (recommandé)
  - ✅ Portable entre machines
  - ✅ Pas de fichiers supplémentaires
  - ✅ Sauvegarde automatique

- **`file`** : Sauvegarde dans `.annotations.json`
  - ✅ Partage avec l'équipe
  - ✅ Contrôle de version
  - ⚠️ Fichier visible dans le projet

## 🎨 Couleurs disponibles

### Couleurs prédéfinies
- 🔵 Bleu (#3498db)
- 🟢 Vert (#2ecc71)
- 🔴 Rouge (#e74c3c)
- 🟠 Orange (#f39c12)
- 🟣 Violet (#9b59b6)
- 🟦 Turquoise (#1abc9c)
- ⚫ Gris foncé (#34495e)
- 🟤 Orange foncé (#e67e22)

### Couleurs personnalisées
Ajoutez vos propres couleurs via les paramètres :
```json
"codeHighlighter.customColors": ["#ff6b6b", "#4ecdc4", "#45b7d1"]
```

## 📋 Formats d'export

### Export Markdown
```markdown
# Annotations de Code

## 📄 example.js

### 🔴 Bug critique
**Lignes:** 15-20
**Couleur:** #e74c3c
```

### Export JSDoc
```javascript
/**
 * @annotation Bug critique
 * @lines 15-20
 * @color #e74c3c
 * @description Annotation ajoutée via Code Highlighter
 */
```

## 🛠️ Développement

### Structure du projet v2.0

```
src/
├── extension.ts              # Point d'entrée principal
├── annotationManager.ts      # Gestion des annotations (amélioré)
├── configurationPanel.ts     # Interface de configuration (améliorée)
├── persistenceManager.ts     # Gestion de la persistance (nouveau)
├── hoverProvider.ts          # Prévisualisation au survol (nouveau)
└── presetManager.ts          # Gestion des presets (nouveau)
```

### Nouvelles APIs utilisées

- **WorkspaceState** : Persistance des annotations
- **HoverProvider** : Prévisualisation au survol
- **Configuration API** : Paramètres avancés
- **File System API** : Export de fichiers

## 🔄 Migration depuis v1.0

Les annotations existantes sont automatiquement migrées vers le nouveau système de persistance. Aucune action requise.

## 🐛 Problèmes connus

- Les annotations peuvent se décaler lors de modifications importantes du fichier
- Le mode `file` nécessite un workspace ouvert
- Les couleurs personnalisées ne sont pas validées automatiquement

## 📋 Roadmap v2.1

- [ ] Synchronisation cloud des presets
- [ ] Annotations collaboratives en temps réel
- [ ] Support des thèmes d'annotations
- [ ] API pour extensions tierces
- [ ] Amélioration de la gestion des modifications de document

## 🤝 Contribution

Les contributions sont les bienvenues ! Nouvelles fonctionnalités v2.0 :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Tester avec les nouvelles APIs
4. Commiter vos modifications
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 👨‍💻 Auteur

Développé avec ❤️ pour améliorer l'expérience de développement dans VS Code.

---

**Annotez, sauvegardez, exportez et partagez ! 🎉**