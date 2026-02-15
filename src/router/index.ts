import { createRouter, createWebHistory } from 'vue-router'
import nProgress from 'nprogress'
import { useUserStore } from '@/store/user'
import 'nprogress/nprogress.css'

// 配置 nprogress
nProgress.configure({ 
  showSpinner: false,
  easing: 'ease',
  speed: 500
})

const routes = [
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
        meta: { title: '文章管理', role: 'TENANT_ADMIN' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/categories/index.vue'),
        meta: { title: '分类标签', role: 'TENANT_ADMIN' }
      },
      {
        path: 'comments',
        name: 'Comments',
        component: () => import('@/views/comments/index.vue'),
        meta: { title: '评论管理', role: 'TENANT_ADMIN' }
      },
      {
        path: 'articles/edit/:id',
        name: 'ArticleEdit',
        component: () => import('@/views/articles/edit.vue'),
        meta: { title: '编辑文章', role: 'TENANT_ADMIN' }
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
        meta: { title: '媒体中心', role: 'TENANT_ADMIN' }
      },
      { path: 'users', name: 'Users', component: () => import('@/views/users/index.vue'), meta: { title: '成员管理', role: 'TENANT_ADMIN' } },
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
