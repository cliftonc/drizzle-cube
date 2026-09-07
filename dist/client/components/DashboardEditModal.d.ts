import { default as React } from 'react';
interface DashboardEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        name: string;
        description?: string;
    }) => Promise<void> | void;
    title: string;
    submitText: string;
    initialName?: string;
    initialDescription?: string;
}
export default function DashboardEditModal({ isOpen, onClose, onSave, title, submitText, initialName, initialDescription }: DashboardEditModalProps): React.JSX.Element;
export {};
