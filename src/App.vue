<script setup lang="ts">
import zh from 'element-plus/es/locale/lang/zh-cn.mjs'
</script>

<template>
  <el-config-provider :locale="zh">
    <router-view></router-view>
  </el-config-provider>
</template>
