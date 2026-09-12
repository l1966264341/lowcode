<script setup lang="ts">
import { widgetList } from '@/widgets'
import type { WidgetItem } from '@/widgets'
const emit = defineEmits<{
  add: [w: WidgetItem]
}>()

// 拖拽起点
const onDragStart = (e: DragEvent, w: WidgetItem) => {
  e.dataTransfer!.setData('widget-key', w.key)
  e.dataTransfer!.effectAllowed = 'copy'
}
</script>

<template>
  <h3>组件库</h3>
  <div
    v-for="w in widgetList"
    :key="w.key"
    draggable="true"
    @dragstart="onDragStart($event, w)"
    @click="emit('add', w)"
    class="widgetBtn"
  >
    {{ w.label }}
  </div>
</template>

<style scoped>
.widgetBtn {
  margin-bottom: 15px;

  border: 1px solid rgb(105, 108, 109);
  border-radius: 11px;

  width: 80px;
  height: 30px;

  line-height: 30px;
  text-align: center;
  cursor: pointer;
}
</style>
