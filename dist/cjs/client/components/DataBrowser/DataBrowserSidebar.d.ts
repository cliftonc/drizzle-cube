/**
 * DataBrowserSidebar
 *
 * Left panel showing a searchable list of cubes.
 * Clicking a cube loads its dimensions into the table view.
 */
interface DataBrowserSidebarProps {
    cubes: Array<{
        name: string;
        title: string;
    }>;
    selectedCube: string | null;
    onSelectCube: (cubeName: string) => void;
}
export default function DataBrowserSidebar({ cubes, selectedCube, onSelectCube, }: DataBrowserSidebarProps): import("react").JSX.Element;
export {};
