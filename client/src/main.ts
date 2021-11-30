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
} from 'naive-ui'

const naive = create({
  components: [NButton, NText, NInput, NSwitch, NDivider, NAvatar, NIcon, NSpace, NInputGroup,NDynamicTags, NColorPicker, NMessageProvider, NForm, NFormItem, NRadioGroup, NRadio, NSelect, NDropdown, NTag, ]
})

createApp(App)
  .use(naive)
  .use(router)
  .mount('#app')
