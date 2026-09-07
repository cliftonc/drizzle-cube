import { default as React } from 'react';
export interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title?: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'primary' | 'warning';
    isLoading?: boolean;
}
/**
 * A reusable confirmation modal component.
 *
 * Usage:
 * ```tsx
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Portlet"
 *   message="Are you sure you want to delete this portlet? This action cannot be undone."
 *   confirmText="Delete"
 *   confirmVariant="danger"
 * />
 * ```
 */
declare const ConfirmModal: React.FC<ConfirmModalProps>;
export default ConfirmModal;
