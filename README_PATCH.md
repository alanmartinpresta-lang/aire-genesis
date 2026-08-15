# AIRE Genesis — Moniteur UI Patch v1

Patch visuel léger pour l'interface actuelle.

## Ce que le patch ajoute
- Monde avec vue légèrement inclinée/stylisée.
- Représentation légère d'Alpha directement en HTML/CSS, sans WebGL.
- Suivi Alpha et bouton Recentrer.
- Trajectoire visuelle simple.
- État expressif du casque dérivé des valeurs déjà affichées.
- Panneau Inventaire préparé pour les objets réellement conservés.
- Traduction des actions anglaises vers le français.
- Rafraîchissement visuel limité à environ 6 Hz afin de ne pas ralentir le moteur.
- Aucun changement du moteur Python ni de la logique de simulation.

## Installation manuelle
1. Ajouter `ui_patch_moniteur_v1.js` à la racine du dépôt.
2. Dans `index.html`, juste avant `</body>`, ajouter :
   `<script src="ui_patch_moniteur_v1.js"></script>`
3. Commit puis attendre le déploiement GitHub Pages.
4. Recharger Safari avec un rechargement complet.

## Important
Le panneau Inventaire est volontairement un emplacement UI dans cette première version : il n'invente aucun objet. Il affichera "Aucun objet enregistré" tant que le moteur n'expose pas une vraie collection d'objets conservés.

Le suivi utilise les coordonnées déjà présentes dans `#position`; il ne modifie pas les coordonnées d'Alpha.

Le rendu est volontairement 2D/CSS et très léger. Pas de modèle 3D, pas de bibliothèque graphique supplémentaire.
