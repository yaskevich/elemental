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
  NSwitch,
  NDivider,
  NAvatar,
  NIcon,
  NSpace,
  NInputGroup,
  NDynamicTags,
  NTag,
  NColorPicker,
  NMessageProvider,
  NForm,
  NFormItem,
  NRadioGroup,
  NRadio,
  NSelect,
  NDropdown,
  NSpin,
  NDataTable,
} from 'naive-ui'

const naive = create({
  components: [NButton, NText, NInput, NSwitch, NDivider, NAvatar, NIcon, NSpace, NInputGroup,NDynamicTags, NColorPicker, NMessageProvider, NForm, NFormItem, NRadioGroup, NRadio, NSelect, NDropdown, NTag, NSpin, NDataTable,]
})

createApp(App)
  .use(naive)
  .use(router)
  .mount('#app')
