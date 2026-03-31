/**
 * Dev-only: /api/* → backend (Create React App picks this file automatically).
 * Port change: set REACT_APP_PROXY_TARGET=http://localhost:5000 in .env.development.local
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.REACT_APP_PROXY_TARGET || 'http://localhost:5000';
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
};
