import { iconRegistry } from '../iconRegistry';

describe('IconRegistry', () => {
  it('should have icons registered', () => {
    expect(iconRegistry.icons.size).toBeGreaterThan(0);
  });

  it('should have all required categories', () => {
    const expectedCategories = [
      'auth', 'navigation', 'cloud', 'monitoring', 
      'security', 'cost', 'actions', 'status'
    ];
    
    expectedCategories.forEach(category => {
      expect(iconRegistry.categories).toHaveProperty(category);
      expect(Array.isArray(iconRegistry.categories[category as keyof typeof iconRegistry.categories])).toBe(true);
    });
  });

  it('should retrieve existing icons', () => {
    const loginIcon = iconRegistry.get('auth-login');
    expect(loginIcon).toBeTruthy();
    expect(typeof loginIcon).toBe('object'); // React components are objects
  });

  it('should return null for non-existent icons', () => {
    const nonExistentIcon = iconRegistry.get('non-existent-icon');
    expect(nonExistentIcon).toBeNull();
  });

  it('should check icon existence correctly', () => {
    expect(iconRegistry.exists('auth-login')).toBe(true);
    expect(iconRegistry.exists('non-existent-icon')).toBe(false);
  });

  it('should return category icons', () => {
    const authIcons = iconRegistry.getCategory('auth');
    expect(Array.isArray(authIcons)).toBe(true);
    expect(authIcons.length).toBeGreaterThan(0);
    expect(authIcons).toContain('auth-login');
  });

  it('should register new icons', () => {
    const mockIcon = () => null;
    iconRegistry.register('test-icon', mockIcon as any);
    
    expect(iconRegistry.exists('test-icon')).toBe(true);
    expect(iconRegistry.get('test-icon')).toBe(mockIcon);
  });
});