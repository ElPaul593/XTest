const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bus Reservation API',
      version: '1.0.0',
      description: 'API para sistema de reservas de buses',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            cedula: { type: 'string' },
            pasaporte: { type: 'string' },
            nombre: { type: 'string' },
            apellido: { type: 'string' },
            telefono: { type: 'string' },
            paisOrigen: { type: 'string' },
            provincia: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'USER'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Reserva: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            ruta: { type: 'object' },
            seatNumber: { type: 'number' },
            status: { type: 'string', enum: ['reserved', 'cancelled'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Boleto: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            reserva: { $ref: '#/components/schemas/Reserva' },
            seatNumber: { type: 'number' },
            price: { type: 'number' },
            issuedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };

