# AIRE Genesis 3 — application iPhone

Cette version exécute le moteur Python Genesis 3 directement dans Safari grâce à Pyodide.
Il n'y a pas besoin d'ordinateur, de serveur personnel ou d'API payante.

## Installation depuis un iPhone

1. Mettre `index.html` sur un hébergement statique gratuit (GitHub Pages est recommandé).
2. Ouvrir l'adresse HTTPS obtenue dans Safari.
3. Utiliser « Partager → Sur l'écran d'accueil » pour l'avoir comme une application.
4. Au premier lancement, Safari télécharge Pyodide et NumPy. Une connexion Internet est donc nécessaire au premier chargement.
5. Ensuite, l'application exécute les calculs localement sur l'iPhone. Le checkpoint est sauvegardé dans le stockage local du navigateur.

## Important

- Le moteur AIRE embarqué est celui fourni dans Genesis 3, hors doublon `aire_tmp`.
- La simulation est réellement exécutée par Python/NumPy dans le navigateur; ce n'est pas une animation factice.
- Les performances dépendent de l'iPhone. Pour des expériences longues, il faudra ensuite ajouter un mode « accéléré » et éventuellement une stratégie de calcul par blocs.
- Le réseau est utilisé pour télécharger Pyodide/NumPy, pas pour envoyer les données de simulation.
