import { createRouter, createWebHistory } from 'vue-router'
import MainWorkbenchView from '@/views/MainWorkbenchView.vue'
import DataFusionView from '@/views/DataFusionView.vue'
import AnalyticsStudioView from '@/views/AnalyticsStudioView.vue'
import OntologyExplorerView from '@/views/OntologyExplorerView.vue'

const routes = [
  {
    path: '/',
    redirect: '/workbench'
  },
  {
    path: '/workbench',
    name: 'Workbench',
    component: MainWorkbenchView
  },
  {
    path: '/fusion',
    name: 'Fusion',
    component: DataFusionView
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: AnalyticsStudioView
  },
  {
    path: '/ontology',
    name: 'Ontology',
    component: OntologyExplorerView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
