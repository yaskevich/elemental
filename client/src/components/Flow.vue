<template>
    <n-card title :bordered="false" class="left" v-if="isLoaded">
        <n-space vertical>
            <h3>
                {{ store?.state?.user?.text?.author }}.
                {{ store?.state?.user?.text?.title }}
            </h3>
            <div v-for="(comment, index) in comments" key="index" class="comment">
                <div>
                    <n-button
                        dashed
                        @click="$router.push(`/comment/${comment.id}`)"
                        v-if="comment.priority"
                        :title="comment.priority"
                    >{{ index + 1 }}</n-button>
                    <span
                        class="heading"
                    >{{ comment.title.split('').map((x, i) => !i ? x.toLocaleUpperCase() : x).join('') }}</span>

                    <template v-for="item in scheme" :key="item.id">
                        <p v-if="item.type === 'line'" :class="item.type">
                            <n-tag>
                                {{ comment?.entry?.[item.id] }}
                                <template #icon>
                                    <n-icon :component="AbcFilled" />
                                </template>
                            </n-tag>
                        </p>
                        <div
                            v-if="item.type === 'rich'"
                            :class="item.type"
                            v-html="render(comment?.entry?.[item.id], sources)"
                        ></div>
                    </template>
                </div>
            </div>
            <n-divider></n-divider>
        </n-space>
    </n-card>
</template>
<script setup lang="ts">
import { ref, reactive, onBeforeMount, } from 'vue';
// import router from '../router';
// import { useRoute } from 'vue-router';
import store from '../store';
// const vuerouter = useRoute();
import { AbcFilled, } from '@vicons/material';

const comments = reactive([] as Array<IFullComment>);
const sources = reactive([] as Array<IBib>);

const isLoaded = ref(false);
const render = store.convertJSONtoHTML;
const scheme = store?.state?.user?.text?.scheme || [];

onBeforeMount(async () => {
    const pathId = store?.state?.user?.text_id || 1;
    const data = await store.get('fullcomments/' + pathId);
    Object.assign(comments, data);
    // console.log('data from server', data);

    const sourcesData = await store.get('source');
    Object.assign(sources, sourcesData);
    isLoaded.value = true;
});
</script>

<style scoped lang="scss">
:deep(.heading) {
    margin-left: 5px;
    font-size: 1rem;
    /* display: inline-block; */
    // &::first-letter {
    //     text-transform: capitalize;
    // }
}
// :deep(var) {
//     all: revert !important;
// }
:deep(.number) {
    color: silver;
}
// :deep(.line) {
// font-style: italic;
// font-family: monospace;
// }
:deep(.rich) {
    border: 1px dashed silver;
    margin-bottom: 5px;
    padding: 5px;
}
:deep(img) {
    max-width: 100%;
    max-height: 300px;
}
:deep(figure) {
    border: 1px solid silver;
    text-align: center;
    padding: 5px;
}
// :deep(.error) {
//     background-color: yellow;
// }

:deep(.comment) {
    background-color: rgba(211, 211, 211, 0.15);
    padding: 15px;
}
</style>