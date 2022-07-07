<template>
    <n-card title="Users" :bordered="false" class="minimal left" v-if="isLoaded">
        <template #header-extra>
            <n-button type="primary" @click="editUser">+ new</n-button>
        </template>

        <!-- <n-input-group
            style="display:block;max-width:300px;text-align:center;margin: 0 auto"
            v-if="showForm"
        >
            <n-space vertical>
                <n-input v-model:value="newUser.en" type="text" placeholder="English title" />
                <n-input v-model:value="newUser.ru" type="text" placeholder="Russian title" />

                <n-space justify="center">
                    <n-button tertiary type="warning" @click="showForm = false;">Cancel</n-button>
                    <n-button type="info" @click="editUser(newUser)">Save</n-button>
                </n-space>
            </n-space>
            <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
        </n-input-group> -->

        <n-space vertical size="large">
            <n-grid x-gap="12" cols="3" responsive="screen" v-for="item in users" :key="item.id">
                <n-gi>
                    <n-tag type="success">
                        {{ item.firstname }} {{ item.lastname }}
                        <template #icon>
                            <n-icon :component="CheckCircleRound" v-if="item.privs > 1"/>
                            <n-icon :component="SecurityFilled" v-else/>
                        </template>
                    </n-tag>
                </n-gi>
                <n-gi></n-gi>
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
import { ref, reactive, onBeforeMount } from 'vue';
import { CheckCircleRound, SecurityFilled, } from '@vicons/material';

interface IUser {
    id?: number,
    username: string,
    firstname: string,
    lastname: string,
    email: string,
    privs: number,
};

const newUser = reactive({});
const users: Array<IUser> = reactive([] as Array<IUser>);
const showForm = ref(false);
const isLoaded = ref(false);

onBeforeMount(async () => {
    const data = await store.get('users');
    Object.assign(users, data);
    console.log('data from server', data);
    isLoaded.value = true;
});

const editUser = async (user: IUser) => {
    console.log('edit User', user);
    const params: IUser = {} as IUser;
    if (user?.id) {
        params.id = user.id;
    }
    //   params.en = user.en;
    //   params.ru = user.ru;
    //   const result = await store.post('User', params);
    //   if (result?.data?.id) {
    //     params.id = result.data.id;
    //     if (!user?.id) {
    //       users.push(params);
    //       newUser.en = newUser.ru = '';
    //     }
    //   } else {
    //     console.log('error', result);
    //   }
};

</script>

<style scoped>
</style>
