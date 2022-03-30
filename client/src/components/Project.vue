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
    console.log('save props');
  };

  const downloadZipped = async () => {
    console.log('save zip');
  };

  const humanFileSize = (size:number) => {
    // https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
    const i:number = Math.floor(Math.log(size) / Math.log(1024));
    return Number((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
  };

</script>

<template>

  <h3>Project</h3>
  <div class="center-column">
    <div class="left-column" style="max-width:300px;">
      <!-- <h4>{{textInfo.author}}. {{textInfo.title}}</h4> -->
      <n-space vertical>
        <n-space justify="space-between">
          <n-tag>Author</n-tag>
          <n-button type="primary" @click="saveTextInfo" size="small">Save</n-button>
        </n-space>
        <n-input v-model:value="textInfo.author" type="text" placeholder="Author" />
        <n-tag>Title</n-tag>
        <n-input v-model:value="textInfo.title" type="text" placeholder="Title" />
        <n-tag>Subtitle</n-tag>
        <n-input v-model:value="textInfo.meta" type="textarea" :autosize="true" placeholder="Subtitle" />
        <n-tag>Site title</n-tag>
        <n-input v-model:value="textInfo.site" type="textarea" :autosize="true" placeholder="Site name" />
        <n-tag>Credits</n-tag>
        <n-input v-model:value="textInfo.credits" type="textarea" :autosize="true" placeholder="Credits" />
        <div>The text is <span v-if="!textInfo.loaded">NOT</span> loaded into the database.</div>
        <div>The grammar tagging UI is <span v-if="!textInfo.grammar">NOT</span> enabled.</div>
        <div>The comments UI is <span v-if="!textInfo.comments">NOT</span> enabled.</div>
        <div v-if="textInfo.zipsize">Published: {{textInfo.date}}</div>
        <n-space justify="space-around">
          <n-button type="info" @click="publishText">Publish</n-button>
          <!-- <n-button type="warning" @click="downloadZipped" v-if="textInfo.zipsize">Download zipped site ({{humanFileSize(textInfo.zipsize)}})</n-button> -->
        </n-space>
      </n-space>
    </div>
  </div>

</template>

<style scoped>

</style>
