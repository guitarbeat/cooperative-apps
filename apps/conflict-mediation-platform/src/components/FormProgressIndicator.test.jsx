import { render, screen, cleanup } from '@testing-library/react';
import FormProgressIndicator from './FormProgressIndicator';
import { describe, it, expect, afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

describe('FormProgressIndicator', () => {
  it('renders progress bars with correct accessibility attributes', () => {
    render(
      <FormProgressIndicator
        currentStep={2}
        totalSteps={4}
        completedFields={5}
        totalFields={10}
        showFieldProgress={true}
      />
    );

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(2);

    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '50'); // 2/4 = 50%
    expect(progressBars[0]).toHaveAttribute('aria-label', 'Step Progress');

    expect(progressBars[1]).toHaveAttribute('aria-valuenow', '50'); // 5/10 = 50%
    expect(progressBars[1]).toHaveAttribute('aria-label', 'Field Progress');
  });

  it('renders step list as an ordered list', () => {
    render(
      <FormProgressIndicator
        currentStep={2}
        totalSteps={3}
      />
    );

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list.tagName).toBe('OL');

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);

    // Current step should have aria-current="step"
    expect(items[1]).toHaveAttribute('aria-current', 'step');

    // Check aria-label structure (contains status)
    expect(items[0]).toHaveAttribute('aria-label', expect.stringContaining('completed'));
    expect(items[1]).toHaveAttribute('aria-label', expect.stringContaining('current'));
    expect(items[2]).toHaveAttribute('aria-label', expect.stringContaining('upcoming'));
  });
});
