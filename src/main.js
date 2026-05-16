import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueApexCharts from 'vue3-apexcharts'

import App from './App.vue'
import router from './router'
import '@/assets/styles/tokens.css'
import '@/assets/styles/theme-admin.css'
import '@/assets/styles/theme-resident.css'
import '@/assets/styles/base.css'
import '@/assets/styles/utilities.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueApexCharts)

app.mount('#app')
