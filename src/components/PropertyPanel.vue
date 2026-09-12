<script setup lang="ts">
import { useEditorStore } from '@/stores'
import { getWidget, type BlockItem } from '@/widgets'
import { computed } from 'vue'

const props = defineProps<{
  selectedBlock: BlockItem | null
}>()

// 根据实例反查组件注册表
const currentWidget = computed(() => (props.selectedBlock ? getWidget(props.selectedBlock) : null))

const emit = defineEmits<{
  del: [_vid: string]
}>()

const store = useEditorStore()
</script>

<template>
  <div v-if="selectedBlock !== null && currentWidget">
    <h3>属性面板</h3>
    <!-- 组件名 -->
    <div class="prop-item">当前：{{ currentWidget.label }}</div>
    <div class="prop-item" v-for="(config, key) in currentWidget.props" :key="key">
      <!-- 属性名 -->
      <label>{{ config.label }}</label>
      <!-- 属性配置表单 -->
      <!-- <el-input v-if="config.type === 'text'" v-model="selectedBlock.props[key]" /> -->
      <el-input v-if="config.type === 'text'" v-model="store.selected!.props[key]" />
      <el-input-number v-else v-model="store.selected!.props[key]" />
    </div>
    <!-- 删除组件实体 -->
    <el-button @click="emit('del', selectedBlock._vid)" type="danger">删除</el-button>
  </div>
  <div v-else>点击画布中的组件进行配置</div>
</template>

<style scoped lang="scss">
.prop-item {
  margin-bottom: 15px;

  > label {
    display: block; /* 属性名独占一行 */
    font-size: 13px;
    margin-bottom: 4px;
    color: #333;
  }
}
</style>
