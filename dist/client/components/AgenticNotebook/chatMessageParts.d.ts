import { default as React } from 'react';
import { ChatMessage as ChatMessageType, ToolCallRecord } from '../../stores/notebookStore.js';
/** Compute the bubble background/text classes for a message. */
export declare function getBubbleClass(isUser: boolean, hasError: boolean, hasContent: boolean): string;
export declare function ToolCallIndicator({ toolCall, loadingComponent, }: {
    toolCall: ToolCallRecord;
    loadingComponent?: React.ReactNode;
}): React.JSX.Element;
/** Error row shown below message text. */
export declare function MessageError({ error, hasContent }: {
    error: string;
    hasContent: boolean;
}): React.JSX.Element;
interface MessageFlags {
    isUser: boolean;
    hasContent: boolean;
    hasError: boolean;
    hasToolCalls: boolean;
    toolCalls: ToolCallRecord[];
    /** False for empty assistant messages that should not render. */
    shouldRender: boolean;
}
/** Derive render flags for a chat message. */
export declare function getMessageFlags(message: ChatMessageType): MessageFlags;
/** Inner content of a chat bubble: text, error row, and tool calls. */
export declare function ChatBubbleBody({ message, flags, loadingComponent, }: {
    message: ChatMessageType;
    flags: MessageFlags;
    loadingComponent?: React.ReactNode;
}): React.JSX.Element;
/** List of tool-call indicators for a message. */
export declare function ToolCallList({ toolCalls, loadingComponent, separated, }: {
    toolCalls: ToolCallRecord[];
    loadingComponent?: React.ReactNode;
    separated: boolean;
}): React.JSX.Element;
export {};
