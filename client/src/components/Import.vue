<script setup lang="ts">

import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import router from '../router';
import axios from "axios";


const text = ref('');
// const showForm = ref(false);

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
        disabled: true,
    },
    {
        value: 'xml',
        label: 'XML',
        disabled: true,
    },
];

const startProcessing = async () => {
    // .trim()
    // const response = await axios.get("https://raw.githubusercontent.com/dracor-org/greekdracor/main/tei/aristophanes-frogs.xml");
    // console.log(response);
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
            <n-button icon-placement="left" type="primary">Start</n-button>
        </template>
        <n-space vertical size="large">
            <n-input maxlength="30" clearable placeholder="Insert URL here..." />
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
                v-model:value="text"
                type="textarea"
                clearable
                :autosize="{
                    minRows: 3
                }"
                placeholder="Insert text here..."
            />
        </n-space>
    </n-card>
</template>

<style scoped>
</style>
