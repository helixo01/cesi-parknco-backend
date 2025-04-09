/**
 * Configuration centralisée des URLs d'API pour le service IoT
 */

// URLs des services (basées sur les variables d'environnement)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://laptop-omen-rvr:5001';
const METIER_SERVICE_URL = process.env.METIER_SERVICE_URL || 'http://laptop-omen-rvr:5002';
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://laptop-omen-rvr:5004';
const IOT_SERVICE_URL = process.env.IOT_SERVICE_URL || 'http://laptop-omen-rvr:5003';

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
    
    HEALTH: `${METIER_SERVICE_URL}/health`,
  },
  
  // Endpoints du service administrateur
  ADMIN: {
    // Endpoints de gamification
    GAMIFICATION: {
      BASE: `${ADMIN_SERVICE_URL}/api/gamification`,
    },
    HEALTH: `${ADMIN_SERVICE_URL}/health`,
  },
  
  // Endpoints du service IoT (locaux)
  IOT: {
    SENSORS: {
      BASE: `${IOT_SERVICE_URL}/api/sensors`,
      BY_ID: (sensorId) => `${IOT_SERVICE_URL}/api/sensors/${sensorId}`,
      STATS: `${IOT_SERVICE_URL}/api/sensors/stats`,
      DATA: (sensorId) => `${IOT_SERVICE_URL}/api/sensors/${sensorId}/data`,
      STATUS: (sensorId) => `${IOT_SERVICE_URL}/api/sensors/${sensorId}/status`,
      LOCATION: (sensorId) => `${IOT_SERVICE_URL}/api/sensors/${sensorId}/location`,
    },
    
    // Endpoints d'agrégation et de logs
    AGGREGATION: {
      DAILY: `${IOT_SERVICE_URL}/api/aggregation/daily`,
      WEEKLY: `${IOT_SERVICE_URL}/api/aggregation/weekly`,
      MONTHLY: `${IOT_SERVICE_URL}/api/aggregation/monthly`,
    },
    
    LOGS: {
      BASE: `${IOT_SERVICE_URL}/api/logs`,
      BY_SENSOR: (sensorId) => `${IOT_SERVICE_URL}/api/logs/sensor/${sensorId}`,
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