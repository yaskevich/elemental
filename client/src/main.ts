import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import {
  // create naive ui
  create,
  // component
  NButton
} from 'naive-ui'

const naive = create({
  components: [NButton]
})

createApp(App)
  .use(naive)
  .use(router)
  .mount('#app')
