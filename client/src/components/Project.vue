<script setup lang="ts">
import { ref, reactive, onBeforeMount, toRaw } from 'vue';
import store from '../store';
import router from '../router';
import { useRoute } from 'vue-router';
import { FormInst, FormItemRule, FormValidationError } from 'naive-ui';
import type { SelectOption } from 'naive-ui';

const vuerouter = useRoute();
const id = ref(String(vuerouter.params.id));
const txt = reactive({} as IText);
const formRef = ref<FormInst | null>(null);
const langLoading = ref(true);

const headers = [
  { label: 'Hidden', value: 'hidden' },
  { label: 'Level 1', value: 'h0' },
  { label: 'Level 2', value: 'h1' },
  { label: 'Text', value: '' },
];

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
  langLabel: {
    required: true,
    trigger: ['blur', 'change'],
    message: 'Please select a language',
  },
};

const languages = ref([] as Array<SelectOption>);

const handleValidateClick = async (e: MouseEvent) => {
  e.preventDefault();
  await setLanguage();

  try {
    await formRef.value?.validate();
    // console.log("data to save", txt);
    const { data } = await store.post('text', txt);
    // console.log("result", data);
    if (!data?.id) {
      console.log('database error');
    } else {
      if (!store?.state?.user?.text) {
        await store.setCurrentText(data.id, txt.title);
      } else if (store.state.user.text?.id === data.id) {
        Object.assign(store.state.user.text as IText, toRaw(txt));
      }
      id.value = data.id;
      router.replace(`/project/${data.id}`);
    }
  } catch (errors: any) {
    console.log('errors', errors);
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

const getLanguages = async (chunk?: string) => {
  langLoading.value = true;
  const langData = await store.get('languages', chunk);
  languages.value = langData.map((x: any, i: number) => ({ tag: x.tag, label: `${x.name} (${x.location})`, value: i }));
  langLoading.value = false;
  // console.log(chunk, languages.value.length);
};

const updateComplete = async (chunk?: string) => {
  // console.log("update:value", chunk, txt.langLabel);
  if (chunk && chunk.length > 1) {
    // console.log("input", chunk);
    await getLanguages(chunk);
  }
};

const onSelect = (payload: Event) => {
  // console.log("select");
  const index = Number(payload);
  const langId = languages.value[index]?.tag as string;
  txt.lang = langId;
};

const setLanguage = async () => {
  await getLanguages(txt.lang);
  const selectedLang = languages.value.filter(x => x.tag === txt.lang).shift();
  // console.log(txt.lang, selectedLang, selectedLang?.label);
  if (selectedLang?.label) {
    txt.langLabel = selectedLang.label as any;
  }
};

onBeforeMount(async () => {
  if (id.value) {
    const data = await store.get('texts', id.value);
    Object.assign(txt, data.shift());
    formatDate();
    // console.log(txt);
    await setLanguage();
  } else {
    await getLanguages();
    console.log('add new');
  }
});

const publishText = async () => {
  // console.log('publish text', id.value);
  const { data } = await store.post('publish', { id: id.value });
  console.log('data', data);
  txt.zipsize = data.bytes;
  txt.published = data.published;
  formatDate();
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

      <n-form-item label="Language variety" path="langLabel" style="display: block">
        <n-auto-complete @select="onSelect" clearable :loading="langLoading" v-model:value="txt.langLabel"
          :options="languages" placeholder="Please select a language" @update:value="updateComplete" />
      </n-form-item>

      <n-form-item label="Site title">
        <n-input v-model:value="txt.site" placeholder="Site title" />
        <n-select v-model:value="txt.siteclass" :options="headers" style="width: 150px" />
      </n-form-item>

      <n-form-item label="URL">
        <n-input v-model:value="txt.url" placeholder="Web link" />
      </n-form-item>

      <n-form-item label="Credits">
        <n-input v-model:value="txt.credits" type="textarea" :autosize="true" placeholder="Credits" />
        <n-select v-model:value="txt.creditsclass" :options="headers" style="width: 150px" />
      </n-form-item>

      <!-- <n-form-item label="Grammar Tagging UI">
        <n-checkbox v-model:checked="txt.grammar" :label="`${txt.grammar ? '' : 'NOT'} enabled`" />
      </n-form-item>-->
      <n-space justify="space-between">
        <n-form-item label="Toolset for adding comments">
          <n-checkbox v-model:checked="txt.comments" :label="`${txt.comments ? '' : 'NOT'} enabled`" />
        </n-form-item>
        <n-form-item>
          <n-button v-if="txt.comments" type="info" @click="router.push('/scheme/' + vuerouter.params.id)"
            size="small">Set
            Scheme</n-button>
        </n-form-item>
      </n-space>
    </n-form>
    <n-divider></n-divider>
    <n-space vertical v-if="id">
      <n-space justify="space-between">
        <n-tag :type="txt.loaded ? 'success' : 'error'">
          The text is
          <span v-if="!txt.loaded">NOT</span> loaded into the database
        </n-tag>
        <n-button type="info" @click="publishText" size="small" v-if="txt.loaded">Publish</n-button>
        <n-button v-else type="info" @click="router.push('/import/' + vuerouter.params.id)"
          size="small">Import</n-button>
      </n-space>

      <n-card v-if="txt.zipsize">
        <n-space vertical>
          <n-text type="info">Published: {{ txt.date }}</n-text>
          <n-space justify="space-between">
            <n-button ghost type="info" tag="a" :href="`/api/files/${id}/site.zip`" target="_blank">Download ({{
              humanFileSize(txt.zipsize) }})</n-button>
            <n-button ghost type="info" tag="a" :href="`/api/files/${id}/`" target="_blank">View</n-button>
          </n-space>
        </n-space>
      </n-card>
    </n-space>
  </n-card>
</template>
