import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Explicit import since setupTests.js is missing
import Contact from './ContactPage';

// Mock console.log to avoid cluttering output
const originalLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});
afterAll(() => {
  console.log = originalLog;
});

test('renders contact form with accessible labels and submits', async () => {
  render(<Contact />);

  // Expect accessible labels (this will fail initially)
  const nameInput = screen.getByLabelText(/your name/i);
  const emailInput = screen.getByLabelText(/your email/i);
  const messageInput = screen.getByLabelText(/your message/i);
  const submitButton = screen.getByRole('button', { name: /send message/i });

  expect(nameInput).toBeInTheDocument();
  expect(emailInput).toBeInTheDocument();
  expect(messageInput).toBeInTheDocument();
  expect(submitButton).toBeInTheDocument();

  // Test interaction
  fireEvent.change(nameInput, { target: { value: 'Test User' } });
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(messageInput, { target: { value: 'Hello world' } });

  fireEvent.click(submitButton);

  // Expect loading state (this will also fail initially)
  expect(submitButton).toBeDisabled();
  expect(screen.getByText(/sending/i)).toBeInTheDocument();

  // Wait for success message (this will also fail initially)
  await waitFor(() => {
    expect(screen.getByText(/message sent/i)).toBeInTheDocument();
  }, { timeout: 2000 });
});
