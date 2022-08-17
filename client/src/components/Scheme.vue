<template>
    <n-card title="Scheme" :bordered="false" class="minimal left">
        <template #header-extra></template>
        <div>
            {{text?.author}}. {{text?.title}} 
        </div>
        <template v-for="item in scheme" :key="item.id">
            <p v-if="item.type === 'line'" class="line">{{ item.title }} {{ item.type }}</p>
            <div v-if="item.type === 'rich'">{{ item.title }} {{ item.type }}</div>
        </template>
    </n-card>
</template>

<script setup lang="ts">
import store from '../store';
import { ref, reactive, onBeforeMount, computed, unref, h, } from 'vue';
import router from '../router';
import { RouterLink, useRoute } from 'vue-router';
import type { SelectOption, FormInst, FormItemRule, } from 'naive-ui';
const text = store?.state?.user?.text;
const scheme = text?.scheme || [];

const formRef = ref<FormInst | null>(null);


</script>