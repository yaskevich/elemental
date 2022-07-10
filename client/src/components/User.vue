<template>
    <n-card title="User" :bordered="false" class="minimal left">
        <n-form ref="formRef" :label-width="80" :model="user" :rules="rules">
            <n-form-item label="Username" path="username">
                <n-input v-model:value="user.username" />
            </n-form-item>
            <n-form-item label="E-mail" path="email">
                <n-input v-model:value="user.email" placeholder="test@mail.com" />
            </n-form-item>

            <n-form-item label="First Name" path="firstname">
                <n-input v-model:value="user.firstname" />
            </n-form-item>
            <n-form-item label="Last Name" path="lastname">
                <n-input v-model:value="user.lastname" />
            </n-form-item>
            <n-space>
                <n-button v-if="!user.activated" type="error">Activate</n-button>
                <n-button v-if="user.activated && user.privs > 1" type="warning">Make administrator</n-button>
            </n-space>
        </n-form>
    </n-card>
</template>

<script setup lang="ts">

import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import router from '../router';
import { useRoute } from 'vue-router';
import { FormInst, FormItemRule, FormValidationError, } from 'naive-ui'
const vuerouter = useRoute();
const id = ref(String(vuerouter.params.id));

interface IUser {
    id?: number,
    username: string,
    firstname: string,
    lastname: string,
    email: string,
    privs: number,
    activated: boolean,
};
const user = reactive({} as IUser);
const rules = {
    author: {
        required: true,
        message: "Author's name cannot be empty",
        trigger: 'blur',
    },
    title: {
        required: true,
        message: 'Text title cannot be empty',
        trigger: 'blur',
    },
};

onBeforeMount(async () => {
    console.log(id.value);
    if (id.value) {
        const data = await store.get('users', id.value);
        console.log('user', data?.[0]);
        Object.assign(user, data.shift());
    } else {
        console.log("add new");
    }
});

</script>