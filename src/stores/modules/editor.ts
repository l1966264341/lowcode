import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { createBlock, widgetList } from '@/widgets'
import type { BlockItem, WidgetItem } from '@/widgets'
import { ElMessage } from 'element-plus'

const BLOCKS_KEY = 'lowcode-blocks'
const loadBlocks = (): BlockItem[] => {
  try {
    const blocksData = localStorage.getItem(BLOCKS_KEY)
    return blocksData ? (JSON.parse(blocksData) as BlockItem[]) : []
  } catch {
    return []
  }
}

const SELECTED_ID_KEY = 'lowcode-selected-id'
const loadSelected = (): string | null => {
  try {
    // return localStorage.getItem(SELECTED_ID_KEY)
    const id = localStorage.getItem(SELECTED_ID_KEY)
    // 如果读到了空字符串，直接当成 null 返回，省得去 find 走一趟
    return id && id !== '' ? id : null
  } catch {
    return null
  }
}

export const useEditorStore = defineStore('blocks-store', () => {
  // 组件实体集
  const blocks = ref<BlockItem[]>(loadBlocks())

  // 被选中实例
  const persistSelectedItem = blocks.value.find((b) => b._vid === loadSelected()) || null
  const selected = ref<BlockItem | null>(persistSelectedItem)

  // 持久化存储
  watch(
    blocks,
    (newVal) => {
      localStorage.setItem(BLOCKS_KEY, JSON.stringify(newVal))
    },
    { deep: true },
  )
  watch(selected, (newVal) => {
    localStorage.setItem(SELECTED_ID_KEY, newVal ? newVal._vid : '')
  })

  // 组件实体被选中
  const onFocus = (focusBlock: BlockItem, certain: boolean = false) => {
    // 传入certain为true,强迫聚焦, 否则（包括不传值）实现聚焦切换
    const focusState = certain || !focusBlock.focus

    blocks.value.forEach((b) => (b.focus = false))
    focusBlock.focus = focusState
    selected.value = focusState ? focusBlock : null
  }

  // 添加组件实体
  const addBlock = (w: WidgetItem) => {
    const b = createBlock(w)
    blocks.value.push(b)
    onFocus(b)
  }

  // 删除组件
  const delBlock = (_vid: string) => {
    selected.value = null
    blocks.value = blocks.value.filter((b) => b._vid !== _vid)
  }

  // 清空组件
  const clearBlocks = () => {
    selected.value = null
    blocks.value = []
  }

  // 拖拽功能
  // 插入新组件
  const onDragInsert = (widgetKey: string, to: number) => {
    const newWidget = widgetList.find((w) => w.key === widgetKey)!
    const b = createBlock(newWidget)
    blocks.value.splice(to, 0, b)
    onFocus(b)
  }
  // 移动组件实体
  const onDragMove = (from: number, to: number) => {
    // 删
    const moveItem = blocks.value.splice(from, 1)[0]!

    // 增
    const toIndex = to > from ? to - 1 : to
    blocks.value.splice(toIndex, 0, moveItem)
    onFocus(moveItem, true)
  }

  // 判断是否为组件实体群
  const judgeBlocks = (data: unknown): boolean => {
    if (
      Array.isArray(data) &&
      data.every((i) => typeof i === 'object' && '_vid' in i && 'widgetKey' in i)
    ) {
      return true
    }

    return false
  }
  // 导入JSON文件
  const importJson = (blocksJson: string) => {
    try {
      const newBlocks = JSON.parse(blocksJson)
      if (!judgeBlocks(newBlocks)) throw new Error('格式错误')

      blocks.value = newBlocks as BlockItem[]
      selected.value = null
      ElMessage.success('导入成功')
    } catch (err) {
      // ElMessage.error('错误信息为' + err)
      throw new Error(err instanceof Error ? err.message : '导入失败，可能是格式错误')
    }
  }

  return {
    blocks,
    addBlock,
    selected,
    onFocus,
    delBlock,
    clearBlocks,
    onDragInsert,
    onDragMove,
    importJson,
  }
})
