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
:deep(var.name) {
  font-weight: bold;
  font-style: normal;
  background-color: yellow;
  color: #333;
  padding: 3px;
  border-radius: 8px;
}
:deep(var.example) {
  /* background-color: rgb(246, 248, 250); */
  background-color: rgb(227, 232, 244);
  border-radius: 8px;
  color: rgb(36, 51, 90);
  font-size: 14px;
  line-height: 1.4em;
  padding: 3px;
}
:deep(var.book) {
  background: #eee;
  padding: 0 3px;
  color: #c76c0c;
}
:deep(blockquote) {
  background: #f9f9f9;
  border-left: 10px solid #ccc;
  margin: 1.5em 10px;
  padding: 0.5em 10px;
  quotes: "\201C""\201D""\2018""\2019";
}
:deep(blockquote):before {
  color: #ccc;
  content: open-quote;
  font-size: 4em;
  line-height: 0.1em;
  margin-right: 0.25em;
  vertical-align: -0.4em;
}
:deep(blockquote p) {
  display: inline;
}
:deep(cite) {
  font-style: normal;
  color: gray;
  /*
  padding: 0px 5px;
  */
}
:deep(.line) {
  margin-top: -1rem;
  letter-spacing: 2px;
}
:deep(img) {
  max-width: 370px;
  max-height: 300px;
}
:deep(figure) {
  border: 1px solid silver;
  text-align: center;
  padding: 5px;
}
:deep(figcaption) {
  color: rgb(37, 53, 223);
  background-color: #ccc;
  font-weight: bold;
}
</style>
