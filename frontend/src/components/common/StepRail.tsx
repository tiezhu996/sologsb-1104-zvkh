import type { DragEvent } from 'react'
import type { DisassemblyStep, StepAction } from '../../types/step'

interface StepRailProps {
  action: StepAction
  label: string
  steps: DisassemblyStep[]
  currentStepId: string | null
  onSelect: (id: string) => void
  onMove: (action: StepAction, from: number, to: number) => void
}

interface DragPayload {
  action: StepAction
  index: number
}

export function StepRail({ action, label, steps, currentStepId, onSelect, onMove }: StepRailProps) {
  const handleDrop = (event: DragEvent<HTMLElement>, to: number) => {
    event.preventDefault()
    try {
      const payload = JSON.parse(event.dataTransfer.getData('text/plain')) as Partial<DragPayload>
      // 拖动只在同一条轨道里生效，来自另一条轨道的放置直接忽略
      if (payload.action !== action) return
      if (!Number.isInteger(payload.index)) return
      onMove(action, payload.index as number, to)
    } catch {
      // 非本组件产生的拖拽数据一律忽略
    }
  }

  return (
    <div className="space-y-3" aria-label={label}>
      {steps.map((step, index) => (
        <article
          key={step.id}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move'
            const payload: DragPayload = { action, index }
            event.dataTransfer.setData('text/plain', JSON.stringify(payload))
          }}
          onDragOver={(event) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(event) => handleDrop(event, index)}
          className={`group rounded-xl border p-3 transition ${
            currentStepId === step.id
              ? 'border-wood-500 bg-wood-50 shadow-sm'
              : 'border-stone-200 bg-white hover:border-wood-100'
          }`}
          data-testid={`step-row-${action}`}
        >
          <button
            type="button"
            onClick={() => onSelect(step.id)}
            className="flex w-full items-start gap-3 text-left"
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              currentStepId === step.id ? 'bg-wood-700 text-white' : 'bg-stone-100 text-stone-600'
            }`}>
              {step.seq}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <strong className="text-sm text-stone-900">{step.action}</strong>
                <span className="text-xs text-stone-500">{step.direction} · {step.tool}</span>
              </span>
              <span className="mt-1 block text-xs leading-5 text-stone-500">{step.riskNote}</span>
              <span className="mt-1 block text-[11px] text-wood-700">停留 {step.holdSec} 秒</span>
            </span>
          </button>
          <div className="mt-2 flex justify-end">
            <span className="cursor-grab select-none rounded px-2 py-1 text-[11px] text-stone-400 group-active:cursor-grabbing">
              拖动调序（仅{label}）
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}
