import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from '@/App.vue'
import router from '@/router'
import '@/assets/styles/main.scss'
import { bootstrapWorkspace } from '@/bootstrap'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

bootstrapWorkspace()
  .catch(() => undefined)
  .finally(() => {
    app.mount('#app')
  })
