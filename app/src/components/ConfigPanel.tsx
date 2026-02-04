import { useState } from 'react'

interface ConfigPanelProps {
  hoursPerCredit: number
  minCreditsForGraduation: number
  onHoursPerCreditChange: (value: number) => void
  onMinCreditsChange: (value: number) => void
}

export function ConfigPanel({
  hoursPerCredit,
  minCreditsForGraduation,
  onHoursPerCreditChange,
  onMinCreditsChange,
}: ConfigPanelProps) {
  const [open, setOpen] = useState(false)

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value)
    if (!Number.isNaN(n) && n > 0) onHoursPerCreditChange(n)
  }

  const handleMinCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value)
    if (!Number.isNaN(n) && n >= 0) onMinCreditsChange(n)
  }

  return (
    <div className="config-panel">
      <button
        type="button"
        className="config-panel-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? 'Hide' : 'Show'} settings
      </button>
      {open && (
        <div className="config-panel-fields">
          <label>
            Hours per credit
            <input
              type="number"
              min={1}
              value={hoursPerCredit}
              onChange={handleHoursChange}
              aria-label="Hours per credit"
            />
          </label>
          <label>
            Minimum credits for graduation
            <input
              type="number"
              min={0}
              value={minCreditsForGraduation}
              onChange={handleMinCreditsChange}
              aria-label="Minimum credits for graduation"
            />
          </label>
        </div>
      )}
    </div>
  )
}
