import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Explicit import since setupTests.js is missing
import Contact from './ContactPage';

// Mock console.log to avoid cluttering output and to spy on it
const originalLog = console.log;
let consoleSpy;

beforeAll(() => {
  consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  consoleSpy.mockRestore();
});

afterEach(() => {
  consoleSpy.mockClear();
});

test('renders contact form with accessible labels and submits valid data', async () => {
  render(<Contact />);

  // Expect accessible labels
  const nameInput = screen.getByLabelText(/your name/i);
  const emailInput = screen.getByLabelText(/your email/i);
  const messageInput = screen.getByLabelText(/your message/i);
  const submitButton = screen.getByRole('button', { name: /send message/i });

  expect(nameInput).toBeInTheDocument();
  expect(emailInput).toBeInTheDocument();
  expect(messageInput).toBeInTheDocument();
  expect(submitButton).toBeInTheDocument();

  // Test interaction with valid data
  fireEvent.change(nameInput, { target: { value: 'Test User' } });
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(messageInput, { target: { value: 'Hello world, this is a valid message.' } }); // > 10 chars

  fireEvent.click(submitButton);

  // Expect loading state
  expect(submitButton).toBeDisabled();
  expect(screen.getByText(/sending/i)).toBeInTheDocument();

  // Wait for success message
  await waitFor(() => {
    expect(screen.getByText(/message sent/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveFocus();
  }, { timeout: 2000 });

  // Verify log contained data
  expect(consoleSpy).toHaveBeenCalledWith('Form submitted:', expect.objectContaining({
    name: 'Test User',
    email: 'test@example.com',
    message: 'Hello world, this is a valid message.'
  }));
});

test('displays validation errors for invalid input', async () => {
  render(<Contact />);

  const nameInput = screen.getByLabelText(/your name/i);
  const emailInput = screen.getByLabelText(/your email/i);
  const messageInput = screen.getByLabelText(/your message/i);
  const submitButton = screen.getByRole('button', { name: /send message/i });

  // Test interaction with invalid data
  fireEvent.change(nameInput, { target: { value: 'A' } }); // Too short
  fireEvent.change(emailInput, { target: { value: 'invalid-email' } }); // Invalid email
  fireEvent.change(messageInput, { target: { value: 'Hi' } }); // Too short

  fireEvent.click(submitButton);

  // Wait for validation errors
  await waitFor(() => {
    expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/message must be at least 10 characters/i)).toBeInTheDocument();
  });

  // Ensure submit was prevented (no loading state, console log not called)
  expect(consoleSpy).not.toHaveBeenCalled();
});

test('sanitizes input before submission', async () => {
  render(<Contact />);

  const nameInput = screen.getByLabelText(/your name/i);
  const emailInput = screen.getByLabelText(/your email/i);
  const messageInput = screen.getByLabelText(/your message/i);
  const submitButton = screen.getByRole('button', { name: /send message/i });

  // Input with potential XSS characters
  fireEvent.change(nameInput, { target: { value: 'Test <script>User</script>' } });
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(messageInput, { target: { value: 'This message has <tags> in it.' } });

  fireEvent.click(submitButton);

  // Wait for success
  await waitFor(() => {
    expect(screen.getByText(/message sent/i)).toBeInTheDocument();
  }, { timeout: 2000 });

  // Verify sanitized data was logged
  expect(consoleSpy).toHaveBeenCalledWith('Form submitted:', expect.objectContaining({
    name: 'Test scriptUser/script', // sanitization removes < and >
    email: 'test@example.com',
    message: 'This message has tags in it.'
  }));
});
