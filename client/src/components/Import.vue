<template>
    <div v-if="id">
        <n-card title="Importing Text" :bordered="false" class="minimal left" v-if="isLoaded">
            <template #header-extra>
                <n-spin v-if="isProcessing" />
                <n-space v-else>
                    <n-button
                        icon-placement="left"
                        type="primary"
                        @click="startProcessing($event, true)"
                    >Test</n-button>
                    <n-button
                        icon-placement="left"
                        type="error"
                        @click="startProcessing($event, false)"
                    >Run</n-button>
                </n-space>
            </template>
            <n-h4>{{ textInfo?.author }}. {{ textInfo?.title }}</n-h4>
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
                </n-space>

                <div v-if="form.src === 'text'">
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

                <n-form-item path="text">
                    <n-input
                        v-model:value="form.text"
                        type="textarea"
                        clearable
                        :autosize="{ minRows: 3 }"
                        placeholder="Insert text here..."
                        v-if="form.src === 'text'"
                    />
                </n-form-item>
            </n-form>
        </n-card>
    </div>
    <div v-else class="minimal left">
        <n-alert title="No text" type="warning">No text is selected to import</n-alert>
    </div>
</template>

<script setup lang="ts">

import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
// import router from '../router';
import axios, { AxiosError } from "axios";
import { FormInst, useMessage } from 'naive-ui'
import { useRoute } from 'vue-router';

const vuerouter = useRoute();
const id = String(vuerouter.params.id);

const formRef = ref<FormInst | null>(null);
const message = useMessage();
const form = reactive({ text: '', link: '', src: 'text', format: 'plain', });
const textInfo = ref<IText>();
const isLoaded = ref(false);
const isProcessing = ref(false);

const rules = {
    text: {
        required: true,
        trigger: ['blur', 'input'],
        message: 'Please put a text',
    },
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

onBeforeMount(async () => {
    const data = await store.get('texts', id);
    textInfo.value = data?.shift();
    // console.log('data from server', textInfo.value);
    isLoaded.value = true;
});

///////////////////////////////////////////////////////////////////
// processing functions
const wordRegExp = /^[А-Яа-яA-Za-z$'*-]+$/;
// const sentences = paragraphs[p].split(/([.…!?,:;«»]+)/);
const sentBorderRegExp = /(?<=[.…!?»])\s+(?=[«–А-ЯЎІЁA-Z])/;
const tokenDetectRegExp = /([^А-Яа-яA-Za-z0-9$'*-])/;
let [sentencesNumber, paragraphsNumber] = [0, 0];

const formatToken = (pnum: number, snum: number, form: string, repr: string, type: string) => ({
    p: pnum, s: snum, form, repr, meta: type
});

const processToken = (para: number, sent: number, token: string) => {
    const withPuncts = token.split(tokenDetectRegExp);
    if (withPuncts.length > 1) {
        const word = withPuncts.shift();
        const puncts = withPuncts.filter((x) => x);
        if (word) {
            return formatToken(para, sent, token, word, 'word');
        }

        if (puncts.length === 1) {
            return formatToken(para, sent, puncts[0], puncts[0], word ? 'ip' : 'ip+');
        }

        const compound = puncts.join('');
        if (compound === '!..' || compound === '?..') {
            return formatToken(para, sent, compound, compound, 'ip');
        }

        // print only puncts, drop word if in the end, preserve if in the beginning
        // console.error("■", p, sentencesNumber, puncts, token);
        return puncts.map((x) => formatToken(para, sent, token, x, (x.match(wordRegExp) ? 'word' : 'ip')));
    }
    return formatToken(para, sent, token, token, 'word');
};

const processSentence = (sentence: string, pnum: number) => {
    return sentencesNumber++, sentence.split(' ').filter((x) => x).map((x) => processToken(pnum, sentencesNumber, x));
};

const textToJSON = (userInput: string) => {
    const paragraphs = userInput.split('\n');
    paragraphsNumber = paragraphs.length;
    return paragraphs.map((p, pi) => p.split(sentBorderRegExp).map((s) => processSentence(s, pi))).flat(4);
};

const startProcessing = async (e: MouseEvent, dryRun: boolean) => {
    e.preventDefault();
    // console.log("form", form);
    try {
        await formRef.value?.validate(async (errors) => {
            if (!errors) {
                // message.success('Valid');
                if (form.src === "text") {
                    // console.log("send raw text", form);
                    isProcessing.value = true;
                    const textArray = textToJSON(form.text);
                    if (!dryRun) {
                        const lang2Letter = textInfo.value?.lang.split('-').shift();
                        const { data } = await store.post('load', { content: textArray, id: id, lang: lang2Letter });
                        console.log("text posted", data);
                    }
                    message.success(`The text was processed: ${paragraphsNumber} paragraphs, ${sentencesNumber} sentences, ${textArray.length} tokens. ${dryRun ? '' : 'Import is completed!'}`, { closable: true, duration: 5000 });
                    isProcessing.value = false;
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

// onBeforeMount(async () => {

// });

</script>

<style scoped>
</style>
