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
- GET `/api/auth/me` - Informations utilisateur

### Service Métier
- GET `/api/parkings` - Liste des parkings
- POST `/api/parkings` - Créer un parking
- GET `/api/reservations` - Liste des réservations
- POST `/api/reservations` - Créer une réservation
- GET `/api/stats/parkings` - Statistiques des parkings
- GET `/api/stats/reservations` - Statistiques des réservations
- GET `/api/stats/occupancy` - Statistiques d'occupation par période
- GET `/api/stats/revenue` - Statistiques des revenus

### Service IoT
- POST `/api/sensors/register` - Enregistrer un capteur
- POST `/api/sensors/data` - Envoyer des données
- GET `/api/sensors/:sensorId/status` - État d'un capteur
- GET `/api/stats/sensors` - Statistiques des capteurs

### Service Administrateur

**Routes Statistiques** (nécessite rôle `admin_tech`) :
- GET `/api/stats/global` - Statistiques globales de l'application
- GET `/api/stats/occupancy` - Statistiques détaillées d'occupation
- GET `/api/stats/revenue` - Statistiques détaillées des revenus
- GET `/api/stats/sensors` - Statistiques détaillées des capteurs

**Routes Admin Technique** (nécessite rôle `admin_tech`) :
- GET `/api/system/health` - État des services
- GET `/api/system/stats` - Statistiques système
- GET `/api/system/audit` - Logs d'audit
- GET `/api/system/config` - Configuration système

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
