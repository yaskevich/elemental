<script setup lang="ts">

import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import router from '../router';
import axios, { AxiosError } from "axios";
import { useMessage } from 'naive-ui';

const message = useMessage();
const text = ref('');
const link = ref('');

const sourceMode = ref('text');
const importMode = ref('rich');

const items = [
    {
        value: "rich",
        label: "Rich Text / HTML",
        disabled: false,
    },
    {
        value: 'plain',
        label: 'Plain Text',
        disabled: false,
    },
    {
        value: 'xml',
        label: 'XML',
        disabled: false,
    },
];

const sources = [
    {
        value: "text",
        label: "Text Input",
        disabled: false,
    },
    {
        value: 'url',
        label: 'URL',
        disabled: false,
    }
];

const startProcessing = async () => {
    // .trim()
    if (sourceMode.value === "text") {

    } else { // if URL
        const url = link.value.trim();
        console.log(`URL [${url}]`);
        try {
            // https://raw.githubusercontent.com/dracor-org/greekdracor/main/tei/aristophanes-frogs.xml
            const response = await axios.get(url);
            console.log(response);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // : unknown | Error | AxiosError
                message.error(`URL fetch error. ${error?.message}`, { duration: 5000 });
            }
            console.log(error);
        }
    }

};

onBeforeMount(async () => {
    //   const data = await store.get('texts');
    //   Object.assign(texts, data);
    //   isLoaded.value = true;
    // console.log("data", data);
});


</script>

<template>
    <n-card title="Importing Text" :bordered="false" class="minimal left">
        <template #header-extra>
            <n-button icon-placement="left" type="primary" @click="startProcessing">Start</n-button>
        </template>
        <n-space vertical size="large">
            <n-radio-group v-model:value="sourceMode" name="radiogroup">
                <n-space>
                    <n-radio
                        v-for="item in sources"
                        :key="item.value"
                        :value="item.value"
                        :label="item.label"
                        :disabled="item.disabled"
                    />
                </n-space>
            </n-radio-group>
            <n-radio-group v-model:value="importMode" name="radiogroup">
                <n-space>
                    <n-radio
                        v-for="item in items"
                        :key="item.value"
                        :value="item.value"
                        :label="item.label"
                        :disabled="item.disabled"
                    />
                </n-space>
            </n-radio-group>
            <n-input
                v-model:value="link"
                clearable
                spellcheck="false"
                placeholder="Insert URL here..."
                v-if="sourceMode === 'url'"
            />

            <n-input
                v-model:value="text"
                type="textarea"
                clearable
                :autosize="{
                    minRows: 3
                }"
                placeholder="Insert text here..."
                v-if="sourceMode === 'text'"
            />
        </n-space>
    </n-card>
</template>

<style scoped>
</style>
