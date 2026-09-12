<script setup lang="ts">
import { getWidget, type BlockItem } from '@/widgets'
import { computed, ref } from 'vue'

const props = defineProps<{
  blocks: BlockItem[]
}>()
const blocksLen = computed(() => props.blocks.length)

// focus 功能
const emit = defineEmits<{
  focus: [block: BlockItem]
  insert: [widgetKey: string, to: number]
  move: [from: number, to: number]
}>()

// 拖拽功能
// 实例移动
const onBlockDragStart = (e: DragEvent, index: number) => {
  e.dataTransfer!.setData('block-key', String(index))
  e.dataTransfer!.effectAllowed = 'move'
}
// 移动过程
const canvasRef = ref<HTMLElement | null>(null)
const dragOverIndex = ref(-1)
const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  const els = canvasRef.value?.querySelectorAll('.block') || []
  dragOverIndex.value = blocksLen.value
  for (let i = 0; i < blocksLen.value; i++) {
    const el = els[i] as HTMLElement
    if (!el) continue // AI建议加这行，防崩溃
    const rect = el.getBoundingClientRect()
    if (e.clientY < rect.top + rect.height / 2) {
      // 拖拽位置索引
      dragOverIndex.value = i
      return
    }
  }
}
// 拖拽放下
const onDrop = (e: DragEvent) => {
  e.preventDefault()
  // 放的位置
  const toIndex = dragOverIndex.value
  if (toIndex === -1) return
  // insert新组件
  const widgetKey = e.dataTransfer!.getData('widget-key')
  if (widgetKey) {
    emit('insert', widgetKey, toIndex)
  } else {
    // move旧组件
    const fromIndex = +e.dataTransfer!.getData('block-key')
    emit('move', fromIndex, toIndex)
  }
  dragOverIndex.value = -1
}

const onDragLeave = (e: DragEvent) => {
  const related = e.relatedTarget as HTMLElement | null
  if (!related || !canvasRef.value?.contains(related)) {
    dragOverIndex.value = -1
  }
}
</script>

<template>
  <div
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    ref="canvasRef"
    class="canvas"
  >
    <template v-for="(b, index) in blocks" :key="b._vid">
      <!-- 拖拽线 -->
      <div v-show="dragOverIndex === index" class="line"></div>
      <div
        class="block"
        :class="{ focus: b.focus }"
        draggable="true"
        @dragstart="onBlockDragStart($event, index)"
        @click="emit('focus', b)"
      >
        <!-- 组件实体的渲染 -->
        <component :is="getWidget(b).component" v-bind="b.props"></component>
      </div>
    </template>
    <!-- 末端的线 -->
    <div v-show="dragOverIndex === blocksLen" class="line"></div>
  </div>
  <div>
    dragOverIndex: {{ dragOverIndex }} blockslen: {{ blocksLen }} blocks.length:{{ blocks.length }}
  </div>
</template>

<style scoped lang="scss">
.canvas {
  padding: 5px;
  background: #f5f7fa;
  min-height: calc(100vh - 130px);
  .block {
    margin: 2px;
  }
  .line {
    border: 1px solid #000;
  }
  .focus {
    border: 1px solid skyblue;
  }
}
</style>
