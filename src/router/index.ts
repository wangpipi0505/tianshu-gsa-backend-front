import { createRouter, createWebHistory } from 'vue-router'
import { useIdentityStore } from '@/stores/identityStore'

const routes = [
  {
    path: '/',
    redirect: '/workbench'
  },
  {
    path: '/workbench',
    name: 'Workbench',
    component: () => import('@/views/MainWorkbenchView.vue')
  },
  {
    path: '/fusion',
    name: 'Fusion',
    component: () => import('@/views/DataFusionView.vue')
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/AnalyticsStudioView.vue')
  },
  {
    path: '/ontology',
    name: 'Ontology',
    component: () => import('@/views/OntologyExplorerView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.path !== '/fusion') return true
  const identity = useIdentityStore()
  if (identity.canDo('fusion')) return true
  identity.writeAudit('访问融合页', '未授权，已拦截')
  return '/workbench'
})

export default router
