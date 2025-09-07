/**
 * Metrics Endpoint
 * 
 * This endpoint provides application metrics and performance data.
 * Accessible at /api/metrics
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/server';

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Application metrics endpoint
 *     description: Returns application metrics and performance data
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Successfully retrieved metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: integer
 *                   description: Application uptime in seconds
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 system:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                     nodeVersion:
 *                       type: string
 *                     arch:
 *                       type: string
 *                     pid:
 *                       type: integer
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: integer
 *                       description: Memory usage in MB
 *                     heapTotal:
 *                       type: integer
 *                       description: Total heap size in MB
 *                     heapUsed:
 *                       type: integer
 *                       description: Used heap size in MB
 *                     external:
 *                       type: integer
 *                       description: External memory usage in MB
 *                 database:
 *                   type: object
 *                   properties:
 *                     connectionCount:
 *                       type: integer
 *                     queryCount:
 *                       type: integer
 *                     avgQueryTime:
 *                       type: number
 *                 performance:
 *                   type: object
 *                   properties:
 *                     cpuUsage:
 *                       type: object
 *                     loadAverage:
 *                       type: array
 *                       items:
 *                         type: number
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * Application start time for uptime calculation
 */
const startTime = Date.now();

/**
 * GET /api/metrics
 * 
 * Returns application metrics and performance data
 * 
 * @returns {Promise<NextResponse>} Metrics response
 */
export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    // Get database metrics
    let dbMetrics = {
      connectionCount: 0,
      queryCount: 0,
      avgQueryTime: 0,
    };
    
    try {
      // Get basic database statistics
      const dbStartTime = Date.now();
      await db.execute('SELECT 1');
      const dbResponseTime = Date.now() - dbStartTime;
      
      dbMetrics = {
        connectionCount: 1, // Simplified for now
        queryCount: 1,
        avgQueryTime: dbResponseTime,
      };
    } catch (dbError) {
      console.error('Failed to get database metrics:', dbError);
    }
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get system information
    const systemInfo = {
      platform: process.platform,
      nodeVersion: process.version,
      arch: process.arch,
      pid: process.pid,
    };
    
    const metrics = {
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      system: systemInfo,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
      database: dbMetrics,
      performance: {
        cpuUsage: process.cpuUsage(),
        loadAverage: process.platform !== 'win32' ? (await import('os')).loadavg() : [0, 0, 0],
      },
    };
    
    return NextResponse.json(metrics, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('Metrics collection failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
