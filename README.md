# Douze

Cahier de piano interactif pour jouer d'oreille : degrés, transposition, arpèges dans les douze tonalités, accords et phrasé jazz, section rythmique d'accompagnement, entraînement de l'oreille relative.

Site 100 % statique (HTML, CSS, JavaScript sans dépendance ni étape de build).

## Mettre en ligne sur GitHub Pages

1. Crée un dépôt sur GitHub (par exemple `douze`).
2. Dépose **le contenu de ce dossier** à la racine du dépôt (`index.html` doit être à la racine).
3. Dans le dépôt : **Settings → Pages → Build and deployment → Source : « Deploy from a branch »**, branche `main`, dossier `/ (root)`, puis **Save**.
4. Après une minute, le site est en ligne sur `https://<ton-identifiant>.github.io/douze/`.

En ligne de commande :

```bash
git init && git add . && git commit -m "Douze"
git branch -M main
git remote add origin https://github.com/<ton-identifiant>/douze.git
git push -u origin main
```

## En local

Ouvre simplement `index.html` dans Chrome, Edge ou Firefox.

## À savoir

- **Son** : les notes de piano sont des échantillons du Salamander Grand Piano (Alexander Holm, CC BY 3.0) chargés depuis `tonejs.github.io`. Sans connexion, un synthé intégré prend le relais. Pour être autonome, copie les fichiers `C1…C7.mp3` et `Fs1…Fs6.mp3` dans un dossier du dépôt et change `SBASE` dans `js/audio.js`.
- **Polices** : Anybody et Instrument Sans (Google Fonts).
- **MIDI** : brancher un piano numérique en USB fonctionne dans Chrome et Edge (Web MIDI).
- **Micro** : le bouton « Micro » fait écouter le piano par le téléphone (une note à la fois). Il exige une page en `https`, ce qui est le cas sur GitHub Pages ; en ouvrant `index.html` directement, il reste indisponible.
- **Hors connexion** : `sw.js` met le site, les sons et les polices en cache ; sur téléphone, « Ajouter à l'écran d'accueil » l'installe comme une application. Après une mise à jour du dépôt, la nouvelle version apparaît au deuxième chargement.
- **Données** : réglages, scores et série sont enregistrés dans le navigateur (`localStorage`), rien n'est envoyé.

## Organisation

- `js/theory.js` : notes, gammes, accords, chiffres romains, voicings
- `js/audio.js` : piano, basse, batterie, boucles
- `js/band.js` : section rythmique (walking bass, comping)
- `js/ui.js` : clavier, commandes, MIDI
- `js/mic.js` : détection de la note jouée au micro
- `js/v-harmo.js` : exercices « accords d'une mélodie » et « oreille absolue »
- `js/v-renv.js` : renversements (défi et enchaînements)
- `sw.js`, `manifest.webmanifest`, `icons/` : installation et fonctionnement hors connexion
- `js/v-*.js` : les pages
- `js/app.js` : navigation
