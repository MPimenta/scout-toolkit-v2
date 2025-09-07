/**
 * Health Check Endpoint
 * 
 * This endpoint provides health status information for the application.
 * Accessible at /api/health
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { auth } from '@/lib/auth/config';

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the application and its dependencies
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Application is unhealthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */

/**
 * Health check start time for uptime calculation
 */
const startTime = Date.now();

/**
 * GET /api/health
 * 
 * Returns the health status of the application and its dependencies
 * 
 * @returns {Promise<NextResponse>} Health status response
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  try {
    // Check database health
    const dbStartTime = Date.now();
    let dbStatus = 'unhealthy';
    let dbResponseTime = 0;
    
    try {
      // Simple database query to check connectivity
      await db.execute('SELECT 1');
      dbResponseTime = Date.now() - dbStartTime;
      dbStatus = 'healthy';
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      dbStatus = 'unhealthy';
    }
    
    // Check auth system health
    let authStatus = 'unhealthy';
    try {
      // Check if auth configuration is valid
      if (auth && typeof auth === 'function') {
        authStatus = 'healthy';
      }
    } catch (authError) {
      console.error('Auth health check failed:', authError);
      authStatus = 'unhealthy';
    }
    
    // Determine overall status
    const overallStatus = dbStatus === 'healthy' && authStatus === 'healthy' 
      ? 'healthy' 
      : 'degraded';
    
    const healthData = {
      status: overallStatus,
      timestamp,
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
        },
        auth: {
          status: authStatus,
        },
      },
      version: process.env.npm_package_version || '1.0.0',
      uptime,
      environment: process.env.NODE_ENV || 'development',
    };
    
    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthData, {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        error: 'Health check failed',
        services: {
          database: { status: 'unhealthy', responseTime: 0 },
          auth: { status: 'unhealthy' },
        },
        version: process.env.npm_package_version || '1.0.0',
        uptime,
      },
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
