/**
 * OpenAPI JSON Endpoint
 * 
 * This endpoint serves the OpenAPI specification as JSON.
 * Accessible at /api/docs.json
 */

import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger/config';

/**
 * GET /api/docs.json
 * 
 * Returns the OpenAPI specification as JSON
 */
export async function GET() {
  try {
    return NextResponse.json(swaggerSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to generate API specification' },
      { status: 500 }
    );
  }
}
