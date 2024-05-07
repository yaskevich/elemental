<template>
    <n-card title="Sources" :bordered="false" class="minimal left" v-if="isLoaded">
        <template #header-extra v-if="store.hasRights()">
            <n-button type="primary" @click="$router.push('/source/')">+ new</n-button>
        </template>
        <div v-if="!sources.length">
            <n-text type="error">There are no sources!</n-text>
        </div>
        <n-card
            :title="item.citekey"
            v-for="(item, key) in sources"
            :key="key"
            style="margin-bottom: 5px;"
        >
            <template #header-extra v-if="store.hasRights()">
                <n-button text @click="$router.push(`/source/${item.id}`)">
                    <template #icon>
                        <n-icon
                            size="36"
                            :component="item.bibtex.type === 'book' ? BookFilled : ArticleFilled"
                        />
                    </template>
                </n-button>
            </template>
            <span
                :title="item.citekey"
                v-html="new Cite(item?.bibtex).format('bibliography', {
                    format: 'html', template: 'apa', lang: 'en-US'
                })"
            ></span>
        </n-card>
    </n-card>
</template>

<script setup lang="ts">
import store from '../store';
import { ref, reactive, onBeforeMount } from 'vue';
import Cite from 'citation-js';
import { ArticleFilled, BookFilled, } from '@vicons/material'

const sources = reactive([] as Array<IBib>);
const isLoaded = ref(false);

onBeforeMount(async () => {
    const data = await store.get('source');
    Object.assign(sources, data);
    // console.log('data from server', sources);
    isLoaded.value = true;
});
</script>
