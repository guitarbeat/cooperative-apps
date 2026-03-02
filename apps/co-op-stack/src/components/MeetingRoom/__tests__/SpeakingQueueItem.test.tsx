import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpeakingQueueItem } from '../SpeakingQueueItem';
import type { QueueItem } from '@/types/meeting';

describe('SpeakingQueueItem', () => {
  const mockEntry: QueueItem = {
    id: '1',
    participantId: 'p1',
    participantName: 'Test User',
    type: 'speak',
    position: 1,
    timestamp: Date.now(),
    isSpeaking: false,
    isFacilitator: false
  };

  const defaultProps = {
    entry: mockEntry,
    index: 1, // Not current speaker
    participantName: 'Other User',
    isFacilitator: true,
    onLeaveQueue: vi.fn(),
    onReorderQueue: vi.fn(),
    isDragging: false,
    isDragOver: false,
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
    onDragEnd: vi.fn()
  };

  it('renders participant name correctly', () => {
    render(<SpeakingQueueItem {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows position indicator for non-current speaker', () => {
    render(<SpeakingQueueItem {...defaultProps} index={1} />);
    expect(screen.getByText('2')).toBeInTheDocument(); // index + 1
  });

  it('does not show position indicator for current speaker', () => {
    render(<SpeakingQueueItem {...defaultProps} index={0} />);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('shows leave button only for self', () => {
    const props = { ...defaultProps, participantName: 'Test User' };
    render(<SpeakingQueueItem {...props} />);
    expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument();
  });

  it('calls onLeaveQueue when leave button is clicked', () => {
    const onLeaveQueue = vi.fn();
    const props = { ...defaultProps, participantName: 'Test User', onLeaveQueue };
    render(<SpeakingQueueItem {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /leave/i }));
    expect(onLeaveQueue).toHaveBeenCalled();
  });

  it('applies dragging styles when isDragging is true', () => {
    const { container } = render(<SpeakingQueueItem {...defaultProps} isDragging={true} />);
    // Check for opacity-50 class which is applied when dragging
    expect(container.firstChild).toHaveClass('dragging');
  });

  it('calls drag handlers correctly', () => {
    const onDragStart = vi.fn();
    render(<SpeakingQueueItem {...defaultProps} onDragStart={onDragStart} />);
    const item = screen.getByText('Test User').closest('div[draggable="true"]');
    expect(item).toBeInTheDocument();
    if (item) {
        fireEvent.dragStart(item);
        expect(onDragStart).toHaveBeenCalledWith(1);
    }
  });
});
