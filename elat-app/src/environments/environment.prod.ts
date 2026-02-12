export const environment = {
    production: true,
    // Sur Vercel, on peut surcharger via un "file replacement" ou utiliser une variable globale si configuré
    // Pour l'instant, on pointe vers l'URL du backend déployé que l'utilisateur nous donnera
    // OU mieux : on configure angular.json pour le remplacement de fichier
    apiUrl: 'https://elat-api.onrender.com', // Fixed correct render URL if known, assuming elat-api
    appVersion: '1.2.0-History'
};
