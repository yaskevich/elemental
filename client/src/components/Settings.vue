<template>
  <n-card title="Settings" :bordered="false" style="max-width: 300px" class="minimal left">
    <template #header-extra>
      <n-button
        icon-placement="left"
        type="primary"
        @click="saveSettings"
        :disabled="!model.imgsizelimit || !model.txtsizelimit"
        >Save</n-button
      >
    </template>
    <n-form ref="formRef" label-placement="top" :model="model" :rules="rules">
      <n-form-item label="Text size limit (Mb)" path="txtlimit">
        <!-- @update:value="getInput" -->
        <n-input-number :min="1" v-model:value="model.txtsizelimit" />
      </n-form-item>
      <n-form-item label="Image size limit (Mb)" path="imglimit">
        <n-input-number :min="1" v-model:value="model.imgsizelimit" />
      </n-form-item>
      <n-alert title="Upload limits" type="warning">
        Changing those parameters requires server restart. It should be done by server adminstrator externally</n-alert
      >
      <n-divider></n-divider>
      <n-form-item label="Registration status">
        <n-switch v-model:value="model.registration_open">
          <template #checked> Open </template>
          <template #unchecked> Closed </template>
        </n-switch>
      </n-form-item>
    </n-form>
    <n-form-item label="Registration code">
      <n-input
        v-model:value="model.registration_code"
        type="text"
        placeholder="...some unique string..."
        :disabled="!model.registration_open"
        autofocus
        clearable></n-input>
    </n-form-item>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import { FormInst, FormItemRule, useMessage } from 'naive-ui';
import store from '../store';

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const model = reactive({ imgsizelimit: 1, txtsizelimit: 1, registration_open: false, registration_code: '' });

const rules = {
  //   imglimit: {
  //     type: 'number',
  //     required: true,
  //     trigger: ['blur', 'input'],
  //     message: 'Please put a number',
  //   },
  //   txtlimit: {
  //     type: 'number',
  //     required: true,
  //     trigger: ['blur', 'input'],
  //     message: 'Please put a number',
  //   },
};

const saveSettings = async () => {
  const { data } = await store.post('settings', { ...model });
  //   console.log('result', data);
  if (data === 1) {
    message.success('Settings were updated successfully');
  }
};

onBeforeMount(async () => {
  const results = await store.get('settings');
  //   console.log(results);
  Object.assign(model, results);
});
</script>
