import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NavButton from './NavButton';

describe('NavButton', () => {
  it('renders with the correct label', () => {
    render(<NavButton label="Test Button" isActive={false} onClick={() => {}} />);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('applies active styles when isActive is true', () => {
    render(<NavButton label="Active Button" isActive={true} onClick={() => {}} />);
    const button = screen.getByText('Active Button');
    expect(button).toHaveClass('bg-primary text-white');
  });

  it('applies inactive styles when isActive is false', () => {
    render(<NavButton label="Inactive Button" isActive={false} onClick={() => {}} />);
    const button = screen.getByText('Inactive Button');
    expect(button).toHaveClass('text-neutral-100 hover:bg-primary-dark');
    expect(button).not.toHaveClass('bg-primary text-white');
  });

  it('calls the onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<NavButton label="Clickable" isActive={false} onClick={handleClick} />);

    const button = screen.getByText('Clickable');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
