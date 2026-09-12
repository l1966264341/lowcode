import { type Component } from 'vue'
// 属性
interface PropConfig {
  label: string
  type: 'text' | 'number'
  defaultValue: string | number
}

// 模版组件项
export interface WidgetItem {
  key: string
  label: string
  component: Component
  focus: boolean
  props: Record<string, PropConfig>
}

// 渲染实体项
export interface BlockItem {
  _vid: string
  widgetKey: string
  label: string
  focus: boolean
  props: Record<string, string | number>
}

import widgetText from './widget-text'
import widgetInput from './widget-input'
import widgetButton from './widget-button'
// 模版组件库列表
export const widgetList: WidgetItem[] = [widgetText, widgetInput, widgetButton]

let seed = 0
// 创建组件实例
export const createBlock = (w: WidgetItem): BlockItem => ({
  _vid: `vid_${seed++}_${Date.now()}`,
  widgetKey: w.key,
  label: w.label,
  focus: false,
  props: Object.fromEntries(Object.entries(w.props).map(([key, val]) => [key, val.defaultValue])),
})

// 组件实例反查组件库
export const getWidget = (block: BlockItem) => widgetList.find((w) => w.key === block.widgetKey)!
