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
                    <n-button type="info" size="small" @click="editUser(item)">Manage</n-button>
                </n-gi>
            </n-grid>
        </n-space>
    </n-card>
</template>

<script setup lang="ts">

import store from '../store';
import router from '../router';
import { ref, reactive, onBeforeMount, h } from 'vue';
import { CheckCircleRound, SecurityFilled, RadioButtonUncheckedFilled, } from '@vicons/material';
import { NAlert, useMessage } from 'naive-ui'
import type { MessageRenderMessage } from 'naive-ui'

const renderMessage: MessageRenderMessage = (props) => {
    const { type } = props
    return h(
        NAlert,
        {
            closable: props.closable,
            onClose: props.onClose,
            type: type === 'loading' ? 'default' : type,
            title: 'Registration procedure',
            style: {
                boxShadow: 'var(--n-box-shadow)',
                maxWidth: '250px',
            }
        },
        {
            default: () => props.content
        }
    )
}

interface IUser {
    id?: number,
    username: string,
    firstname: string,
    lastname: string,
    email: string,
    privs: number,
    activated: boolean,
};

const message = useMessage();
const users: Array<IUser> = reactive([] as Array<IUser>);
const isLoaded = ref(false);

onBeforeMount(async () => {
    const data = await store.get('users');
    Object.assign(users, data);
    // console.log('data from server', data);
    isLoaded.value = true;
});

const editUser = async (user: IUser) => {
    if (user?.id) {
        router.push(`/user/${user.id || ''}`);
    } else {
        message.info(`New users register by themselves. After that, the administrators will be able to activate new accounts.`, {
            render: renderMessage,
            closable: true,
            duration: 10000,
        })
    }

};

</script>
