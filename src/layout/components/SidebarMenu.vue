<template>
  <el-menu
    :default-active="activeMenu"
    class="el-menu-vertical"
    :collapse="isCollapse"
    :collapse-transition="false"
    router
  >
    <el-menu-item index="/">
      <el-icon><IconMenu /></el-icon>
      <template #title>控制台</template>
    </el-menu-item>
    
    <template v-if="userStore.isSuperAdmin">
      <el-menu-item index="/tenants">
        <el-icon><OfficeBuilding /></el-icon>
        <template #title>租户管理</template>
      </el-menu-item>
      
      <el-menu-item index="/packages">
        <el-icon><Box /></el-icon>
        <template #title>套餐管理</template>
      </el-menu-item>
    </template>

    <template v-else>
      <el-menu-item index="/articles">
        <el-icon><Document /></el-icon>
        <template #title>文章管理</template>
      </el-menu-item>
      
      <el-menu-item index="/categories">
        <el-icon><CollectionTag /></el-icon>
        <template #title>分类标签</template>
      </el-menu-item>

      <el-menu-item index="/comments">
        <el-icon><ChatLineRound /></el-icon>
        <template #title>评论管理</template>
      </el-menu-item>

      <el-menu-item index="/media">
        <el-icon><Picture /></el-icon>
        <template #title>媒体中心</template>
      </el-menu-item>

      <el-divider class="menu-divider" />

      <el-menu-item index="/users">
        <el-icon><User /></el-icon>
        <template #title>成员管理</template>
      </el-menu-item>
      
      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <template #title>系统设置</template>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { 
  Menu as IconMenu, 
  OfficeBuilding, 
  Box, 
  Document, 
  CollectionTag, 
  ChatLineRound,
  Picture,
  User, 
  Setting 
} from '@element-plus/icons-vue'

defineProps<{
  isCollapse: boolean
}>()

const route = useRoute()
const userStore = useUserStore()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.el-menu-vertical {
  border-right: none;
  padding-top: 8px;
  overflow: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.el-menu-vertical::-webkit-scrollbar {
  display: none;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 240px;
}

.menu-divider {
  margin: 12px 20px;
  border-top: 1px solid #f1f5f9;
}

.el-menu--collapse .menu-divider {
  margin: 12px 12px;
}
</style>
