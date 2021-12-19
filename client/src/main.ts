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
  NDescriptions,
  NDescriptionsItem,
  NInputNumber,
  NDrawer,
  NDrawerContent,
  NAutoComplete,
  NModal,
  NCheckbox,
  NCheckboxGroup,
  NTooltip,
  NPopconfirm,
} from 'naive-ui'

const naive = create({
  components: [NButton, NText, NInput, NSwitch, NDivider, NAvatar, NIcon, NSpace, NInputGroup, NColorPicker, NMessageProvider, NForm, NFormItem, NRadioGroup, NRadio, NSelect, NDropdown, NTag, NSpin, NDataTable, NDescriptions, NDescriptionsItem, NInputNumber, NDrawer, NDrawerContent, NAutoComplete, NModal, NCheckbox, NCheckboxGroup, NTooltip, NPopconfirm,]
})

createApp(App)
  .use(naive)
  .use(router)
  .mount('#app')
