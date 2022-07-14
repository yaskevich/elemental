<template>
    <n-card
        :title="user?.id ? `${user.firstname} ${user.lastname}` : 'User'"
        :bordered="false"
        class="minimal left"
        v-if="isLoaded"
    >
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
            <n-space v-if="store?.state?.user?.privs === 1">
                <template v-if="user.activated">
                    <n-alert
                        v-if="String(store?.state?.user?.id) === id"
                        title="Disabling your own account is not allowed"
                        type="warning"
                    >Ask other administrators to deactivate your account if you do not need it anymore</n-alert>
                    <n-button type="error" @click="changeActivationStatus(false)">Deactivate</n-button>
                    <n-button
                        v-if="user.activated && user.privs > 1"
                        type="warning"
                        @click="requestElevation"
                    >Make administrator</n-button>
                </template>
                <template v-else>
                    <n-button type="error" @click="changeActivationStatus(true)">Activate</n-button>
                </template>
            </n-space>
        </n-form>
    </n-card>
</template>

<script setup lang="ts">

import { ref, reactive, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
import { FormInst, FormItemRule, FormValidationError, } from 'naive-ui';
import store from '../store';

interface IUser {
    id?: number,
    username: string,
    firstname: string,
    lastname: string,
    email: string,
    privs: number,
    activated: boolean,
};

const formRef = ref<FormInst | null>(null);
const vuerouter = useRoute();
const id = ref(String(vuerouter.params.id));

const changeActivationStatus = async (status: boolean) => {
    const { data } = await store.post('user/activate', { id: id.value, status: status });
    console.log("activation status", status, data);
    if (data?.id) {
        user.activated = status;
    }
};

const requestElevation = async () => {
    const { data } = await store.post('user/elevate', { id: id.value });
    console.log("elevated", data);
    if (data?.id) {
        user.privs = 1;
    }
};

const isLoaded = ref(false);
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
    if (id.value) {
        const data = await store.get('users', id.value);
        // console.log('user', data?.[0]);
        Object.assign(user, data.shift());
    } else {
        console.log("add new");
    }
    isLoaded.value = true;
});

</script>
