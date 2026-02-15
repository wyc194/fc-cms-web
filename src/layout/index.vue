<template>
  <el-container class="layout-container">
    <!-- PC 端侧边栏 -->
    <el-aside v-if="!isMobile" :width="isCollapse ? '64px' : '240px'" class="sidebar-wrapper">
      <div class="logo-container" :class="{ 'is-collapse': isCollapse }">
        <div class="logo-box">
          <img src="@/assets/logo.png" alt="Logo" class="logo-img">
          <span class="logo-text" v-if="!isCollapse">FreeCity</span>
        </div>
      </div>
      <SidebarMenu :is-collapse="isCollapse" />
    </el-aside>

    <!-- 移动端侧边栏 (抽屉模式) -->
    <el-drawer
      v-else
      v-model="mobileMenuVisible"
      direction="ltr"
      size="240px"
      :with-header="false"
      class="mobile-drawer"
    >
      <div class="logo-container">
        <div class="logo-box">
          <img src="@/assets/logo.png" alt="Logo" class="logo-img">
          <span class="logo-text">FreeCity</span>
        </div>
      </div>
      <SidebarMenu :is-collapse="false" />
    </el-drawer>

    <el-container class="main-container">
      <el-header height="64px" class="header-container">
        <div class="header-left">
          <el-button link @click="isMobile ? mobileMenuVisible = true : isCollapse = !isCollapse" class="collapse-btn">
            <el-icon :size="20">
              <component :is="isMobile ? Expand : (isCollapse ? Expand : Fold)" />
            </el-icon>
          </el-button>
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item 
              v-for="item in breadcrumbs" 
              :key="item.path"
              :to="item.path"
            >
              {{ item.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-tooltip content="通知" placement="bottom">
            <el-button link class="header-icon-btn">
              <el-badge :value="3" :max="99" is-dot>
                <el-icon :size="20"><Bell /></el-icon>
              </el-badge>
            </el-button>
          </el-tooltip>
          
          <el-divider direction="vertical" />
          
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-profile">
              <el-avatar :size="32" :src="userStore.user?.avatar">{{ userStore.user?.nickname?.charAt(0) || 'A' }}</el-avatar>
              <span class="username">{{ userStore.user?.nickname || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <span class="logout-text">退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="page-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import SidebarMenu from './components/SidebarMenu.vue'
import { useResponsive } from '@/composables/useResponsive'
import { 
  OfficeBuilding, 
  Box, 
  Document, 
  CollectionTag, 
  Picture,
  User, 
  Setting,
  Expand,
  Fold,
  Bell,
  ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { isMobile } = useResponsive()
const isCollapse = ref(false)
const mobileMenuVisible = ref(false)

// 监听移动端状态，如果是移动端则强制不折叠 PC 侧边栏
watch(isMobile, (val) => {
  if (val) {
    isCollapse.value = false
  }
})

// 路由变化时自动关闭移动端菜单
watch(() => route.path, () => {
  if (isMobile.value) {
    mobileMenuVisible.value = false
  }
})

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  return route.matched.filter(item => item.meta && item.meta.title && item.path !== '/')
})

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  overflow: hidden;
  transition: all 0.3s;
}

.logo-container.is-collapse {
  padding: 0 12px;
}

.logo-box {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.logo-container.is-collapse .logo-box {
  gap: 0;
  justify-content: center;
}

.logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-color-primary);
  white-space: nowrap;
  letter-spacing: -0.5px;
}

.sidebar-wrapper {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 10px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  background-color: #fff;
  border-right: 1px solid #f1f5f9;
}

.main-container {
  overflow: hidden;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px; /* 移动端减小 padding */
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fff;
  border-bottom: 1px solid #f1f5f9;
}

@media (min-width: 768px) {
  .header-container {
    padding: 0 24px;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px; /* 移动端减小 gap */
}

@media (min-width: 768px) {
  .header-left {
    gap: 16px;
  }
}

.collapse-btn {
  padding: 8px;
  border-radius: 8px;
  color: #64748b;
}

.collapse-btn:hover {
  background-color: #f1f5f9;
}

.breadcrumb {
  display: none; /* 移动端隐藏面包屑 */
}

@media (min-width: 768px) {
  .breadcrumb {
    display: block;
    margin-left: 8px;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon-btn {
  color: #64748b;
  padding: 8px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.user-profile:hover {
  background-color: #f1f5f9;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.logout-text {
  color: var(--el-color-danger);
}

/* 页面切换动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.page-main {
  padding: 0;
  background-color: #f8fafc;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

:deep(.el-main) {
  --el-main-padding: 0;
}
</style>
