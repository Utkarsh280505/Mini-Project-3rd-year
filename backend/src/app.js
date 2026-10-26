const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const MLEngineService = require('./services/mlEngineService');

const app = express();

// Security Headers & Rate Limiting
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for inline swagger / dev compatibility
}));
app.use(cors());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  const mlHealth = await MLEngineService.checkHealth();
  res.json({
    status: 'ok',
    service: 'neuroearly-backend',
    timestamp: new Date().toISOString(),
    mlEngine: mlHealth
  });
});

// Interactive Swagger OpenAPI Documentation Page
app.get('/api/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>NeuroEarly AI API Documentation</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" />
        <style>
          body { margin: 0; background: #0f172a; color: #fff; }
          .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
        <script>
          window.onload = () => {
            SwaggerUIBundle({
              url: '/api/swagger.json',
              dom_id: '#swagger-ui',
            });
          };
        </script>
      </body>
    </html>
  `);
});

app.get('/api/swagger.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'NeuroEarly AI REST API',
      version: '1.0.0',
      description: 'Multimodal early neurological risk screening backend service API'
    },
    paths: {
      '/health': { get: { summary: 'System health check & ML engine status' } },
      '/api/auth/register': { post: { summary: 'Register new clinician or patient user' } },
      '/api/auth/login': { post: { summary: 'Authenticate user & issue JWT token' } },
      '/api/patients': { get: { summary: 'Retrieve patient roster with assessment sessions' } },
      '/api/sessions': { post: { summary: 'Create new assessment session' } },
      '/api/assessments/mri-capture': { post: { summary: 'Receive an optional research MRI file; metadata only, no analysis' } },
      '/api/assessments/full': { post: { summary: 'Execute multi-modal risk fusion engine inference' } }
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
