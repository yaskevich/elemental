<script setup lang="ts">

  import { ref, reactive, onBeforeMount } from 'vue';
  import store from '../store';
  import router from '../router';
  import { useRoute } from 'vue-router';
  import { FormInst, FormItemRule, FormValidationError, } from 'naive-ui'

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
  const txt = reactive({} as IText);
  const formRef = ref<FormInst | null>(null);

  const rules = {
    author: {
      required: true,
      message: "Author's name cannot be empty",
      trigger: 'blur',
    },
    title: {
      required: true,
      message: 'Text title cannot be empty',
      trigger: 'blur',
    },
  };

  const handleValidateClick = async (e: MouseEvent) => {
    e.preventDefault();

    try {
      await formRef.value?.validate();
      // console.log("data to save", txt);
      const {data} = await store.post('text', txt);
      console.log("result", data);
      if (!data?.id)  {
        console.log("database error");
      }
    } catch (errors:any) {
      console.log("errors", errors);
    }

  };

  const formatDate = () => {
    const pubDate = new Date(txt.published);
    // console.log(pubDate);
    txt.date = pubDate.toLocaleString('en-GB', {
      hour12: false,
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      year: 'numeric',
    });
  };

  onBeforeMount(async () => {
    const data = await store.get('texts', id);
    Object.assign(txt, data.shift());
    formatDate();
  });

  const publishText = async () => {
    console.log('publish text', id);
    const { data } = await store.post('publish', { id });
    console.log('data', data);
    txt.zipsize = data.bytes;
    txt.published = data.published;
    formatDate();
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
      <n-button type="primary" @click="handleValidateClick">Save</n-button>
    </template>

    <n-form ref="formRef" :label-width="80" :model="txt" :rules="rules">

      <n-form-item label="Author" path="author">
        <n-input v-model:value="txt.author" placeholder="Author's name" />
      </n-form-item>

      <n-form-item label="Title" path="title">
        <n-input v-model:value="txt.title" placeholder="Title" />
      </n-form-item>

      <n-form-item label="Subtitle">
        <n-input v-model:value="txt.meta" type="textarea" :autosize="true" placeholder="Subtitle or description" />
      </n-form-item>

      <n-form-item label="Site title">
        <n-input v-model:value="txt.site" type="textarea" :autosize="true" placeholder="Site title" />
      </n-form-item>

      <n-form-item label="Credits">
        <n-input v-model:value="txt.credits" type="textarea" :autosize="true" placeholder="Credits" />
      </n-form-item>

      <n-form-item label="Grammar Tagging UI">
        <n-checkbox v-model:checked="txt.grammar" :label="`${txt.grammar? '': 'NOT'} enabled`" />
      </n-form-item>

      <n-form-item label="Commenting UI">
        <n-checkbox v-model:checked="txt.comments" :label="`${txt.comments? '': 'NOT'} enabled`" />
      </n-form-item>

    </n-form>

    <n-space vertical>

      <n-tag :type="txt.loaded? 'success': 'error'">
        The text is <span v-if="!txt.loaded">NOT</span> loaded into the database
      </n-tag>

      <n-space justify="space-between" v-if="txt.loaded">
        <n-tag type="info" v-if="txt.zipsize">Published: {{txt.date}}</n-tag>
        <n-button type="info" @click="publishText" size="small">Publish</n-button>
      </n-space>
      <!-- <n-button type="warning" @click="downloadZipped" v-if="txt.zipsize">Download zipped site ({{humanFileSize(txt.zipsize)}})</n-button> -->

    </n-space>


    <template #footer>
      <!-- #footer -->
      &nbsp;
    </template>
    <template #action>
      <!-- #action -->
    </template>
  </n-card>

</template>

<style scoped>

</style>
