import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import {
  // create naive ui
  create,
  // component
  NButton,
  NText,
  NInput,
  NSwitch
} from 'naive-ui'

const naive = create({
  components: [NButton, NText, NInput, NSwitch, ]
})

createApp(App)
  .use(naive)
  .use(router)
  .mount('#app')
