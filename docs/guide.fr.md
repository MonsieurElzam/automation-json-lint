## À quoi ça sert

`JSON.parse` accepte les clés dupliquées en gardant la dernière sans rien dire : une configuration peut donc contenir `"timeout": 5` puis `"timeout": 50` sans qu'aucun outil ne se plaigne. Ce script valide tous les fichiers JSON d'un dossier, indique la **ligne et la colonne** des erreurs de syntaxe et signale ces doublons.

## Avant de commencer

- Un dossier (ou un fichier) à contrôler. `node_modules`, `.git` et les dossiers de build sont ignorés.

## Pas à pas

1. Contrôlez un projet entier :
   ```bash
   node src/json-lint.mjs ./mon-projet
   ```
2. Pour les fichiers qui tolèrent commentaires et virgules finales (`tsconfig.json`, configurations d'éditeur), ajoutez `--jsonc`.
3. Corrigez en vous aidant de la ligne et de la colonne affichées.

## Lire le résultat

Une ligne `✗ fichier:ligne:colonne message` par problème. Une clé dupliquée est signalée avec son chemin (`$.options.timeout`).

## L'automatiser

En hook de pré-commit ou en CI : le code de sortie vaut 2 au premier problème.

## Pièges à éviter

- Sans `--jsonc`, un `tsconfig.json` commenté est (à raison) déclaré invalide : ce n'est pas du JSON strict.
- Le script ne vérifie pas la **structure** attendue (schéma), seulement la syntaxe et les doublons.
