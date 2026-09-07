import { default as React } from 'react';
import { ChatMessage as ChatMessageType } from '../../stores/notebookStore.js';
interface ChatMessageProps {
    message: ChatMessageType;
    /** Custom loading indicator for tool call spinners */
    loadingComponent?: React.ReactNode;
}
declare const ChatMessage: React.MemoExoticComponent<({ message, loadingComponent }: ChatMessageProps) => React.JSX.Element | null>;
export default ChatMessage;
