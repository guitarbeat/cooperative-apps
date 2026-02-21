import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChartStyle } from './chart';

describe('ChartStyle Security', () => {
  it('prevents CSS injection in color config by removing dangerous characters', () => {
    const maliciousConfig = {
      test: {
        color: 'red; } #injected { display: block; } .test { color: blue'
      }
    };

    const { container } = render(<ChartStyle id="test-chart" config={maliciousConfig} />);
    const styleTag = container.querySelector('style');

    const content = styleTag.innerHTML;

    // Check that the malicious injection sequence is NOT present
    expect(content).not.toContain('} #injected {');
    expect(content).not.toContain('display: block;');

    // Check that the content is sanitized (braces and semicolons removed from the value)
    // The value "red; } #injected { display: block; } .test { color: blue"
    // Should become "red  #injected  display: block  .test  color: blue" (approximately)

    // We expect the property definition to still exist, but with sanitized value
    expect(content).toMatch(/--color-test:.*red.*#injected.*display: block.*\.test.*color: blue;/);

    // Ensure we don't have multiple rules being created
    // A successful injection would look like:
    // --color-test: red; } #injected { display: block; } .test { color: blue;

    // Our sanitized version should look like:
    // --color-test: red  #injected  display: block  .test  color: blue;
    // (with only one semicolon at the end, provided by the template)

    const matches = content.match(/}/g);
    // We expect 2 closing braces (one for light theme, one for dark theme), not more.
    expect(matches.length).toBe(2);
  });

  it('renders valid colors correctly', () => {
    const validConfig = {
      valid: {
        color: 'blue'
      }
    };

    const { container } = render(<ChartStyle id="valid-chart" config={validConfig} />);
    const styleTag = container.querySelector('style');
    expect(styleTag.innerHTML).toContain('--color-valid: blue;');
  });
});
