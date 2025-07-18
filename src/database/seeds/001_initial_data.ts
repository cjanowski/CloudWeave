import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('user_roles').del();
  await knex('role_permissions').del();
  await knex('configurations').del();
  await knex('deployment_logs').del();
  await knex('deployments').del();
  await knex('applications').del();
  await knex('resources').del();
  await knex('environments').del();
  await knex('projects').del();
  await knex('users').del();
  await knex('roles').del();
  await knex('permissions').del();
  await knex('organizations').del();

  // Insert organizations
  const [defaultOrg] = await knex('organizations').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'CloudWeave Demo Organization',
      settings: {
        defaultCloudProvider: 'aws',
        costCenter: 'engineering',
        complianceFrameworks: ['SOC2', 'ISO27001'],
        notificationChannels: [
          {
            type: 'email',
            config: { recipients: ['admin@cloudweave.com'] }
          }
        ]
      }
    }
  ]).returning('*');

  // Insert permissions
  const permissions = await knex('permissions').insert([
    // Infrastructure permissions
    { name: 'infrastructure:read', resource: 'infrastructure', action: 'read', description: 'View infrastructure resources' },
    { name: 'infrastructure:write', resource: 'infrastructure', action: 'write', description: 'Modify infrastructure resources' },
    { name: 'infrastructure:delete', resource: 'infrastructure', action: 'delete', description: 'Delete infrastructure resources' },
    
    // Deployment permissions
    { name: 'deployment:read', resource: 'deployment', action: 'read', description: 'View deployments' },
    { name: 'deployment:write', resource: 'deployment', action: 'write', description: 'Create and modify deployments' },
    { name: 'deployment:execute', resource: 'deployment', action: 'execute', description: 'Execute deployments' },
    
    // Project permissions
    { name: 'project:read', resource: 'project', action: 'read', description: 'View projects' },
    { name: 'project:write', resource: 'project', action: 'write', description: 'Create and modify projects' },
    { name: 'project:delete', resource: 'project', action: 'delete', description: 'Delete projects' },
    
    // User management permissions
    { name: 'user:read', resource: 'user', action: 'read', description: 'View users' },
    { name: 'user:write', resource: 'user', action: 'write', description: 'Create and modify users' },
    { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users' },
    
    // Configuration permissions
    { name: 'config:read', resource: 'config', action: 'read', description: 'View configurations' },
    { name: 'config:write', resource: 'config', action: 'write', description: 'Modify configurations' },
    { name: 'config:secrets', resource: 'config', action: 'secrets', description: 'Access secret configurations' },
    
    // Monitoring permissions
    { name: 'monitoring:read', resource: 'monitoring', action: 'read', description: 'View monitoring data' },
    { name: 'monitoring:write', resource: 'monitoring', action: 'write', description: 'Configure monitoring' },
    
    // Cost management permissions
    { name: 'cost:read', resource: 'cost', action: 'read', description: 'View cost data' },
    { name: 'cost:write', resource: 'cost', action: 'write', description: 'Configure cost management' },
  ]).returning('*');

  // Insert roles
  const roles = await knex('roles').insert([
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Admin',
      organization_id: defaultOrg.id,
      description: 'Full system administrator with all permissions'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      name: 'Platform Engineer',
      organization_id: defaultOrg.id,
      description: 'Platform engineer with infrastructure and deployment permissions'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      name: 'Developer',
      organization_id: defaultOrg.id,
      description: 'Developer with deployment and project permissions'
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440004',
      name: 'Viewer',
      organization_id: defaultOrg.id,
      description: 'Read-only access to most resources'
    }
  ]).returning('*');

  // Assign permissions to roles
  const adminRole = roles.find(r => r.name === 'Admin');
  const platformEngineerRole = roles.find(r => r.name === 'Platform Engineer');
  const developerRole = roles.find(r => r.name === 'Developer');
  const viewerRole = roles.find(r => r.name === 'Viewer');

  // Admin gets all permissions
  const adminPermissions = permissions.map(p => ({
    role_id: adminRole.id,
    permission_id: p.id
  }));

  // Platform Engineer permissions
  const platformEngineerPermissions = permissions
    .filter(p => ['infrastructure', 'deployment', 'project', 'config', 'monitoring'].includes(p.resource))
    .map(p => ({
      role_id: platformEngineerRole.id,
      permission_id: p.id
    }));

  // Developer permissions
  const developerPermissions = permissions
    .filter(p => 
      (p.resource === 'deployment' && ['read', 'write', 'execute'].includes(p.action)) ||
      (p.resource === 'project' && ['read', 'write'].includes(p.action)) ||
      (p.resource === 'config' && ['read', 'write'].includes(p.action)) ||
      (p.resource === 'monitoring' && p.action === 'read')
    )
    .map(p => ({
      role_id: developerRole.id,
      permission_id: p.id
    }));

  // Viewer permissions (read-only)
  const viewerPermissions = permissions
    .filter(p => p.action === 'read')
    .map(p => ({
      role_id: viewerRole.id,
      permission_id: p.id
    }));

  await knex('role_permissions').insert([
    ...adminPermissions,
    ...platformEngineerPermissions,
    ...developerPermissions,
    ...viewerPermissions
  ]);

  // Insert admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const [adminUser] = await knex('users').insert([
    {
      id: '770e8400-e29b-41d4-a716-446655440001',
      email: 'admin@cloudweave.com',
      password_hash: hashedPassword,
      name: 'CloudWeave Admin',
      organization_id: defaultOrg.id,
      is_active: true
    }
  ]).returning('*');

  // Assign admin role to admin user
  await knex('user_roles').insert([
    {
      user_id: adminUser.id,
      role_id: adminRole.id
    }
  ]);

  // Insert demo project
  const [demoProject] = await knex('projects').insert([
    {
      id: '880e8400-e29b-41d4-a716-446655440001',
      name: 'Demo Project',
      description: 'A demonstration project for CloudWeave',
      organization_id: defaultOrg.id,
      cost_center: 'engineering',
      tags: {
        environment: 'demo',
        team: 'platform'
      }
    }
  ]).returning('*');

  // Insert demo environments
  await knex('environments').insert([
    {
      id: '990e8400-e29b-41d4-a716-446655440001',
      name: 'development',
      project_id: demoProject.id,
      type: 'development',
      cloud_provider: 'aws',
      region: 'us-east-1',
      configuration: {
        vpc_id: 'vpc-demo123',
        subnet_ids: ['subnet-demo1', 'subnet-demo2']
      }
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440002',
      name: 'production',
      project_id: demoProject.id,
      type: 'production',
      cloud_provider: 'aws',
      region: 'us-east-1',
      configuration: {
        vpc_id: 'vpc-prod123',
        subnet_ids: ['subnet-prod1', 'subnet-prod2']
      }
    }
  ]);

  console.log('✅ Database seeded successfully with initial data');
}