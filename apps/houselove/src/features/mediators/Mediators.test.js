import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Mediators from './MediatorsPage';

describe('Mediators Component', () => {
  it('renders correctly', () => {
    render(<Mediators />);
    expect(screen.getByText('Mediator Directory')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders the map placeholder with empty state message', () => {
    render(<Mediators />);
    expect(screen.getByText('Find a Mediator Near You')).toBeInTheDocument();
    expect(screen.getByText('Map View Coming Soon')).toBeInTheDocument();
    expect(screen.getByText(/We're working on an interactive map/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /notification feature coming soon/i })).toBeDisabled();
  });

  it('renders accessible contact links', () => {
    render(<Mediators />);

    // Check for "Contact" buttons/links
    const contactLinks = screen.getAllByRole('link', { name: /Contact/i });
    expect(contactLinks).toHaveLength(2);

    // Verify href and aria-label
    expect(contactLinks[0]).toHaveAttribute('href', 'mailto:john.doe@example.com');
    expect(contactLinks[0]).toHaveAttribute('aria-label', 'Contact John Doe');

    expect(contactLinks[1]).toHaveAttribute('href', 'mailto:jane.smith@example.com');
    expect(contactLinks[1]).toHaveAttribute('aria-label', 'Contact Jane Smith');
  });

  it('filters mediators based on search input', async () => {
    render(<Mediators />);
    const searchInput = screen.getByPlaceholderText('Search mediators...');

    userEvent.type(searchInput, 'Jane');

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('displays empty state when no mediators match', async () => {
    render(<Mediators />);
    const searchInput = screen.getByPlaceholderText('Search mediators...');

    userEvent.type(searchInput, 'Zelda');

    await waitFor(() => {
      expect(screen.getByText('No mediators found')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });
});
