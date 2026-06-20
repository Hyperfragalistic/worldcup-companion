// Re-exports the shared ProfileContext so all callers get the same
// profile instance — updates in OnboardingModal propagate to SchedulePage
// without a page reload.
export { useProfileContext as useProfile } from '../providers/ProfileProvider'
