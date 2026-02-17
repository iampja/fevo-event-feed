import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from '@/components/ui/Modal';

const defaultProps = {
  isOpen: true,
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('Modal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal {...defaultProps} isOpen={false} />
    );

    expect(container.innerHTML).toBe('');
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('renders title and message when open', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('renders with the dialog role and aria-modal', () => {
    render(<Modal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('renders default button labels', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders custom button labels', () => {
    render(
      <Modal
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Go Back"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn();
    render(<Modal {...defaultProps} onCancel={onCancel} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<Modal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<Modal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables the cancel button when loading', () => {
    render(<Modal {...defaultProps} loading={true} />);

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();
  });

  it('disables the confirm button when loading', () => {
    render(<Modal {...defaultProps} loading={true} />);

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDisabled();
  });

  it('renders children in the dialog body', () => {
    render(
      <Modal {...defaultProps}>
        <p>Custom content inside the modal</p>
      </Modal>
    );

    expect(screen.getByText('Custom content inside the modal')).toBeInTheDocument();
  });
});
