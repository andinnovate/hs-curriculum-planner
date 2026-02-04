import { useState } from 'react'
import { ConfigPanel } from './components/ConfigPanel'
import { PlannerLayout } from './components/PlannerLayout'
import { TallyBar } from './components/TallyBar'
import gatherroundPlanJson from './data/gatherround-plan.json'
import { useConfig } from './hooks/useConfig'
import { useCurriculum } from './hooks/useCurriculum'
import { useAssignments } from './hooks/useAssignments'
import type { AssignmentState } from './types'

const gatherroundPlan = gatherroundPlanJson as AssignmentState

function App() {
  const { config, setHoursPerCredit, setMinCreditsForGraduation } = useConfig()
  const { unitsWithHours, loading, error } = useCurriculum()
  const { assignments, setAssignment, removeAssignment, replaceAssignments } = useAssignments()
  const [confirmPrepopulate, setConfirmPrepopulate] = useState(false)

  if (error) {
    return (
      <div style={{ padding: '1rem', color: 'crimson' }}>
        Failed to load curriculum: {error}
      </div>
    )
  }

  const handlePrepopulateClick = () => {
    if (confirmPrepopulate) {
      replaceAssignments(gatherroundPlan)
      setConfirmPrepopulate(false)
    } else {
      setConfirmPrepopulate(true)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Homeschool 4-Year Planner</h1>
        <div className="app-header-actions">
          {confirmPrepopulate ? (
            <>
              <span className="app-prepopulate-confirm">Replace current plan?</span>
              <button type="button" className="app-prepopulate-btn confirm" onClick={handlePrepopulateClick}>
                Yes, prepopulate
              </button>
              <button type="button" className="app-prepopulate-btn" onClick={() => setConfirmPrepopulate(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="app-prepopulate-link" onClick={handlePrepopulateClick}>
              Prepopulate Gather &apos;Round 4 year plan
            </button>
          )}
        </div>
        <ConfigPanel
          hoursPerCredit={config.hoursPerCredit}
          minCreditsForGraduation={config.minCreditsForGraduation}
          onHoursPerCreditChange={setHoursPerCredit}
          onMinCreditsChange={setMinCreditsForGraduation}
        />
      </header>
      <main className="app-main">
        {loading ? (
          <p>Loading curriculum…</p>
        ) : (
          <PlannerLayout
            unitsWithHours={unitsWithHours}
            assignments={assignments}
            onSetAssignment={setAssignment}
            onRemoveAssignment={removeAssignment}
          />
        )}
      </main>
      {!loading && (
        <TallyBar
          unitsWithHours={unitsWithHours}
          assignments={assignments}
          hoursPerCredit={config.hoursPerCredit}
          minCreditsForGraduation={config.minCreditsForGraduation}
        />
      )}
    </div>
  )
}

export default App
