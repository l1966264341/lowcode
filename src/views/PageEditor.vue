<script setup lang="ts">
import CanvasDesign from '@/components/CanvasDesign.vue'
import ComponentLibrary from '@/components/ComponentLibrary.vue'
import PropertyPanel from '@/components/PropertyPanel.vue'
import DialogImport from '@/components/DialogImport.vue'

import router from '@/router'

import { useEditorStore } from '@/stores'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

const editorStore = useEditorStore()

// JSON文件导入
const showDialog = ref(false)

// 导出为JSON文件
const exportJson = () => {
  // blocks -> json -> blob -> url
  const blocksJson = JSON.stringify(editorStore.blocks)
  const blockBlob = new Blob([blocksJson], { type: 'application/json' })
  const url = URL.createObjectURL(blockBlob)

  // 创建a标签 -> a指向url并给文件取名 -> 点击链接
  const a = document.createElement('a')
  a.href = url
  a.download = '组件实例群.json' // 给下载的文件取名
  a.click()
  // 释放内存
  URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}
</script>

<template>
  <el-container class="editor">
    <!-- 顶部工具栏 -->
    <el-header class="editor-header">
      <h1 class="editor-title">低代码平台</h1>
      <div class="editor-tools">
        <el-button size="small" @click="router.push('/preview')" type="primary">预览</el-button>
        <el-button size="small" @click="showDialog = !showDialog">导入</el-button>
        <el-button size="small" @click="exportJson">导出</el-button>
        <el-button size="small" @click="editorStore.clearBlocks" type="danger">清空</el-button>
      </div>
    </el-header>
    <!-- 主体三栏 -->
    <el-container class="editor-body">
      <el-aside width="220px" class="editor-aside">
        <ComponentLibrary @add="editorStore.addBlock" />
      </el-aside>

      <el-main class="editor-main">
        <CanvasDesign
          :blocks="editorStore.blocks"
          @focus="editorStore.onFocus"
          @insert="editorStore.onDragInsert"
          @move="editorStore.onDragMove"
        />
      </el-main>

      <el-aside width="280px" class="editor-aside">
        <PropertyPanel :selectedBlock="editorStore.selected" @del="editorStore.delBlock" />
      </el-aside>
    </el-container>
  </el-container>
  <!-- 弹窗组件 -->
  <DialogImport :show="showDialog" @close="showDialog = false"></DialogImport>
</template>

<style scoped lang="scss">
.editor {
  height: 100vh;
}
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e7ed;
  .editor-title {
    font-size: 18px;
  }
  .editor-tools {
    display: flex;
    gap: 8px;
  }
}

.editor-body {
  height: calc(100vh - 60px);
  overflow: auto;

  .editor-aside {
    padding: 12px;
    box-sizing: border-box;
  }
  .editor-main {
    // background: #f5f7fa;
    padding: 16px;
    border-left: 1px solid #e4e7ed;
    border-right: 1px solid #e4e7ed;
  }
}
</style>
