export type StepAction = '拆卸' | '装配'
export type StepDirection = '轴向' | '侧向' | '斜向'
export type StepTool = '木槌' | '鱼线' | '撬板'

/** 两条步骤轨道的固定展示顺序，各自的 seq 都从 1 开始 */
export const STEP_ACTIONS: readonly StepAction[] = ['拆卸', '装配'] as const

export interface DisassemblyStep {
  id: string
  jointTypeId: string
  /** 所属轨道（按 action 区分）内的序号，从 1 开始 */
  seq: number
  action: StepAction
  direction: StepDirection
  tool: StepTool
  riskNote: string
  holdSec: number
  schemaRev?: number
}
