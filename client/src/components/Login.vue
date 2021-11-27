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

<script>

  import { defineComponent, ref, reactive } from 'vue';
  import { useMessage } from 'naive-ui';
  import store from '../store';

  export default defineComponent({
    setup() {
      const formRef = ref(null);
      const message = useMessage();
      const formValue = reactive({email: '', password: '', });

      return {
        formRef,
        formValue,
        async handleValidateClick(e) {
          e.preventDefault();
          if (formValue.email  && formValue.password) {
              console.log(formValue);
              const result = await store.post('user/login', formValue);
              console.log(result);
              store.state.token = result.data.token;
              localStorage.setItem('token', result.data.token);
              store.state.user = {...store.state.user, ...result.data};
          }

          // const result = await store.post('user/login', formValue.value.user);
              // message.success('Valid');
              // message.error('Invalid');
        },
      };
    },
  });

</script>
