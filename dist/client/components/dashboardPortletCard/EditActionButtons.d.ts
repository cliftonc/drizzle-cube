import { default as React, CSSProperties, ComponentType } from 'react';
import { PortletConfig } from '../../types.js';
export declare const ICON_STYLE: CSSProperties;
export interface CardIcons {
    RefreshIcon: ComponentType<{
        className?: string;
        style?: CSSProperties;
    }>;
    EditIcon: ComponentType<{
        className?: string;
        style?: CSSProperties;
    }>;
    DeleteIcon: ComponentType<{
        className?: string;
        style?: CSSProperties;
    }>;
    CopyIcon: ComponentType<{
        className?: string;
        style?: CSSProperties;
    }>;
    FilterIcon: ComponentType<{
        className?: string;
        style?: CSSProperties;
    }>;
}
export interface EditActionButtonsProps {
    portlet: PortletConfig;
    icons: CardIcons;
    onOpenFilterConfig: () => void;
    onDuplicate: () => void;
    onEdit: () => void;
    onDelete: () => void;
}
export default function EditActionButtons({ portlet, icons, onOpenFilterConfig, onDuplicate, onEdit, onDelete }: EditActionButtonsProps): React.JSX.Element;
