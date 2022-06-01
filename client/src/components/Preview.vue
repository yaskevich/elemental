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
      <n-divider title-placement="left">
        <span class="zone">brief comment</span>
      </n-divider>
      <div v-if="entry.brief_text">
        <div v-html="entry.brief_html"></div>
      </div>
      <n-divider title-placement="left">
        <span class="zone">full comment</span>
      </n-divider>
      <div v-if="entry.long_text">
        <div v-html="entry.long_html"></div>
      </div>
      <n-divider />
    </div>
  </div>
</template>

<script setup lang="ts">

import store from '../store';
import { ref, reactive, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';

const vuerouter = useRoute();
const id = vuerouter.params.id;

interface IEntry {
  long_json: Object;
  long_html: string;
  long_text: string;
  brief_json: Object;
  brief_html: string;
  brief_text: string;
  text_id: number;
  id: number;
  issues: Array<number>;
  tags: Array<number>;
  priority: number;
  published: boolean;
  trans: string;
  title: string;
}

const entry: IEntry = reactive({}) as IEntry;

onBeforeMount(async () => {
  if (id) {
    const data = await store.get(`comment/${id}`);
    console.log('data from server', data);
    if (data.length) {
      console.log('data', data);
      Object.assign(entry, data[0]);
    }
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
</style>
