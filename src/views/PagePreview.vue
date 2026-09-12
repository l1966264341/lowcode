<script setup lang="ts">
import router from '@/router'
import { useEditorStore } from '@/stores'
import { getWidget } from '@/widgets'

const store = useEditorStore()
</script>

<template>
  <div id="preview-container">
    <div id="canvas">
      <div v-for="b in store.blocks" :key="b._vid" class="block">
        <!-- 组件实体的渲染 -->
        <component :is="getWidget(b).component" v-bind="b.props"></component>
      </div>
    </div>

    <div class="btn-container">
      <button @click="router.push('/')">返回主页</button>
      <button>测试按钮</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
#preview-container {
  display: flex;
  justify-content: center;
  #canvas {
    padding: 5px;

    min-height: 98vh;

    background-color: #f5f7fa;
    width: 512px;
  }

  .btn-container {
    top: 0;
    right: 0;

    padding-top: 30px;

    width: 105px;
    height: 100vh;

    position: fixed;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: skyblue;

    .block {
      // margin: 20px;
      background: red;
    }
    button {
      margin-bottom: 20px;

      border: 1px solid #000;
      border-radius: 14px;

      cursor: pointer;
      width: 80%;
      height: 40px;
      background-color: #e0e4ea;

      color: #000;
      font-size: 87%;
    }
  }
}
</style>
