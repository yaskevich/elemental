<template>
  <div class="center-column">
    <h3>Registration</h3>
    <div class="left-column">
      <n-form
        :label-width="80"
        :model="formValue"
        :rules="rules"
        :size="size"
        ref="formRef"
        v-if="showForm"
      >
        <n-form-item label="Username (nick). English letters only" path="user.username">
          <n-input v-model:value="formValue.user.username" placeholder="Input username" />
        </n-form-item>

        <n-form-item label="E-mail" path="user.email">
          <n-input v-model:value="formValue.user.email" placeholder="Input e-mail" />
        </n-form-item>

        <n-form-item label="First name" path="user.firstname">
          <n-input v-model:value="formValue.user.firstname" placeholder="Input firstname" />
        </n-form-item>
        <n-form-item label="Last name" path="user.lastname">
          <n-input v-model:value="formValue.user.lastname" placeholder="Input lastname" />
        </n-form-item>

        <n-form-item label="Grammatical gender" path="user.sex">
          <n-select
            placeholder="Choose gender"
            :options="generalOptions"
            v-model:value="formValue.user.sex"
          />
        </n-form-item>

        <n-form-item>
          <n-button @click="handleValidateClick">Submit</n-button>
        </n-form-item>
      </n-form>
      <div v-if="note" class="center-column" style="padding-bottom: 2rem;max-width:300px;">
        <p>
          After the administartor activates your account, you will be able to login with the e-mail
          <em>{{ formValue.user.email }}</em> and this password:
        </p>
        <div style="font-family: monospace;font-size:2rem;">{{ note }}</div>
        <p>Copy the password and store it securely.</p>
        <!-- <div>
          Copy password and go to
          <router-link to="/login">login page</router-link>.
        </div>-->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import store from '../store';
import { ref, reactive, onBeforeMount } from 'vue';
import { FormInst } from 'naive-ui';

const formRef = ref<FormInst | null>(null);
const note = ref('');
const showForm = ref(true);
const formValue = ref({
  user: {
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    sex: undefined,
  },
});

const generalOptions = ['female', 'male'].map((v, i) => ({
  label: v,
  value: ++i,
}));

const size = ref('medium');

const rules = {
  user: {
    username: {
      required: true,
      message: 'Please input your username',
      trigger: 'blur',
    },
    firstname: {
      required: true,
      message: 'Please input your firstname',
      trigger: 'blur',
    },
    lastname: {
      required: true,
      message: 'Please input your lastname',
      trigger: 'blur',
    },
    sex: {
      type: 'number',
      required: true,
      message: 'Please input your gender',
      trigger: ['blur', 'change'],
    },
    email: {
      type: 'email',
      required: true,
      message: 'Please input your e-mail',
      trigger: 'blur',
    },
  },
};

const handleValidateClick = (e: MouseEvent) => {
  e.preventDefault();
  formValue.value.user.username = formValue.value.user.username.replace(/[^\x41-\x7F]/g, '');
  if (formRef!.value) {
    formRef.value.validate(async (errors: any) => {
      if (!errors) {
        // console.log(formValue.value);
        const result = await store.postUnauthorized('user/reg', formValue.value.user);
        const pwd = result?.data?.message;
        // console.log(pwd);
        note.value = pwd;
        showForm.value = false;
      } else {
        console.log(errors);
      }
    });
  }
};

</script>
