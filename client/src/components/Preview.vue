<template>
  <div class="minimal left">
    <h2>
      <span class="number" v-if="comment.priority">({{ comment.priority }})</span>
      {{ comment.title }}
    </h2>
    <div>
      <template v-for="item in scheme" :key="item.id">
        <n-divider title-placement="left">
          <span class="zone">{{ item.title }}</span>
        </n-divider>
        <p v-if="item.type === 'line'" class="line">{{ comment?.entry?.[item.id] }}</p>
        <div v-if="item.type === 'rich'" v-html="render(comment?.entry?.[item.id], sources)"></div>
      </template>
      <n-divider />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
import store from '../store';

const vuerouter = useRoute();
const id = vuerouter.params.id;
const comment = reactive({} as IComment);
const sources = reactive([] as Array<IBib>);
const render = store.convertJSONtoHTML;
const scheme = store?.state?.user?.text?.scheme || [];


onBeforeMount(async () => {
  if (id) {
    const commentData = await store.get(`comment/${id}`);
    if (commentData.length) {
      // console.log('data', commentData);
      Object.assign(comment, commentData.shift());
    }
    const sourcesData = await store.get('source');
    Object.assign(sources, sourcesData);
  }
});

</script>

<style scoped lang="scss">
:deep(.number) {
  color: lightgray;
}
:deep(var.error) {
  display: none;
}
:deep(blockquote p) {
  display: inline;
}
:deep(.line) {
  margin-top: -1rem;
}
:deep(img) {
  max-width: 370px;
  max-height: 300px;
}
</style>
