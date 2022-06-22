<script setup lang="ts">

import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
// import router from '../router';
import axios, { AxiosError } from "axios";
import type { SelectOption } from 'naive-ui';
import { FormInst, useMessage } from 'naive-ui'

const formRef = ref<FormInst | null>(null);
const message = useMessage();
const languages = reactive([] as Array<SelectOption>);
const form = reactive({ text: '', link: '', lang: null, src: 'text', format: 'plain', });
const rules = {
    lang: {
        required: true,
        trigger: ['blur', 'change'],
        message: 'Please select a language',
    }
};

const formats = [
    {
        value: 'plain',
        label: 'Plain Text',
        disabled: false,
    },
    {
        value: "rich",
        label: "Rich Text / HTML",
        disabled: true,
    },
    {
        value: 'xml',
        label: 'Custom',
        disabled: true,
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

const startProcessing = async (e: MouseEvent) => {
    e.preventDefault();
    // console.log("form", form);
    try {
        await formRef.value?.validate(async (errors) => {
            if (!errors) {
                // message.success('Valid');
                if (form.src === "text") {
                    console.log("send raw text");
                    const data = await store.post('load', form);
                    console.log(data);
                } else { // if URL
                    const url = form.link.trim();
                    console.log(`URL [${url}]`);
                    try {
                        if (url) {
                            // https://raw.githubusercontent.com/dracor-org/greekdracor/main/tei/aristophanes-frogs.xml
                            const response = await axios.get(url);
                            console.log(response);
                        }
                    } catch (error) {
                        if (axios.isAxiosError(error)) {
                            // : unknown | Error | AxiosError
                            message.error(`URL fetch error. ${error?.message}`, { duration: 5000 });
                        }
                        console.log(error);
                    }
                }
            } else {
                console.log(errors)
                message.error('Not all required fields are filled!');
            }
        });
    } catch (error) {
        console.log("fail");
    }
};

const getFile = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    // console.log(e, file);
    if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        reader.readAsText(file, "UTF-8");

        reader.onload = evt => {
            const buf = evt?.target?.result;
            if (buf) {
                form.text = (typeof buf === 'string' ? buf : Buffer.from(buf).toString());
            }
        }

        reader.onerror = evt => { console.error(evt) }
    } else {
        console.log("file format issue");
    }
};

onBeforeMount(async () => {
    const data = await store.get('languages');
    Object.assign(languages, data.map((x: any) => ({ label: x.name, value: x.code })));
    // console.log("data", data);
});

</script>

<template>
    <n-card title="Importing Text" :bordered="false" class="minimal left">
        <template #header-extra>
            <n-button icon-placement="left" type="primary" @click="startProcessing">Run</n-button>
        </template>
        <n-form ref="formRef" :label-width="80" :model="form" :rules="rules" size="small">
            <n-form-item style="display:block;">
                <n-radio-group v-model:value="form.format" name="radiogroup">
                    <n-radio
                        v-for="item in formats"
                        :key="item.value"
                        :value="item.value"
                        :label="item.label"
                        :disabled="item.disabled"
                    />
                </n-radio-group>
            </n-form-item>

            <n-space justify="space-between">
                <n-form-item style="display:block;">
                    <n-radio-group v-model:value="form.src" name="radiogroup">
                        <n-radio
                            v-for="item in sources"
                            :key="item.value"
                            :value="item.value"
                            :label="item.label"
                            :disabled="item.disabled"
                        />
                    </n-radio-group>
                </n-form-item>
                <n-form-item path="lang" style="display:block;">
                    <n-select
                        v-model:value="form.lang"
                        filterable
                        placeholder="Please select a language of a text"
                        :options="languages"
                    />
                </n-form-item>
            </n-space>

            <div style="margin:0px 0px 15px 0px" v-if="form.src === 'text'">
                <label for="userfile" style="padding-right: 5px">Choose text file to load</label>
                <input id="userfile" name="userfile" type="file" @change="getFile" />
            </div>

            <n-input
                v-model:value="form.link"
                clearable
                spellcheck="false"
                placeholder="Insert URL here..."
                v-if="form.src === 'url'"
            />

            <n-input
                v-model:value="form.text"
                type="textarea"
                clearable
                :autosize="{
                    minRows: 3
                }"
                placeholder="Insert text here..."
                v-if="form.src === 'text'"
            />
        </n-form>
    </n-card>
</template>

<style scoped>
</style>
