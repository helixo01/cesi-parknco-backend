/**
 * Configuration centralisée des URLs d'API pour le service administrateur
 */

// URLs des services (basées sur les variables d'environnement)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const METIER_SERVICE_URL = process.env.METIER_SERVICE_URL || 'http://localhost:5002';
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:5004';
const IOT_SERVICE_URL = process.env.IOT_SERVICE_URL || 'http://localhost:5003';

// Configuration des endpoints API
const API_ENDPOINTS = {
  // Endpoints du service d'authentification
  AUTH: {
    // Endpoints d'authentification
    LOGIN: `${AUTH_SERVICE_URL}/api/auth/login`,
    REGISTER: `${AUTH_SERVICE_URL}/api/auth/register`,
    LOGOUT: `${AUTH_SERVICE_URL}/api/auth/logout`,
    ME: `${AUTH_SERVICE_URL}/api/auth/me`,
    VERIFY: `${AUTH_SERVICE_URL}/api/auth/verify`,
    CHANGE_PASSWORD: `${AUTH_SERVICE_URL}/api/auth/change-password`,
    PROFILE_PICTURE: `${AUTH_SERVICE_URL}/api/auth/profile-picture`,
    STATS: `${AUTH_SERVICE_URL}/api/auth/stats`,
    
    // Endpoints utilisateurs
    USERS: {
      BASE: `${AUTH_SERVICE_URL}/api/users`,
      BY_ID: (userId) => `${AUTH_SERVICE_URL}/api/users/${userId}`,
      PUBLIC: (userId) => `${AUTH_SERVICE_URL}/api/users/public/${userId}`,
    }
  },
  
  // Endpoints pour le service métier
  METIER: {
    // Endpoints des parkings
    PARKINGS: {
      BASE: `${METIER_SERVICE_URL}/api/parkings`,
      BY_ID: (parkingId) => `${METIER_SERVICE_URL}/api/parkings/${parkingId}`,
      STATS: `${METIER_SERVICE_URL}/api/parkings/stats`,
      OCCUPANCY: `${METIER_SERVICE_URL}/api/parkings/occupancy`,
      REVENUE: `${METIER_SERVICE_URL}/api/parkings/revenue`,
      UPDATE_SPACE: (parkingId) => `${METIER_SERVICE_URL}/api/parkings/${parkingId}/space`,
    },
    
    // Endpoints des réservations
    RESERVATIONS: {
      BASE: `${METIER_SERVICE_URL}/api/reservations`,
      BY_ID: (reservationId) => `${METIER_SERVICE_URL}/api/reservations/${reservationId}`,
      STATS: `${METIER_SERVICE_URL}/api/reservations/stats`,
    },
    
    // Endpoints des trajets
    TRIPS: {
      BASE: `${METIER_SERVICE_URL}/api/trips`,
      MY_TRIPS: `${METIER_SERVICE_URL}/api/trips/my-trips`,
      SEARCH: `${METIER_SERVICE_URL}/api/trips/search`,
      BY_ID: (tripId) => `${METIER_SERVICE_URL}/api/trips/${tripId}`,
      REQUESTS: (tripId) => `${METIER_SERVICE_URL}/api/trips/${tripId}/requests`,
      REQUEST_BY_ID: (tripId, requestId) => `${METIER_SERVICE_URL}/api/trips/${tripId}/requests/${requestId}`,
      CONFIRM_DRIVER: (tripId) => `${METIER_SERVICE_URL}/api/trips/${tripId}/confirm-driver`,
      CONFIRM_PASSENGER: (tripId) => `${METIER_SERVICE_URL}/api/trips/${tripId}/confirm-passenger`,
      RATE_DRIVER: (tripId) => `${METIER_SERVICE_URL}/api/trips/${tripId}/rate-driver`,
      RATE_PASSENGER: (tripId) => `${METIER_SERVICE_URL}/api/trips/${tripId}/rate-passenger`,
      ADMIN_COMPLETED: `${METIER_SERVICE_URL}/api/trips/admin/completed`,
    },
    
    // Endpoints des véhicules
    VEHICLES: {
      BASE: `${METIER_SERVICE_URL}/api/vehicles`,
      BY_ID: (vehicleId) => `${METIER_SERVICE_URL}/api/vehicles/${vehicleId}`,
    },
    
    // Endpoints des statistiques
    STATS: {
      BASE: `${METIER_SERVICE_URL}/api/stats`,
      USER: (userId) => `${METIER_SERVICE_URL}/api/stats/users/${userId}`,
    },
    
    HEALTH: `${METIER_SERVICE_URL}/health`,
  },
  
  // Endpoints du service administrateur (locaux)
  ADMIN: {
    // Endpoints de gamification
    GAMIFICATION: {
      BASE: `${ADMIN_SERVICE_URL}/api/gamification`,
    },
    
    // Endpoints de gestion système
    SYSTEM: {
      SERVICES: `${ADMIN_SERVICE_URL}/api/system/services`,
      HEALTH: `${ADMIN_SERVICE_URL}/api/system/health`,
      METRICS: `${ADMIN_SERVICE_URL}/api/system/metrics`,
    },
    
    // Endpoints de statistiques
    STATS: {
      DASHBOARD: `${ADMIN_SERVICE_URL}/api/stats/dashboard`,
      USERS: `${ADMIN_SERVICE_URL}/api/stats/users`,
    },
    
    HEALTH: `${ADMIN_SERVICE_URL}/health`,
  },
  
  // Endpoints du service IoT
  IOT: {
    SENSORS: {
      BASE: `${IOT_SERVICE_URL}/api/sensors`,
      BY_ID: (sensorId) => `${IOT_SERVICE_URL}/api/sensors/${sensorId}`,
      STATS: `${IOT_SERVICE_URL}/api/sensors/stats`,
    },
    HEALTH: `${IOT_SERVICE_URL}/health`,
  },
};

module.exports = {
  AUTH_SERVICE_URL,
  METIER_SERVICE_URL,
  ADMIN_SERVICE_URL,
  IOT_SERVICE_URL,
  API_ENDPOINTS
}; 