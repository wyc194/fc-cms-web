<template>
  <div class="page-container">
    <div class="page-main-scroll flex-auto" style="display: flex; align-items: center; justify-content: center;">
      <el-result
        icon="warning"
        title="403"
        sub-title="抱歉，您没有访问该页面的权限。如需开通权限，请联系管理员。"
      >
        <template #extra>
          <el-button type="primary" @click="router.push('/')">返回首页</el-button>
          <el-button @click="router.back()">返回上一页</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
