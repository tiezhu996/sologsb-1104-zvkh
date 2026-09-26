import { create } from 'zustand'
import type { DisassemblyStep, StepAction } from '../types/step'
import { db } from '../utils/db'

interface StepState {
  steps: DisassemblyStep[]
  currentStepId: string | null
  loading: boolean
  loadSteps: (jointTypeId: string) => Promise<void>
  moveStep: (jointTypeId: string, action: StepAction, from: number, to: number) => Promise<void>
  setCurrentStepId: (id: string) => void
}

export const useStepStore = create<StepState>((set, get) => ({
  steps: [],
  currentStepId: null,
  loading: false,

  loadSteps: async (jointTypeId) => {
    set({ loading: true })
    try {
      const steps = await db.steps.where('jointTypeId').equals(jointTypeId).sortBy('seq')
      set({ steps })
    } finally {
      set({ loading: false })
    }
  },

  moveStep: async (jointTypeId, action, from, to) => {
    if (from === to || from < 0 || to < 0) return
    // 只取同类型、同轨道的步骤；另一条轨道不在此次重排范围内
    const track = get().steps
      .filter((step) => step.jointTypeId === jointTypeId && step.action === action)
      .sort((a, b) => a.seq - b.seq)
    if (from >= track.length || to >= track.length) return
    const [moved] = track.splice(from, 1)
    if (!moved) return
    track.splice(to, 0, moved)
    const resequenced = track.map((step, index) => ({ ...step, seq: index + 1 }))
    set((state) => ({
      steps: state.steps.map((step) => {
        const updated = resequenced.find((item) => item.id === step.id)
        return updated ?? step
      }),
      currentStepId: moved.id,
    }))
    await db.steps.bulkPut(resequenced)
  },

  setCurrentStepId: (id) => set({ currentStepId: id }),
}))
