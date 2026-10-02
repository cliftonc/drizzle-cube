/**
 * Hidden `<input type="file">` for the dashboard Import buttons. Toolbars keep a ref
 * to it and call `.click()`; the picked file is handed to `onFile`. The input value
 * is cleared after each pick so choosing the same file twice fires again.
 */

import { forwardRef, type ChangeEvent } from 'react'

interface DashboardImportFileInputProps {
  onFile: (file: File) => void
}

const DashboardImportFileInput = forwardRef<HTMLInputElement, DashboardImportFileInputProps>(
  function DashboardImportFileInput({ onFile }, ref) {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (file) onFile(file)
    }

    return (
      <input
        ref={ref}
        type="file"
        accept="application/json,.json"
        className="dc:hidden"
        data-testid="dashboard-import-file-input"
        onChange={handleChange}
      />
    )
  }
)

export default DashboardImportFileInput
