/**
 * OpenAPI/Swagger Configuration
 * 
 * This file contains the configuration for generating OpenAPI documentation
 * and serving Swagger UI for the Scout Toolkit API.
 */

import swaggerJSDoc from 'swagger-jsdoc';

/**
 * OpenAPI specification options
 */
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Scout Toolkit API',
      version: '1.0.0',
      description: 'API for the Scout Toolkit application - a comprehensive platform for managing scout activities and programs.',
      contact: {
        name: 'Scout Toolkit Team',
        email: 'support@scout-toolkit.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://scout-toolkit.com/api' 
          : 'http://localhost:3000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'string',
              description: 'Error code',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
          required: ['error'],
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            code: {
              type: 'string',
              example: 'VALIDATION_ERROR',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        Activity: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the activity',
            },
            name: {
              type: 'string',
              description: 'Name of the activity',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the activity',
            },
            duration_minutes: {
              type: 'integer',
              description: 'Duration of the activity in minutes',
            },
            group_size: {
              type: 'string',
              enum: ['individual', 'small', 'medium', 'large'],
              description: 'Recommended group size for the activity',
            },
            effort_level: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Physical effort level required',
            },
            location: {
              type: 'string',
              enum: ['indoor', 'outdoor', 'both'],
              description: 'Location type for the activity',
            },
            age_group: {
              type: 'string',
              enum: ['cub', 'scout', 'explorer', 'all'],
              description: 'Target age group for the activity',
            },
            educational_goals: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Educational goals addressed by the activity',
            },
            sdgs: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'UN Sustainable Development Goals addressed',
            },
            materials: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Required materials for the activity',
            },
            instructions: {
              type: 'string',
              description: 'Step-by-step instructions for the activity',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'name', 'description', 'duration_minutes'],
        },
        Program: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the program',
            },
            name: {
              type: 'string',
              description: 'Name of the program',
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Date of the program',
            },
            start_time: {
              type: 'string',
              format: 'time',
              description: 'Start time of the program',
            },
            is_public: {
              type: 'boolean',
              description: 'Whether the program is publicly visible',
            },
            created_by: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who created the program',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'name', 'date', 'start_time', 'is_public'],
        },
        ProgramEntry: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the program entry',
            },
            program_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the parent program',
            },
            activity_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the associated activity (if not custom)',
            },
            custom_title: {
              type: 'string',
              description: 'Custom title for custom entries',
            },
            custom_duration_minutes: {
              type: 'integer',
              description: 'Custom duration for custom entries',
            },
            order_index: {
              type: 'integer',
              description: 'Order of the entry in the program',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'program_id', 'order_index'],
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              description: 'Overall health status',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Health check timestamp',
            },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['healthy', 'unhealthy'],
                    },
                    responseTime: {
                      type: 'number',
                      description: 'Database response time in milliseconds',
                    },
                  },
                },
                auth: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['healthy', 'unhealthy'],
                    },
                  },
                },
              },
            },
            version: {
              type: 'string',
              description: 'Application version',
            },
            uptime: {
              type: 'number',
              description: 'Application uptime in seconds',
            },
          },
          required: ['status', 'timestamp', 'services'],
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found - Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        sessionAuth: [],
      },
    ],
  },
  apis: [
    './src/app/api/**/*.ts', // API route files
    './src/app/api/**/*.js', // Compiled JavaScript files
  ],
};

/**
 * Generate OpenAPI specification
 */
export const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * Swagger UI configuration
 */
export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { margin: 20px 0; }
  `,
  customSiteTitle: 'Scout Toolkit API Documentation',
};
