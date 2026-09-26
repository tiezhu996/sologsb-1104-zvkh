import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BlankPanel } from '../components/common/BlankPanel'
import { StepRail } from '../components/common/StepRail'
import { SvgCanvas } from '../components/common/SvgCanvas'
import { useStepOrder } from '../hooks/useStepOrder'
import { useDiagramStore } from '../stores/diagramStore'
import { useJointStore } from '../stores/jointStore'

export default function StepBoard() {
  const { id: idParam } = useParams()
  const id = idParam ?? ''
  const joints = useJointStore((state) => state.joints)
  const loadAll = useJointStore((state) => state.loadAll)
  const diagrams = useDiagramStore((state) => state.diagrams)
  const selectedMemberId = useDiagramStore((state) => state.selectedMemberId)
  const loadDiagrams = useDiagramStore((state) => state.loadDiagrams)
  const setSelectedMember = useDiagramStore((state) => state.setSelectedMember)
  const { tracks, currentStep, totalDurationSec, move, selectStep } = useStepOrder(id)

  useEffect(() => {
    void loadAll()
    if (id) void loadDiagrams(id)
  }, [id, loadAll, loadDiagrams])

  const joint = joints.find((item) => item.id === id)
  const currentDiagram = diagrams.find((diagram) => diagram.stepId === currentStep?.id) ?? diagrams[0]

  return (
    <div className="space-y-7">
      <div>
        <Link to={`/joints/${id}`} className="inline-flex items-center gap-1.5 text-sm text-wood-700 hover:underline">
          <span aria-hidden="true">←</span> 返回类型详情
        </Link>
      </div>

      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.24em] text-wood-500">STEP SEQUENCE</p>
          <h1 className="text-3xl font-bold tracking-tight text-wood-900 sm:text-4xl">{joint?.name ?? '榫卯'} · 拆装步序编排</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            拆卸与装配分成两条轨道，各自从 1 号排起；拖动只在同一条轨道内生效。右侧同步查看每一步的示意图和风险提醒。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-stone-600">
          {tracks.map((track) => (
            <span key={track.action} className="rounded-xl border border-wood-100 bg-white px-4 py-3 shadow-sm">
              {track.action} {track.steps.length} 步 · 停留 <strong className="text-wood-700">{track.totalDurationSec}</strong> 秒
            </span>
          ))}
          <span className="rounded-xl border border-wood-100 bg-wood-50 px-4 py-3 shadow-sm">
            合计停留 <strong className="text-wood-700">{totalDurationSec}</strong> 秒
          </span>
        </div>
      </section>

      {tracks.every((track) => track.steps.length === 0) ? (
        <BlankPanel title="当前类型尚无步骤" description="没有可编排的拆装动作，请先补充步骤数据。" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="panel max-h-[720px] space-y-5 overflow-y-auto p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-wood-900">步骤轨道</h2>
                <p className="mt-1 text-xs text-stone-500">两条轨道各自编号，拖动互不影响</p>
              </div>
              <span className="rounded-full bg-wood-50 px-3 py-1 text-xs text-wood-700">自动保存</span>
            </div>
            {tracks.map((track) => (
              <div key={track.action} className="space-y-3 border-t border-stone-100 pt-4 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-wood-800">
                    {track.label}
                    <span className="ml-2 text-xs font-normal text-stone-500">{track.steps.length} 步 · {track.totalDurationSec} 秒</span>
                  </h3>
                </div>
                {track.steps.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200 px-4 py-3 text-xs text-stone-400">
                    该轨道暂无步骤
                  </p>
                ) : (
                  <StepRail
                    action={track.action}
                    label={track.label}
                    steps={track.steps}
                    currentStepId={currentStep?.id ?? null}
                    onSelect={selectStep}
                    onMove={(trackAction, from, to) => void move(trackAction, from, to)}
                  />
                )}
              </div>
            ))}
          </section>

          <section className="space-y-5">
            <div className="panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-11 items-center gap-1.5 rounded-full bg-wood-700 px-4 text-lg font-bold text-white">
                  <span className="text-xs font-medium opacity-80">{currentStep?.action ?? ''}</span>
                  <span>{currentStep?.seq ?? 0}</span>
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-wood-900">{currentStep?.action ?? '步骤'} · {currentStep?.direction ?? '方向'}</h2>
                  <p className="mt-1 text-xs text-stone-500">使用工具：{currentStep?.tool ?? '待补充'} · 停留 {currentStep?.holdSec ?? 0} 秒</p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                <p className="text-xs font-semibold text-amber-900">易损部位提醒</p>
                <p className="mt-1 text-sm leading-6 text-amber-900/80">{currentStep?.riskNote ?? '暂无提醒'}</p>
              </div>
            </div>

            <SvgCanvas
              svgMarkup={currentDiagram?.svgMarkup ?? ''}
              title={currentDiagram?.title ?? '步骤预览'}
              hitAreas={currentDiagram?.hitAreas ?? []}
              selectedMemberId={selectedMemberId}
              onSelectMember={setSelectedMember}
              emptyMessage="该步骤暂未绑定示意图"
            />
          </section>
        </div>
      )}
    </div>
  )
}
