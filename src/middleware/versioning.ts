import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  deprecationDate?: Date;
  sunsetDate?: Date;
}

export const API_VERSIONS: Record<string, ApiVersion> = {
  'v1': {
    version: '1.0.0',
    deprecated: false,
  },
  // Future versions can be added here
  // 'v2': {
  //   version: '2.0.0',
  //   deprecated: false,
  // },
};

/**
 * Middleware to handle API versioning
 */
export const apiVersioning = (req: Request, res: Response, next: NextFunction): void => {
  // Extract version from URL path (e.g., /api/v1/...)
  const versionMatch = req.path.match(/^\/api\/(v\d+)/);
  const requestedVersion = versionMatch ? versionMatch[1] : 'v1';

  // Check if version exists
  const versionInfo = API_VERSIONS[requestedVersion];
  if (!versionInfo) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_API_VERSION',
        message: `API version '${requestedVersion}' is not supported`,
        supportedVersions: Object.keys(API_VERSIONS),
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    return;
  }

  // Add version info to request
  req.apiVersion = versionInfo;

  // Add version headers to response
  res.setHeader('API-Version', versionInfo.version);
  res.setHeader('API-Supported-Versions', Object.keys(API_VERSIONS).join(', '));

  // Handle deprecated versions
  if (versionInfo.deprecated) {
    res.setHeader('API-Deprecated', 'true');
    if (versionInfo.deprecationDate) {
      res.setHeader('API-Deprecation-Date', versionInfo.deprecationDate.toISOString());
    }
    if (versionInfo.sunsetDate) {
      res.setHeader('API-Sunset-Date', versionInfo.sunsetDate.toISOString());
    }

    logger.warn(`Deprecated API version used: ${requestedVersion}`, {
      requestId: req.headers['x-request-id'],
      path: req.path,
      userAgent: req.headers['user-agent'],
    });
  }

  next();
};

/**
 * Extend Express Request interface to include API version
 */
declare global {
  namespace Express {
    interface Request {
      apiVersion?: ApiVersion;
    }
  }
}