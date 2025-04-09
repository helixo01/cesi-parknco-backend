# ParkNCo - Backend

Application de gestion de parking intelligente basée sur une architecture microservices.

## Architecture

Le backend est composé de 4 microservices indépendants :

### 1. Service Authentification (Port 5001)
- Gestion des utilisateurs (inscription/connexion)
- Authentification JWT
- Gestion des rôles :
  - `user` : Utilisateur standard
  - `admin_user` : Administrateur des utilisateurs
  - `admin_tech` : Administrateur technique

### 2. Service Métier (Port 5002)
- Gestion des parkings
- Réservation de places
- Historique des stationnements
- Gestion des tarifs
- Système de points et gamification :
  - Points pour les trajets proposés (10 points)
  - Points par kilomètre parcouru (1 point/km)
  - Points pour rejoindre un trajet (5 points)
  - Points pour donner une note (2 points)
  - Bonus pour les bonnes notes reçues (≥4 étoiles, 5 points)
  - Bonus voiture pleine (3+ passagers, multiplicateur x10)
  - Bonus voiture électrique (15 points)
  - Classement des utilisateurs

### 3. Service IoT (Port 5003)
- État des places en temps réel
- Gestion des capteurs
- Notifications d'occupation
- Monitoring des équipements

### 4. Service Administrateur (Port 5004)
Deux types d'administration distincts :

**Admin Utilisateur** (`admin_user`) :
- Gestion des utilisateurs
- Modification des rôles
- Activation/désactivation des comptes
- Accès aux routes `/api/users/*`

**Admin Technique** (`admin_tech`) :
- Configuration système
- Monitoring des services
- Logs système et statistiques
- Gestion des équipements IoT
- Accès aux routes `/api/system/*`
- Inclut aussi les droits d'admin utilisateur

## Prérequis

- Node.js (v14 ou supérieur)
- MongoDB (v4.4 ou supérieur)
- npm ou yarn

## Installation

1. Cloner le repository :
```bash
git clone https://github.com/helixo01/cesi-parknco-backend.git
cd cesi-parknco-backend
```

2. Installer les dépendances pour chaque service :
```bash
cd authentification-service && npm install
cd ../metier-service && npm install
cd ../iot-service && npm install
cd ../administrateur-service && npm install
```

3. Configurer les variables d'environnement :
- Copier le fichier `.env.example` vers `.env` dans chaque service
- Modifier les variables selon votre environnement

## Configuration

Chaque service possède son propre fichier `.env` avec les configurations suivantes :

### Service Authentification
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/parknco-auth
JWT_SECRET=votre_secret_jwt
```

### Service Métier
```env
PORT=5002
MONGODB_URI=mongodb://localhost:27017/parknco-business
JWT_SECRET=votre_secret_jwt
```

### Service IoT
```env
PORT=5003
MONGODB_URI=mongodb://localhost:27017/parknco-iot
JWT_SECRET=votre_secret_jwt
METIER_SERVICE_URL=http://localhost:5002
```

### Service Administrateur
```env
PORT=5004
MONGODB_URI=mongodb://localhost:27017/parknco-admin
JWT_SECRET=votre_secret_jwt
AUTH_SERVICE_URL=http://localhost:5001
METIER_SERVICE_URL=http://localhost:5002
IOT_SERVICE_URL=http://localhost:5003
```

## Démarrage

1. Démarrer MongoDB :
```bash
mongod
```

2. Démarrer chaque service dans un terminal différent :

```bash
# Service Authentification
cd authentification-service
npm start

# Service Métier
cd metier-service
npm start

# Service IoT
cd iot-service
npm start

# Service Administrateur
cd administrateur-service
npm start
```

## API Endpoints

### Service Authentification
- POST `/api/auth/register` - Inscription utilisateur
- POST `/api/auth/login` - Connexion utilisateur
- POST `/api/auth/logout` - Déconnexion utilisateur
- GET `/api/auth/me` - Informations utilisateur
- GET `/api/auth/verify` - Vérifier le token
- POST `/api/auth/change-password` - Changer le mot de passe
- POST `/api/auth/profile-picture` - Mettre à jour la photo de profil
- GET `/api/users/public/:userId` - Informations publiques d'un utilisateur

### Service Métier
#### Parkings
- GET `/api/parkings` - Liste des parkings
- POST `/api/parkings` - Créer un parking
- GET `/api/parkings/:parkingId` - Détails d'un parking
- PUT `/api/parkings/:parkingId` - Modifier un parking
- PUT `/api/parkings/:parkingId/space` - Mettre à jour l'espace disponible

#### Réservations
- GET `/api/reservations` - Liste des réservations
- POST `/api/reservations` - Créer une réservation
- GET `/api/reservations/:reservationId` - Détails d'une réservation

#### Trajets
- GET `/api/trips` - Liste des trajets
- POST `/api/trips` - Créer un trajet
- GET `/api/trips/my-trips` - Mes trajets
- GET `/api/trips/search` - Rechercher des trajets
- GET `/api/trips/:tripId` - Détails d'un trajet
- POST `/api/trips/:tripId/requests` - Demander à rejoindre un trajet
- GET `/api/trips/:tripId/requests` - Liste des demandes pour un trajet
- PUT `/api/trips/:tripId/requests/:requestId` - Répondre à une demande
- POST `/api/trips/:tripId/confirm-driver` - Confirmer en tant que conducteur
- POST `/api/trips/:tripId/confirm-passenger` - Confirmer en tant que passager
- POST `/api/trips/:tripId/rate-driver` - Noter le conducteur
- POST `/api/trips/:tripId/rate-passenger` - Noter un passager

#### Véhicules
- GET `/api/vehicles` - Liste des véhicules
- POST `/api/vehicles` - Ajouter un véhicule
- GET `/api/vehicles/:vehicleId` - Détails d'un véhicule
- PUT `/api/vehicles/:vehicleId` - Modifier un véhicule

#### Statistiques
- GET `/api/stats/parkings` - Statistiques des parkings
- GET `/api/stats/reservations` - Statistiques des réservations
- GET `/api/stats/occupancy` - Statistiques d'occupation
- GET `/api/stats/revenue` - Statistiques des revenus
- GET `/api/stats/users/:userId` - Statistiques d'un utilisateur

### Service IoT
#### Capteurs
- POST `/api/sensors/register` - Enregistrer un capteur
- POST `/api/sensors/data` - Envoyer des données
- GET `/api/sensors/:sensorId/status` - État d'un capteur
- GET `/api/sensors/:sensorId/data` - Données d'un capteur
- PUT `/api/sensors/:sensorId/location` - Mettre à jour la localisation
- GET `/api/stats/sensors` - Statistiques des capteurs

#### Agrégation
- GET `/api/aggregation/daily` - Agrégation journalière
- GET `/api/aggregation/weekly` - Agrégation hebdomadaire
- GET `/api/aggregation/monthly` - Agrégation mensuelle

#### Logs
- GET `/api/logs` - Tous les logs
- GET `/api/logs/sensor/:sensorId` - Logs d'un capteur

### Service Administrateur

#### Gestion Utilisateurs (nécessite rôle `admin_user`)
- GET `/api/users` - Liste des utilisateurs
- GET `/api/users/:userId` - Détails d'un utilisateur
- PUT `/api/users/:userId` - Modifier un utilisateur
- PUT `/api/users/:userId/role` - Modifier le rôle d'un utilisateur
- PUT `/api/users/:userId/status` - Activer/désactiver un utilisateur

#### Statistiques (nécessite rôle `admin_user`)
- GET `/api/stats/global` - Statistiques globales
- GET `/api/stats/occupancy` - Statistiques d'occupation
- GET `/api/stats/revenue` - Statistiques des revenus
- GET `/api/stats/users/:userId` - Statistiques utilisateur
- GET `/api/stats/users` - Classement global
- GET `/api/stats/dashboard` - Tableau de bord

#### Gamification (nécessite rôle `admin_user`)
- GET `/api/gamification` - Configuration de gamification
- PUT `/api/gamification` - Mettre à jour la configuration

#### IoT et Système (nécessite rôle `admin_tech`)
- GET `/api/system/health` - État des services
- GET `/api/system/services` - Liste des services
- GET `/api/system/metrics` - Métriques système
- GET `/api/system/audit` - Logs d'audit
- GET `/api/system/config` - Configuration système
- GET `/api/stats/sensors` - Statistiques des capteurs
- GET `/api/sensors/maintenance` - État de maintenance des capteurs
- GET `/api/sensors/alerts` - Alertes des capteurs
- GET `/api/sensors/config` - Configuration des capteurs

## Sécurité

- Tous les endpoints (sauf login/register) nécessitent un token JWT
- Séparation des rôles administratifs :
  - `admin_user` : Gestion des utilisateurs
  - `admin_tech` : Configuration système et monitoring
- Les mots de passe sont hashés avec bcrypt
- CORS configuré pour le frontend
- Validation des données entrantes

## Base de données

Chaque service utilise sa propre base de données MongoDB :
- `parknco-auth` : Données d'authentification
- `parknco-business` : Données métier
- `parknco-iot` : Données IoT
- `parknco-admin` : Données d'administration

## Monitoring et Statistiques

Le service administrateur fournit des statistiques globales via plusieurs endpoints :

### Statistiques Globales (`/api/stats/global`)
- Nombre total de parkings et taux d'occupation
- Revenus totaux et moyens
- État des capteurs IoT
- Tendances d'occupation
- Statistiques des réservations
- Statistiques de gamification :
  - Nombre total de points distribués
  - Moyenne des points par utilisateur
  - Top utilisateurs du mois
  - Distribution des bonus

### Statistiques Utilisateurs (`/api/stats/users/:userId`)
- Total des points
- Classement global
- Note moyenne reçue
- Historique des points gagnés
- Position dans le classement
- Détail des bonus obtenus

### Statistiques d'Occupation (`/api/stats/occupancy`)
- Taux d'occupation par période
- Heures de pointe
- Heures creuses
- Tendances par intervalle

### Statistiques de Revenus (`/api/stats/revenue`)
- Revenus par période
- Meilleures performances par parking
- Moyennes et totaux

### Statistiques des Capteurs (`/api/stats/sensors`)
- État des capteurs
- Niveaux de batterie
- Besoins en maintenance
- Qualité des données
- Temps de fonctionnement

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## Licence

MIT
