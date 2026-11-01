import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import nProgress from 'nprogress'
import { useUserStore } from '@/store/user'
import type { Role } from '@/api/types'
import 'nprogress/nprogress.css'

// 让 vue-router 的 meta.role 获得精确类型（而非 unknown）
declare module 'vue-router' {
  interface RouteMeta {
    /** 访问该页面所需的最低角色；缺省表示所有已登录角色可见 */
    role?: Role
  }
}

// 配置 nprogress
nProgress.configure({ 
  showSpinner: false,
  easing: 'ease',
  speed: 500
})

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '控制台' }
      },
      {
        path: 'tenants',
        name: 'Tenants',
        component: () => import('@/views/tenants/index.vue'),
        meta: { title: '租户管理', role: 'SUPER_ADMIN' }
      },
      {
        path: 'packages',
        name: 'Packages',
        component: () => import('@/views/packages/index.vue'),
        meta: { title: '套餐管理', role: 'SUPER_ADMIN' }
      },
      {
        path: 'articles',
        name: 'Articles',
        component: () => import('@/views/articles/index.vue'),
        meta: { title: '文章管理', role: 'EDITOR' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/categories/index.vue'),
        meta: { title: '分类标签', role: 'EDITOR' }
      },
      {
        path: 'comments',
        name: 'Comments',
        component: () => import('@/views/comments/index.vue'),
        meta: { title: '评论管理', role: 'EDITOR' }
      },
      {
        path: 'articles/edit/:id',
        name: 'ArticleEdit',
        component: () => import('@/views/articles/edit.vue'),
        meta: { title: '编辑文章', role: 'EDITOR' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '系统设置', role: 'TENANT_ADMIN' }
      },
      {
        path: 'media',
        name: 'Media',
        component: () => import('@/views/media/index.vue'),
        meta: { title: '媒体中心', role: 'EDITOR' }
      },
      { path: 'users', name: 'Users', component: () => import('@/views/users/index.vue'), meta: { title: '成员管理', role: 'TENANT_ADMIN' } },
      { path: '403', name: 'NoPermission', component: () => import('@/views/NoPermission.vue'), meta: { title: '无权限' } },
      { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人中心' } }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 角色等级：数值越大权限越高（SUPER_ADMIN(4) > TENANT_ADMIN(3) > EDITOR(2) > VIEWER(1)）
const ROLE_LEVELS = {
  SUPER_ADMIN: 4,
  TENANT_ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1
} as const

/** 查角色等级；后端返回未知角色名时按 VIEWER（最低）处理，宁严勿松 */
function roleLevel(role: string): number {
  switch (role) {
    case 'SUPER_ADMIN': return ROLE_LEVELS.SUPER_ADMIN
    case 'TENANT_ADMIN': return ROLE_LEVELS.TENANT_ADMIN
    case 'EDITOR': return ROLE_LEVELS.EDITOR
    default: return ROLE_LEVELS.VIEWER
  }
}

// 路由守卫
router.beforeEach((to, from, next) => {
  nProgress.start()
  const userStore = useUserStore()
  const token = userStore.accessToken || localStorage.getItem('access_token')

  // 1. 未登录处理
  if (to.path !== '/login' && !token) {
    next('/login')
    return
  }

  // 2. 已登录但访问登录页
  if (to.path === '/login' && token) {
    next('/')
    return
  }

  // 3. 页面级角色校验：当前角色低于路由要求时引导到 403 页
  //    （/403 本身无 role 要求，天然不会形成重定向循环）
  //    调用两侧均非空：to.meta.role 被 if 收窄，userStore.role 在 getter 中兜底 'VIEWER'
  if (to.meta.role) {
    const requiredLevel = roleLevel(to.meta.role)
    const currentLevel = roleLevel(userStore.role)
    if (currentLevel < requiredLevel) {
      next('/403')
      return
    }
  }

  next()
})

router.afterEach((to) => {
  nProgress.done()
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - FreeCity CMS`
  }
})

export default router
