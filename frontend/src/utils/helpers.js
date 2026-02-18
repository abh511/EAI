/**
 * Format ISO date string to readable format
 * @param {string} isoString - ISO 8601 date string
 * @returns {string} Formatted date like "17 Feb 2026, 14:30 IST"
 */
export function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  };
  return date.toLocaleString('en-IN', options).replace(',', ', ') + ' IST';
}

/**
 * Get color hex code for risk status
 * @param {string} status - "good" | "moderate" | "unhealthy" | "critical"
 * @returns {string} Hex color code
 */
export function getRiskColour(status) {
  const colors = {
    good: '#10b981',
    moderate: '#f59e0b',
    unhealthy: '#f97316',
    hazardous: '#dc2626',
    critical: '#991b1b',
  };
  return colors[status?.toLowerCase()] || '#6b7280';
}

/**
 * Get AQI category from numeric value
 * @param {number} aqi - AQI value
 * @returns {string} Category name
 */
export function getAqiCategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLen - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLen) {
  if (!text || text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

/**
 * Format number with thousand separators and decimals
 * @param {number} n - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(n, decimals = 1) {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Debounce function calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
