const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = {
  '/api': createProxyMiddleware({
    target: 'https://lumpymedbackend-production.up.railway.app',
    secure: true,
    changeOrigin: true,
    pathRewrite: {
      '^/api': ''
    },
    logLevel: 'silent',
    onProxyReq: (proxyReq, req, res) => {
      // Ensure Content-Type is set for POST requests
      if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.body) {
        const contentType = proxyReq.getHeader('content-type');
        if (!contentType) {
          proxyReq.setHeader('content-type', 'application/json');
        }
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Response handled silently
    },
    onError: (err, req, res) => {
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      });
      res.end('Proxy error: ' + err.message);
    }
  })
};
