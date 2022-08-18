<template>
    <n-card title="Scheme" :bordered="false" class="minimal left">
        <template #header-extra></template>
        <h4>{{ text?.author }}. {{ text?.title }}</h4>
        <n-space vertical size="large">
            <n-tag type="success" v-for="item in text?.scheme" :key="item.id">
                {{ item.title }}
                <template #icon>
                    <n-icon :component="item.type === 'line' ? AbcFilled : TextFormatFilled" />
                </template>
            </n-tag>
            <n-divider></n-divider>
            <n-form-item style="display:block;" label="Add new field">
                <n-button-group>
                    <n-tooltip placement="bottom">
                        <template #trigger>
                            <n-button @click="makeField('line')">
                                <template #icon>
                                    <n-icon :component="AbcFilled" />
                                </template>
                                Line
                            </n-button>
                        </template>
                        Single-line text field with no formatting
                    </n-tooltip>
                    <n-tooltip placement="bottom">
                        <template #trigger>
                            <n-button @click="makeField('area')">
                                <template #icon>
                                    <n-icon :component="FormatAlignJustifyFilled" />
                                </template>
                                Text Area
                            </n-button>
                        </template>
                        Multiline text field with no formatting
                    </n-tooltip>
                    <n-tooltip placement="bottom">
                        <template #trigger>
                            <n-button @click="makeField('rich')">
                                <template #icon>
                                    <n-icon :component="TextFormatFilled" />
                                </template>
                                Rich Text
                            </n-button>
                        </template>
                        Multiline field with rich text formatting
                    </n-tooltip>
                </n-button-group>
            </n-form-item>
        </n-space>
    </n-card>
</template>

<script setup lang="ts">
import store from '../store';
import { ref, onBeforeMount, } from 'vue';
import { AbcFilled, TextFormatFilled, FormatAlignJustifyFilled } from '@vicons/material';
import { useRoute } from 'vue-router';

const vuerouter = useRoute();
const text = ref<IText>();

const makeField = (value: string) => {
    console.log(value);
};

onBeforeMount(async () => {
    if (vuerouter.params.id) {
        const data = await store.get('texts', String(vuerouter.params.id));
        text.value = data?.shift();
    }
});

</script>
