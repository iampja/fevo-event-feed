import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';
import { Button } from './Button';

type ModalVariant = 'default' | 'danger';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: ModalVariant;
  loading?: boolean;
  children?: React.ReactNode;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.15s ease-out;
`;

const Dialog = styled.div`
  background: ${colors.surface.neutral.primary};
  border-radius: ${radius.cornerRadiusLg};
  box-shadow: ${shadows.lg};
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${slideUp} 0.2s ease-out;
`;

const DialogHeader = styled.div<{ $variant: ModalVariant }>`
  padding: ${spacings['2xl']} ${spacings['2xl']} ${spacings.xl};
  border-bottom: ${({ $variant }) =>
    $variant === 'danger' ? `2px solid ${colors.surface.danger.primary}` : 'none'};
`;

const DialogTitle = styled.h3<{ $variant: ModalVariant }>`
  font-size: ${typography.fontSize.xl};
  font-weight: ${typography.fontWeight.semibold};
  color: ${({ $variant }) =>
    $variant === 'danger' ? colors.text.danger.primary : colors.text.neutral.primary};
  margin: 0;
`;

const DialogBody = styled.div`
  padding: ${spacings.xl} ${spacings['2xl']};
`;

const DialogMessage = styled.p`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.secondary};
  line-height: ${typography.lineHeight.normal};
  margin: 0;
`;

const DialogFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${spacings.lg};
  padding: ${spacings.xl} ${spacings['2xl']} ${spacings['2xl']};
`;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
  children,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      dialogRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <DialogHeader $variant={variant}>
          <DialogTitle $variant={variant} id="modal-title">
            {title}
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          {message && <DialogMessage>{message}</DialogMessage>}
          {children}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </Dialog>
    </Overlay>
  );
};
