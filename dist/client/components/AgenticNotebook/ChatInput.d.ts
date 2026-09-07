import { default as React } from 'react';
interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onStop?: () => void;
    onContinue?: () => void;
    isStreaming?: boolean;
    showContinue?: boolean;
    disabled?: boolean;
    placeholder?: string;
}
declare const ChatInput: React.MemoExoticComponent<({ value, onChange, onSend, onStop, onContinue, isStreaming, showContinue, disabled, placeholder, }: ChatInputProps) => React.JSX.Element>;
export default ChatInput;
