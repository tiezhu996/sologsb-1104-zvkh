import { useCallback, useEffect, useMemo } from 'react'
import { useStepStore } from '../stores/stepStore'
import { STEP_ACTIONS, type DisassemblyStep, type StepAction } from '../types/step'

export interface StepTrack {
  action: StepAction
  label: string
  steps: DisassemblyStep[]
  totalDurationSec: number
}

interface StepOrderResult {
  tracks: StepTrack[]
  steps: DisassemblyStep[]
  currentStep: DisassemblyStep | null
  totalDurationSec: number
  move: (action: StepAction, from: number, to: number) => Promise<void>
  selectStep: (id: string) => void
}

export function useStepOrder(jointTypeId: string): StepOrderResult {
  const allSteps = useStepStore((state) => state.steps)
  const currentStepId = useStepStore((state) => state.currentStepId)
  const loadSteps = useStepStore((state) => state.loadSteps)
  const setCurrentStepId = useStepStore((state) => state.setCurrentStepId)

  useEffect(() => {
    if (!jointTypeId) return
    void loadSteps(jointTypeId)
  }, [jointTypeId, loadSteps])

  const tracks = useMemo<StepTrack[]>(
    () => STEP_ACTIONS.map((action) => {
      const steps = allSteps
        .filter((step) => step.jointTypeId === jointTypeId && step.action === action)
        .sort((a, b) => a.seq - b.seq)
      return {
        action,
        label: action === '拆卸' ? '拆卸轨道' : '装配轨道',
        steps,
        totalDurationSec: steps.reduce((total, step) => total + step.holdSec, 0),
      }
    }),
    [allSteps, jointTypeId],
  )

  const steps = useMemo(
    () => tracks.flatMap((track) => track.steps),
    [tracks],
  )

  const totalDurationSec = useMemo(
    () => steps.reduce((total, step) => total + step.holdSec, 0),
    [steps],
  )

  const currentStep = useMemo(
    () => steps.find((step) => step.id === currentStepId) ?? steps[0] ?? null,
    [steps, currentStepId],
  )

  const move = useCallback(async (action: StepAction, from: number, to: number) => {
    await useStepStore.getState().moveStep(jointTypeId, action, from, to)
  }, [jointTypeId])

  const selectStep = useCallback((id: string) => {
    setCurrentStepId(id)
  }, [setCurrentStepId])

  return {
    tracks,
    steps,
    currentStep,
    totalDurationSec,
    move,
    selectStep,
  }
}
