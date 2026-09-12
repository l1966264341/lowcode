<script setup lang="ts">
import { useEditorStore } from '@/stores'
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'
const props = defineProps<{
  show: boolean
}>()
const emit = defineEmits<{
  close: []
}>()

const store = useEditorStore()
const fileInputRef = ref<HTMLInputElement | null>(null)
const importText = ref('')

// 关闭时清空粘贴内容，避免下次打开残留
watch(
  () => props.show,
  (val) => {
    if (!val) importText.value = ''
  },
)

// 触发隐藏的 file input
const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

// 用户选完文件后触发
const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 校验后缀
  if (!file.name.endsWith('.json')) {
    ElMessage.error('请选择 .json 文件')
    target.value = '' // 清空，允许重选同一个文件
    return
  }

  // FileReader 读文本
  const reader = new FileReader()
  reader.onload = () => {
    const text = reader.result as string
    try {
      store.importJson(text)
      ElMessage.success('导入成功')
      emit('close')
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : '导入失败')
    }
  }
  reader.readAsText(file)

  // 清空 input，允许重选同一个文件
  target.value = ''
}

// 粘贴 JSON 导入
const doImport = () => {
  if (!importText.value.trim()) {
    ElMessage.warning('请先粘贴 JSON 内容')
    return
  }
  try {
    store.importJson(importText.value)
    ElMessage.success('导入成功')
    emit('close')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '导入失败，请检查 JSON 格式')
  }
}
</script>

<template>
  <el-dialog
    title="导入页面"
    width="500px"
    :model-value="show"
    @update:model-value="emit('close')"
    @close="emit('close')"
  >
    <div class="import-tip">
      <el-button @click="triggerFileSelect">📁 选择 .json 文件</el-button>
      <span class="import-tip__text">或直接粘贴 JSON</span>
    </div>

    <el-input v-model="importText" type="textarea" :rows="10" placeholder="粘贴 page.json 的内容" />

    <template #footer>
      <el-button @click="emit('close')">取消</el-button>
      <el-button type="primary" @click="doImport">确定导入</el-button>
    </template>

    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      class="hidden-file"
      @change="onFileChange"
    />
  </el-dialog>
</template>

<style scoped lang="scss">
.import-tip {
  margin-bottom: 12px;

  &__text {
    color: #999;
    font-size: 12px;
    margin-left: 8px;
  }
}

.hidden-file {
  display: none;
}
</style>
