<template>
  <div class="center-column">
    <h3>Login</h3>
    <div class="left-column">
      <n-form :label-width="80" :model="formValue" ref="formRef">
        <n-form-item label="E-mail">
          <n-input v-model:value="formValue.email" placeholder="Input e-mail" />
        </n-form-item>

        <n-form-item path="password" label="Password">
          <n-input v-model:value="formValue.password" type="password" @keydown.enter.prevent autocomplete="on" show-password-on="click"/>
        </n-form-item>

        <n-form-item>
          <n-button @click="handleValidateClick">Submit</n-button>
        </n-form-item>
      </n-form>
      <!-- <n-space vertical> -->
      <n-alert v-if="error?.error" title="Access denied" type="error">Reason: {{ error.error }}</n-alert>
      <!-- <n-alert title="New user" type="info">If you do not have an account, please, register.</n-alert> -->
      <!-- </n-space> -->
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, reactive } from 'vue';
import router from '../router';
import store from '../store';

const formRef = ref(null);
const formValue = reactive({ email: '', password: '' });
const error = reactive({} as any);

const handleValidateClick = async (e: MouseEvent) => {
  e.preventDefault();
  if (formValue.email && formValue.password) {
    // console.log(formValue);
    const { data } = await store.postUnauthorized('user/login', formValue);
    // console.log("login result", data);
    if (data?.error) {
      console.error("error", data)
      Object.assign(error, data);
    } else {
      store.state.token = data.token;
      localStorage.setItem('token', data.token);
      store.state.user = { ...store.state.user, ...data };
      router.push('/')
    }
  }

  // const result = await store.post('user/login', formValue.value.user);
  // message.success('Valid');
  // message.error('Invalid');
};

</script>
