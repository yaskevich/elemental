<script setup lang="ts">

  import { ref, reactive, onBeforeMount } from 'vue';
  import store from '../store';
  import router from '../router';
  import { useRoute } from 'vue-router';

  interface IText {
    id: number;
    author: string;
    title: string;
    meta: string;
    grammar: boolean;
    comments: boolean;
    loaded: boolean;
    published: string;
    date: string;
    credits: string;
    site: string;
    zipsize: number;
  }

  const vuerouter = useRoute();
  const id = String(vuerouter.params.id);
  const textInfo = reactive({} as IText);

  onBeforeMount(async () => {
    const data = await store.get('texts', id);
    Object.assign(textInfo, data.shift());
    // console.log(textInfo);

    const pubDate = new Date(textInfo.published);
    // console.log(pubDate);
    textInfo.date = pubDate.toLocaleString('en-GB', {
      hour12: false,
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      year: 'numeric',
    });
    // console.log(textInfo.date);
  });

  const publishText = async () => {
    console.log('publish text', id);
    const { data } = await store.post('publish', { id });
    console.log('data', data);
  };

  const saveTextInfo = async () => {
    console.log('save props', textInfo);
  };

  const downloadZipped = async () => {
    console.log('save zip');
  };

  const humanFileSize = (size: number) => {
    // https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
    const i: number = Math.floor(Math.log(size) / Math.log(1024));
    return Number((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
  };

</script>

<template>

  <n-card title="Project" :bordered="false" class="minimal left">

    <template #header-extra>
      <n-button type="primary" @click="saveTextInfo">Save</n-button>
    </template>

    <n-space vertical>
      <n-space justify="space-between">
        <n-tag>Author</n-tag>

      </n-space>
      <n-input v-model:value="textInfo.author" type="text" placeholder="Author" />
      <n-tag>Title</n-tag>
      <n-input v-model:value="textInfo.title" type="text" placeholder="Title" />
      <n-tag>Subtitle</n-tag>
      <n-input v-model:value="textInfo.meta" type="textarea" :autosize="true" placeholder="Subtitle" />
      <n-tag>Site title</n-tag>
      <n-input v-model:value="textInfo.site" type="textarea" :autosize="true" placeholder="Site title" />
      <n-tag>Credits</n-tag>
      <n-input v-model:value="textInfo.credits" type="textarea" :autosize="true" placeholder="Credits" />
      <n-tag :type="textInfo.loaded? 'success': 'error'">
        The text is <span v-if="!textInfo.loaded">NOT</span> loaded into the database.
      </n-tag>
      <div>
        <n-checkbox v-model:checked="textInfo.grammar" /> The grammar tagging UI is <span v-if="!textInfo.grammar">NOT</span> enabled.</div>
      <div>
        <n-checkbox v-model:checked="textInfo.comments" /> The commenting UI is <span v-if="!textInfo.comments">NOT</span> enabled.</div>
      <n-space justify="space-between">
        <n-tag type="info" v-if="textInfo.zipsize">Published: {{textInfo.date}}</n-tag>
        <n-button type="info" @click="publishText" size="small">Publish</n-button>
      </n-space>

      <!-- <n-button type="warning" @click="downloadZipped" v-if="textInfo.zipsize">Download zipped site ({{humanFileSize(textInfo.zipsize)}})</n-button> -->

    </n-space>
    <n-divider/>

    <template #footer>
      <!-- #footer -->
    </template>
    <template #action>
      <!-- #action -->
    </template>
  </n-card>

</template>

<style scoped>

</style>
