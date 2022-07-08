<template>
    <n-card title="Users" :bordered="false" class="minimal left" v-if="isLoaded">
        <template #header-extra>
            <n-button type="primary" @click="editUser">+ new</n-button>
        </template>
        <n-space vertical size="large">
            <n-grid x-gap="12" cols="2" responsive="screen" v-for="item in users" :key="item.id">
                <n-gi>
                    <n-tag :type="item.activated ? 'success' : 'warning'">
                        {{ item.firstname }} {{ item.lastname }}
                        <template #icon>
                            <n-icon
                                :component="item.activated ? item.privs > 1 ? CheckCircleRound : SecurityFilled : RadioButtonUncheckedFilled"
                            />
                        </template>
                    </n-tag>
                </n-gi>
                <n-gi style="text-align:right;">
                    <!-- <n-button type="error" @click="editUser(item)">Deactivate</n-button> -->
                    <n-button type="info" size="small" @click="editUser(item)">Edit</n-button>
                </n-gi>
            </n-grid>
        </n-space>
    </n-card>
</template>

<script setup lang="ts">

import store from '../store';
import router from '../router';
import { ref, reactive, onBeforeMount } from 'vue';
import { CheckCircleRound, SecurityFilled, RadioButtonUncheckedFilled, } from '@vicons/material';

interface IUser {
    id?: number,
    username: string,
    firstname: string,
    lastname: string,
    email: string,
    privs: number,
    activated: boolean,
};

const users: Array<IUser> = reactive([] as Array<IUser>);
const isLoaded = ref(false);

onBeforeMount(async () => {
    const data = await store.get('users');
    Object.assign(users, data);
    // console.log('data from server', data);
    isLoaded.value = true;
});

const editUser = async (user: IUser) => {
    router.push(`/user/${user.id || ''}`);
};

</script>
