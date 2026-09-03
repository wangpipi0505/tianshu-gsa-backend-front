import { createRouter, createWebHistory } from 'vue-router'

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

export default router
