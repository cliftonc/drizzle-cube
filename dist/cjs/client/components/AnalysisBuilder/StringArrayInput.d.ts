/**
 * StringArrayInput Component
 *
 * A textarea that edits an array of strings. Uses local state while editing and
 * only commits to the parent on blur. Extracted from DisplayOptionControl so the
 * structured-option renderers stay presentational. Behaviour is identical to the
 * previous inline implementation.
 */
interface StringArrayInputProps {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    description?: string;
}
export default function StringArrayInput({ label, value, onChange, placeholder, description, }: StringArrayInputProps): import("react").JSX.Element;
export {};
