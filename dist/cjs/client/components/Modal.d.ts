import { default as React } from 'react';
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full' | 'fullscreen' | 'fullscreen-mobile';
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    className?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    noPadding?: boolean;
}
declare const Modal: React.FC<ModalProps>;
export default Modal;
