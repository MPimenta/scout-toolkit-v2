/**
 * Swagger UI Documentation Page
 * 
 * This page serves the interactive Swagger UI for the Scout Toolkit API.
 * Accessible at /api/docs
 */

import { Metadata } from 'next';
import SwaggerUI from 'swagger-ui-react';
import { swaggerSpec, swaggerUiOptions } from '@/lib/swagger/config';

// Import Swagger UI CSS
import 'swagger-ui-react/swagger-ui.css';

export const metadata: Metadata = {
  title: 'API Documentation - Scout Toolkit',
  description: 'Interactive API documentation for the Scout Toolkit application',
  robots: {
    index: false, // Don't index API docs in search engines
    follow: false,
  },
};

/**
 * API Documentation Page Component
 * 
 * Renders the Swagger UI with the OpenAPI specification
 */
export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Scout Toolkit API Documentation
          </h1>
          <p className="text-gray-600">
            Interactive API documentation for the Scout Toolkit application.
            Use the interface below to explore and test API endpoints.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <SwaggerUI 
            spec={swaggerSpec} 
            {...swaggerUiOptions}
          />
        </div>
      </div>
    </div>
  );
}
