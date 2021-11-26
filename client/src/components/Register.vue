<template>

  <div class="center-column">
    <h3>Registration</h3>
    <div class="left-column">

      <n-form :label-width="80"
              :model="formValue"
              :rules="rules"
              :size="size"
              ref="formRef">

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

    </div>
  </div>

</template>

<script>

  import { defineComponent, ref } from 'vue';
  import { useMessage } from 'naive-ui';

  export default defineComponent({
    setup() {
      const formRef = ref(null);
      const message = useMessage();
      const formValue = ref({
        user: {
          username: '',
          firstname: '',
          lastname: '',
          email: '',
          sex: undefined,
        },
      });

      return {
        generalOptions: ['female', 'male'].map(
          (v, i) => ({
            label: v,
            value: ++i
          })
        ),
        formRef,
        size: ref('medium'),
        formValue,
        rules: {
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
        },
        handleValidateClick(e) {
          e.preventDefault();
          formValue.value.user.username = formValue.value.user.username.replace(/[^\x41-\x7F]/g, "");
          formRef.value.validate(errors => {
            if (!errors) {
              // message.success('Valid');
              console.log(formValue.value.user);
            } else {
              console.log(errors);
              // message.error('Invalid');
            }
          });
        },
      };
    },
  });

</script>
