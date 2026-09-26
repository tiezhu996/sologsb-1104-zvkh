import { create } from 'zustand'
import type { DisassemblyStep, StepAction } from '../types/step'
import { db } from '../utils/db'

export const ACTION_ORDER: StepAction[] = ['拆卸', '装配']

function sortSteps(steps: DisassemblyStep[]): DisassemblyStep[] {
  return [...steps].sort((a, b) => {
    const actionDelta = ACTION_ORDER.indexOf(a.action) - ACTION_ORDER.indexOf(b.action)
    return actionDelta !== 0 ? actionDelta : a.seq - b.seq
  })
}

interface StepState {
  steps: DisassemblyStep[]
  currentStepId: string | null
  loading: boolean
  loadSteps: (jointTypeId: string) => Promise<void>
  moveStep: (action: StepAction, from: number, to: number) => Promise<void>
  setCurrentStep: (stepId: string) => void
}

export const useStepStore = create<StepState>((set, get) => ({
  steps: [],
  currentStepId: null,
  loading: false,

  loadSteps: async (jointTypeId) => {
    set({ loading: true })
    try {
      const steps = sortSteps(await db.steps.where('jointTypeId').equals(jointTypeId).toArray())
      set((state) => ({
        steps,
        currentStepId: steps.some((step) => step.id === state.currentStepId)
          ? state.currentStepId
          : steps[0]?.id ?? null,
      }))
    } finally {
      set({ loading: false })
    }
  },

  moveStep: async (action, from, to) => {
    const all = get().steps
    const track = all.filter((step) => step.action === action).sort((a, b) => a.seq - b.seq)
    if (from < 0 || to < 0 || from >= track.length || to >= track.length || from === to) return
    const [moved] = track.splice(from, 1)
    if (!moved) return
    track.splice(to, 0, moved)
    // 只重排本条轨道的编号，另一条轨道的 seq 原样保留
    const resequenced = track.map((step, index) => ({ ...step, seq: index + 1 }))
    const resequencedIds = new Set(resequenced.map((step) => step.id))
    set({
      steps: sortSteps([
        ...all.filter((step) => !resequencedIds.has(step.id)),
        ...resequenced,
      ]),
      currentStepId: moved.id,
    })
    await db.steps.bulkPut(resequenced)
  },

  setCurrentStep: (stepId) => set({ currentStepId: stepId }),
}))
