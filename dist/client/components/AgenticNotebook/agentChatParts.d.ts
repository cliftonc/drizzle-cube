import { default as React } from 'react';
interface ChatPanelFlags {
    showSaveAsDashboard: boolean;
    showClear: boolean;
    showFeedback: boolean;
    lastScored: boolean;
}
interface ChatPanelFlagInput {
    onDashboardSaved: boolean;
    onScore: boolean;
    isStreaming: boolean;
    portletBlockCount: number;
    messageCount: number;
    lastTraceId: string | null;
    scoredTraceIds: Set<string>;
}
/** Derive header/feedback visibility flags for the chat panel. */
export declare function getChatPanelFlags(i: ChatPanelFlagInput): ChatPanelFlags;
export declare function ChatHeader({ showSaveAsDashboard, showClear, isStreaming, onSaveAsDashboard, onClear, }: {
    showSaveAsDashboard: boolean;
    showClear: boolean;
    isStreaming: boolean;
    onSaveAsDashboard: () => void;
    onClear: () => void;
}): React.JSX.Element;
export declare function FeedbackBar({ scored, onScore, }: {
    scored: boolean;
    onScore: (value: number) => void;
}): React.JSX.Element;
export declare function ThinkingBubble({ loadingComponent }: {
    loadingComponent?: React.ReactNode;
}): React.JSX.Element;
export declare function EmptyState(): React.JSX.Element;
export {};
