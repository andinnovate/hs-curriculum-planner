import { ConfigPanel } from './components/ConfigPanel'
import { PlannerLayout } from './components/PlannerLayout'
import { TallyBar } from './components/TallyBar'
import { useConfig } from './hooks/useConfig'
import { useCurriculum } from './hooks/useCurriculum'
import { useAssignments } from './hooks/useAssignments'

function App() {
  const { config, setHoursPerCredit, setMinCreditsForGraduation } = useConfig()
  const { unitsWithHours, loading, error } = useCurriculum()
  const { assignments, setAssignment, removeAssignment } = useAssignments()

  if (error) {
    return (
      <div style={{ padding: '1rem', color: 'crimson' }}>
        Failed to load curriculum: {error}
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Homeschool 4-Year Planner</h1>
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
