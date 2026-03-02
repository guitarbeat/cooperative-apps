import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from '../button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'h-10', 'px-4', 'py-2');
  });

  it('should render with custom text', () => {
    render(<Button>Custom Button Text</Button>);
    
    expect(screen.getByRole('button', { name: 'Custom Button Text' })).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
  });

  it('should not handle click events when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('should accept custom className', () => {
    render(<Button className="custom-class">Custom Class</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref Button</Button>);
    
    expect(ref).toHaveBeenCalled();
  });

  it('should pass through other props', () => {
    render(<Button data-testid="test-button" aria-label="Test Button">Test</Button>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('aria-label', 'Test Button');
  });
});

describe('Button Variants', () => {
  it('should render default variant', () => {
    render(<Button variant="default">Default</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'hover:bg-primary-hover');
  });

  it('should render destructive variant', () => {
    render(<Button variant="destructive">Destructive</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive-hover');
  });

  it('should render outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-input', 'bg-background', 'hover:bg-accent', 'hover:text-accent-foreground');
  });

  it('should render secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground', 'hover:bg-secondary-hover');
  });

  it('should render ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
  });

  it('should render link variant', () => {
    render(<Button variant="link">Link</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-primary', 'underline-offset-4', 'hover:underline');
  });
});

describe('Button Sizes', () => {
  it('should render default size', () => {
    render(<Button size="default">Default Size</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'px-4', 'py-2');
  });

  it('should render small size', () => {
    render(<Button size="sm">Small</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-9', 'rounded-md', 'px-3');
  });

  it('should render large size', () => {
    render(<Button size="lg">Large</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-11', 'rounded-md', 'px-8');
  });

  it('should render icon size', () => {
    render(<Button size="icon">Icon</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-10', 'w-10');
  });
});

describe('Button Combinations', () => {
  it('should combine variant and size correctly', () => {
    render(<Button variant="destructive" size="lg">Destructive Large</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground', 'h-11', 'px-8');
  });

  it('should combine all props correctly', () => {
    render(
      <Button 
        variant="outline" 
        size="sm" 
        disabled 
        className="custom-class"
        data-testid="combined-button"
      >
        Combined
      </Button>
    );
    
    const button = screen.getByTestId('combined-button');
    expect(button).toHaveClass('border', 'border-input', 'h-9', 'px-3', 'custom-class');
    expect(button).toBeDisabled();
  });
});

describe('Button with Icons', () => {
  it('should render with icon size and icon content', () => {
    render(
      <Button size="icon" aria-label="Close">
        <span>×</span>
      </Button>
    );
    
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveClass('h-10', 'w-10');
    expect(button).toHaveTextContent('×');
  });

  it('should handle icon with text', () => {
    render(
      <Button>
        <span>🔍</span>
        Search
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🔍 Search');
  });
});

describe('Button Accessibility', () => {
  it('should be focusable by default', () => {
    render(<Button>Focusable Button</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('should not be focusable when disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should support keyboard navigation', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Keyboard Button</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
    
    expect(handleClick).toHaveBeenCalled();
  });

  it('should support space key activation', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Space Button</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    fireEvent.keyDown(button, { key: ' ' });
    
    expect(handleClick).toHaveBeenCalled();
  });
});

describe('buttonVariants utility', () => {
  it('should generate correct classes for default variant', () => {
    const classes = buttonVariants({ variant: 'default', size: 'default' });
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('text-primary-foreground');
    expect(classes).toContain('h-10');
    expect(classes).toContain('px-4');
    expect(classes).toContain('py-2');
  });

  it('should generate correct classes for destructive variant', () => {
    const classes = buttonVariants({ variant: 'destructive', size: 'sm' });
    expect(classes).toContain('bg-destructive');
    expect(classes).toContain('text-destructive-foreground');
    expect(classes).toContain('h-9');
    expect(classes).toContain('px-3');
  });

  it('should include base classes', () => {
    const classes = buttonVariants({});
    expect(classes).toContain('inline-flex');
    expect(classes).toContain('items-center');
    expect(classes).toContain('justify-center');
    expect(classes).toContain('rounded-md');
    expect(classes).toContain('text-sm');
    expect(classes).toContain('font-medium');
  });
});
