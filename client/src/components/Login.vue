<template>

  <div class="center-column">
    <div class="left-column">

      <n-form :label-width="80"
              :model="formValue"
              ref="formRef">

        <n-form-item label="E-mail">
          <n-input v-model:value="formValue.email" placeholder="Input e-mail" />
        </n-form-item>

        <n-form-item path="password" label="Password">
          <n-input v-model:value="formValue.password"
                   type="password"
                   @keydown.enter.prevent />
        </n-form-item>

        <n-form-item>
          <n-button @click="handleValidateClick">Submit</n-button>
        </n-form-item>

      </n-form>

    </div>
  </div>

</template>

<script setup lang="ts">

  import { ref, reactive } from 'vue';
  import store from '../store';

  const formRef = ref(null);
  const formValue = reactive({ email: '', password: '' });

  const handleValidateClick = async(e: MouseEvent) => {
    e.preventDefault();
    if (formValue.email && formValue.password) {
      console.log(formValue);
      const result = await store.postUnauthorized('user/login', formValue);
      console.log(result);
      store.state.token = result.data.token;
      localStorage.setItem('token', result.data.token);
      store.state.user = { ...store.state.user, ...result.data };
    }

    // const result = await store.post('user/login', formValue.value.user);
    // message.success('Valid');
    // message.error('Invalid');
  };

</script>
