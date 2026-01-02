import { describe, it, expect } from 'vitest';
import { pathToLabel, isDynamicSegment } from './breadcrumb-utils';

describe('Breadcrumb Utils', () => {
  describe('pathToLabel', () => {
    it('should convert hyphenated paths to labels', () => {
      expect(pathToLabel('my-gadgets')).toBe('My Gadgets');
      expect(pathToLabel('service-requests')).toBe('Service Requests');
      expect(pathToLabel('user-profile')).toBe('User Profile');
    });

    it('should convert underscored paths to labels', () => {
      expect(pathToLabel('my_gadgets')).toBe('My Gadgets');
      expect(pathToLabel('user_settings')).toBe('User Settings');
    });

    it('should handle camelCase paths', () => {
      expect(pathToLabel('myGadgets')).toBe('My Gadgets');
      expect(pathToLabel('serviceRequests')).toBe('Service Requests');
      expect(pathToLabel('userProfile')).toBe('User Profile');
    });

    it('should handle mixed case and separators', () => {
      expect(pathToLabel('my-gadget_list')).toBe('My Gadget List');
      expect(pathToLabel('user-profileSettings')).toBe('User Profile Settings');
    });

    it('should handle acronyms correctly', () => {
      expect(pathToLabel('api-docs')).toBe('API Docs');
      expect(pathToLabel('faq-page')).toBe('FAQ Page');
      expect(pathToLabel('ui-components')).toBe('UI Components');
      expect(pathToLabel('html-editor')).toBe('HTML Editor');
      expect(pathToLabel('css-styles')).toBe('CSS Styles');
    });

    it('should handle single words', () => {
      expect(pathToLabel('dashboard')).toBe('Dashboard');
      expect(pathToLabel('profile')).toBe('Profile');
      expect(pathToLabel('about')).toBe('About');
    });

    it('should handle uppercase input', () => {
      expect(pathToLabel('MY-GADGETS')).toBe('My Gadgets');
      expect(pathToLabel('DASHBOARD')).toBe('Dashboard');
    });

    it('should handle empty or invalid input', () => {
      expect(pathToLabel('')).toBe('');
      expect(pathToLabel('   ')).toBe('');
    });

    it('should handle numbers in paths', () => {
      expect(pathToLabel('page-2')).toBe('Page 2');
      expect(pathToLabel('section-1-details')).toBe('Section 1 Details');
    });

    it('should handle multiple consecutive separators', () => {
      expect(pathToLabel('my--gadgets')).toBe('My Gadgets');
      expect(pathToLabel('user__profile')).toBe('User Profile');
    });
  });

  describe('isDynamicSegment', () => {
    it('should identify route parameters', () => {
      expect(isDynamicSegment(':id')).toBe(true);
      expect(isDynamicSegment(':userId')).toBe(true);
      expect(isDynamicSegment(':slug')).toBe(true);
    });

    it('should identify UUIDs', () => {
      expect(isDynamicSegment('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isDynamicSegment('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should identify numeric IDs', () => {
      expect(isDynamicSegment('12345')).toBe(true);
      expect(isDynamicSegment('999')).toBe(true);
      expect(isDynamicSegment('1')).toBe(true);
    });

    it('should identify GadgetCloud ID prefixes', () => {
      expect(isDynamicSegment('ITM_00001')).toBe(true);
      expect(isDynamicSegment('ITM_00123')).toBe(true);
      expect(isDynamicSegment('TKT_00001')).toBe(true);
      expect(isDynamicSegment('DOC_00050')).toBe(true);
      expect(isDynamicSegment('POST_00001')).toBe(true);
    });

    it('should identify long alphanumeric strings', () => {
      expect(isDynamicSegment('abc123def456ghi789jkl')).toBe(true);
      expect(isDynamicSegment('aaaaaaaaaaaaaaa')).toBe(true);
    });

    it('should identify base62 encoded user IDs', () => {
      expect(isDynamicSegment('111a')).toBe(true);
      expect(isDynamicSegment('112b')).toBe(true);
      expect(isDynamicSegment('1z9x')).toBe(true);
      expect(isDynamicSegment('abc12')).toBe(true);
    });

    it('should NOT identify regular route segments', () => {
      expect(isDynamicSegment('my-gadgets')).toBe(false);
      expect(isDynamicSegment('dashboard')).toBe(false);
      expect(isDynamicSegment('profile')).toBe(false);
      expect(isDynamicSegment('service-requests')).toBe(false);
      expect(isDynamicSegment('blog')).toBe(false);
    });

    it('should NOT identify segments with hyphens (not IDs)', () => {
      expect(isDynamicSegment('blog-post')).toBe(false);
      expect(isDynamicSegment('user-settings')).toBe(false);
    });

    it('should handle empty or invalid input', () => {
      expect(isDynamicSegment('')).toBe(false);
      expect(isDynamicSegment('   ')).toBe(false);
    });

    it('should handle edge cases', () => {
      // Short numeric (still considered ID)
      expect(isDynamicSegment('1')).toBe(true);
      expect(isDynamicSegment('12')).toBe(true);

      // Short alphabetic (not ID)
      expect(isDynamicSegment('ab')).toBe(false);
      expect(isDynamicSegment('abc')).toBe(false);

      // Mixed with hyphens (not ID)
      expect(isDynamicSegment('abc-123')).toBe(false);

      // All letters, long but with hyphens (not ID)
      expect(isDynamicSegment('very-long-route-name')).toBe(false);
    });

    it('should handle case insensitivity for ID patterns', () => {
      expect(isDynamicSegment('itm_00001')).toBe(true);
      expect(isDynamicSegment('ItM_00123')).toBe(true);
      expect(isDynamicSegment('ABCDEF1234567890')).toBe(true);
    });
  });
});
