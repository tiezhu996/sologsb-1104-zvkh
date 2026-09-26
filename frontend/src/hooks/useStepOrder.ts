import { useCallback, useEffect, useMemo } from 'react'
import { ACTION_ORDER, useStepStore } from '../stores/stepStore'
import type { DisassemblyStep, StepAction } from '../types/step'

export interface StepTrack {
  action: StepAction
  steps: DisassemblyStep[]
  totalDurationSec: number
}

interface StepOrderResult {
  tracks: StepTrack[]
  steps: DisassemblyStep[]
  currentStep: DisassemblyStep | undefined
  move: (action: StepAction, from: number, to: number) => Promise<void>
  setCurrentStep: (stepId: string) => void
}

export function useStepOrder(jointTypeId: string): StepOrderResult {
  const allSteps = useStepStore((state) => state.steps)
  const currentStepId = useStepStore((state) => state.currentStepId)
  const loadSteps = useStepStore((state) => state.loadSteps)
  const setCurrentStep = useStepStore((state) => state.setCurrentStep)

  useEffect(() => {
    if (!jointTypeId) return
    void loadSteps(jointTypeId)
  }, [jointTypeId, loadSteps])

  const steps = useMemo(
    () => allSteps
      .filter((step) => step.jointTypeId === jointTypeId)
      .sort((a, b) => {
        const actionDelta = ACTION_ORDER.indexOf(a.action) - ACTION_ORDER.indexOf(b.action)
        return actionDelta !== 0 ? actionDelta : a.seq - b.seq
      }),
    [allSteps, jointTypeId],
  )

  const tracks = useMemo(
    () => ACTION_ORDER.map((action) => {
      const trackSteps = steps.filter((step) => step.action === action)
      return {
        action,
        steps: trackSteps,
        totalDurationSec: trackSteps.reduce((total, step) => total + step.holdSec, 0),
      }
    }),
    [steps],
  )

  const currentStep = useMemo(
    () => steps.find((step) => step.id === currentStepId) ?? steps[0],
    [steps, currentStepId],
  )

  const move = useCallback(async (action: StepAction, from: number, to: number) => {
    await useStepStore.getState().moveStep(action, from, to)
  }, [])

  return {
    tracks,
    steps,
    currentStep,
    move,
    setCurrentStep,
  }
}
