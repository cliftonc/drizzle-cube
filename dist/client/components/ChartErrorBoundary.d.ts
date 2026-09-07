import { default as React, Component, ReactNode } from 'react';
interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    portletTitle?: string;
    portletConfig?: any;
    cubeQuery?: string;
}
interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: string | null;
}
export default class ChartErrorBoundary extends Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    handleReset: () => void;
    render(): string | number | boolean | Iterable<React.ReactNode> | React.JSX.Element | null | undefined;
}
export {};
