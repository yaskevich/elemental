<template>
  <div style="max-width:600px;margin: 0 auto;text-align: left; padding: 0 15px 10px 15px">
    <h2>
      <span style="color:lightgray;">({{ entry.priority }})</span>
      {{ entry.title }}
    </h2>
    <div>
      <n-divider title-placement="left">
        <span class="zone">translation</span>
      </n-divider>

      <p style="margin-top:-1rem;font-style:italic;">{{ entry.trans }}</p>
      <div v-if="entry.brief_json?.content?.[0].content">
        <n-divider title-placement="left">
          <span class="zone">brief comment</span>
        </n-divider>
        <div v-html="render(entry.brief_json, sources)"></div>
      </div>

      <div v-if="entry.long_json?.content?.[0].content">
        <n-divider title-placement="left">
          <span class="zone">full comment</span>
        </n-divider>
        <div v-html="render(entry.long_json, sources)"></div>
      </div>

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
const entry: IEntry = reactive({}) as IEntry;
const sources = reactive([] as Array<IBib>);
const render = store.convertJSONtoHTML;

onBeforeMount(async () => {
  if (id) {
    const commentData = await store.get(`comment/${id}`);
    if (commentData.length) {
      // console.log('data', commentData);
      Object.assign(entry, commentData.shift());
    }
    const sourcesData = await store.get('source');
    Object.assign(sources, sourcesData);
  }
});

</script>

<style scoped lang="scss">
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

:deep(img) {
  max-width: 370px;
  max-height: 300px;
}
:deep(img + p.caption) {
  color: gray;
  font-weight: bold;
  margin-top: -5px;
}

:deep(cite) {
  padding: 0px 5px;

  &::before {
    content: "[" attr(id) "]";
    color: darkred;
    font-weight: bold;
    font-style: normal;
  }
}
</style>
