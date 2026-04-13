# Documentation Technique - ELAT (LAT Assessment Tool)

Ce document décrit l'architecture, la sécurité et le fonctionnement technique de l'application ELAT.

## 1. Stack Technique

*   **Frontend** : Angular 19 (Signals, Standalone Components, PWA).
*   **Backend** : Node.js / Express.
*   **Base de Données** : MongoDB Atlas.
*   **Hébergement** : 
    *   Frontend : Vercel.
    *   Backend : Render.
*   **Stockage des Médias** : Cloudinary (Images de preuve).

## 2. Architecture & Flux de Données

L'application suit un modèle **Offline-First** :
1.  Toutes les réponses de l'évaluation sont sauvegardées en temps réel dans le `localStorage`.
2.  Dès qu'une connexion internet est détectée, le service de synchronisation pousse les changements vers MongoDB via une authentification JWT.
3.  **Synchronisation Intelligente** : Les données sont comparées par horodatage. En cas de conflit, une copie de sauvegarde est créée automatiquement dans l'historique de l'évaluation.

## 3. Sécurité & Session

*   **Identifiants** : Mot de passe haché (Bcrypt) et authentification par token (JWT).
*   **Déconnexion Automatique** : Pour protéger les données sur les terminaux partagés, une déconnexion automatique intervient après **60 minutes d'inactivité** (absence de clics, mouvements de souris ou clavier).
*   **Isolation des Données** : Les données sont isolées par pays et par base. Les coordinateurs ont une vue consolidée uniquement sur leur périmètre assigné.

## 4. Gestion des Preuves (Photos & Liens)

*   **Images** : Téléchargées sur Cloudinary. L'application enregistre uniquement l'URL sécurisée dans MongoDB. Cela permet de conserver une base de données légère et performante.
*   **Téléchargement** : Un bouton de téléchargement est disponible sur chaque photo pour permettre l'extraction locale des preuves.

## 5. Exports & Rapports

*   **PDF** : Généré côté client via `jspdf`.
*   **Excel (XLSX)** : Exportation structurée incluant les métadonnées (Pays, Base, Score global) et le détail par question. Format optimisé pour le reporting.

## 6. Maintenance

Pour mettre à jour les questions ou la structure de l'évaluation :
1.  Utiliser l'onglet **Admin -> Config** dans l'application.
2.  Toute modification du schéma de l'évaluation est automatiquement répercutée sur les nouveaux drafts.
