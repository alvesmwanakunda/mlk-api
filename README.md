# mlk-api

## Traduction des notes

L'enregistrement des notes utilise DeepL si une clé API est disponible dans
l'environnement :

- `DEEPL_AUTH_KEY` ou `DEEPL_API_KEY` : clé API DeepL
- `DEEPL_API_PLAN=free` : utilise `https://api-free.deepl.com`
- `DEEPL_API_URL` : URL DeepL personnalisée si besoin
- `NOTE_TRANSLATION_LANGUAGES=fr,en,tr,pl` : langues générées pour les notes

Sans clé DeepL, l'API continue d'enregistrer les notes sans bloquer
l'utilisateur, avec le statut `skipped_missing_auth_key`.

La langue d'affichage des notes, des titres de tâches, des titres de
sous-tâches et des titres d'agenda est lue depuis `Users.preferredLanguage`.
Le header `x-user-language` reste seulement un fallback technique.
