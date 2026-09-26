import type { DragEvent } from 'react'
import type { DisassemblyStep, StepAction } from '../../types/step'

const INDEX_MIME = 'application/x-step-index'
const actionMime = (action: StepAction) => `application/x-step-action-${action}`

interface StepRailProps {
  action: StepAction
  steps: DisassemblyStep[]
  currentStepId: string | null
  onSelect: (stepId: string) => void
  onMove: (from: number, to: number) => void
}

export function StepRail({ action, steps, currentStepId, onSelect, onMove }: StepRailProps) {
  const totalDurationSec = steps.reduce((total, step) => total + step.holdSec, 0)

  const accepts = (event: DragEvent<HTMLElement>) =>
    event.dataTransfer.types.includes(actionMime(action))

  const handleDrop = (event: DragEvent<HTMLElement>, to: number) => {
    event.preventDefault()
    if (!accepts(event)) return
    const from = Number(event.dataTransfer.getData(INDEX_MIME))
    if (Number.isInteger(from)) onMove(from, to)
  }

  return (
    <section
      aria-label={`${action}轨道`}
      data-testid={`step-rail-${action}`}
      className="space-y-3"
      onDragOver={(event) => {
        if (!accepts(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(event) => handleDrop(event, steps.length - 1)}
    >
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-wood-900">{action}轨道</h3>
        <span className="text-xs text-stone-500">
          {steps.length} 步 · 停留 <strong className="text-wood-700">{totalDurationSec}</strong> 秒
        </span>
      </header>

      {steps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center text-xs text-stone-400">
          暂无{action}步骤
        </p>
      ) : (
        steps.map((step, index) => (
          <article
            key={step.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData(INDEX_MIME, String(index))
              event.dataTransfer.setData(actionMime(action), action)
            }}
            onDragOver={(event) => {
              if (!accepts(event)) return
              event.preventDefault()
              event.stopPropagation()
              event.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(event) => {
              event.stopPropagation()
              handleDrop(event, index)
            }}
            className={`group rounded-xl border p-3 transition ${
              currentStepId === step.id
                ? 'border-wood-500 bg-wood-50 shadow-sm'
                : 'border-stone-200 bg-white hover:border-wood-100'
            }`}
            data-testid="step-row"
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
                拖动调序
              </span>
            </div>
          </article>
        ))
      )}
    </section>
  )
}
