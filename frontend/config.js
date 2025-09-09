// Configuration for different environments
const config = {
  // In production (CloudFront), API calls go through the same domain with /api prefix
  // In development, you can point to localhost or a specific API Gateway URL
  API_BASE_URL: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:8000/api' // Local development
    : '/api', // Production (CloudFront)
  
  // You can also override this by setting a specific API Gateway URL
  // API_BASE_URL: 'https://your-api-gateway-url.amazonaws.com/prod/api',
};

// Make config globally available
window.RUBRIC_CONFIG = config;
