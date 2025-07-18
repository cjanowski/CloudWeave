/**
 * Cloud Provider Abstraction Layer
 * 
 * This module provides a unified interface for managing resources across
 * multiple cloud providers (AWS, Azure, GCP).
 */

// Types and interfaces
export * from './types';
export * from './interfaces';

// Base connector
export { BaseCloudConnector } from './BaseCloudConnector';

// Cloud provider implementations
export { AWSConnector } from './AWSConnector';
export { AzureConnector } from './AzureConnector';
export { GCPConnector } from './GCPConnector';

// Factory for creating connectors
export { CloudProviderFactory, cloudProviderFactory } from './CloudProviderFactory';

// Convenience function to create and initialize a connector
import { cloudProviderFactory } from './CloudProviderFactory';
import { CloudProviderConfig, ICloudConnector } from './interfaces';

/**
 * Create and initialize a cloud connector
 * @param config Cloud provider configuration
 * @returns Initialized cloud connector
 */
export async function createCloudConnector(config: CloudProviderConfig): Promise<ICloudConnector> {
  return await cloudProviderFactory.createAndInitializeConnector(config);
}

/**
 * Get a cached cloud connector if available
 * @param provider Cloud provider type
 * @param region Cloud region
 * @returns Cached connector or null
 */
export function getCachedConnector(provider: string, region: string): ICloudConnector | null {
  return cloudProviderFactory.getCachedConnector(provider as any, region);
}

/**
 * Validate cloud provider configuration
 * @param config Cloud provider configuration
 * @returns True if configuration is valid
 */
export function validateCloudConfig(config: CloudProviderConfig): boolean {
  return cloudProviderFactory.validateProviderConfig(config);
}

/**
 * Get list of supported cloud providers
 * @returns Array of supported provider names
 */
export function getSupportedProviders(): string[] {
  return cloudProviderFactory.getSupportedProviders();
}