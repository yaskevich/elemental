<template>
  <n-card title="Source" :bordered="false" class="minimal left" v-if="isLoaded">
    <template #header-extra>
      <!-- <n-checkbox v-model:checked="isBatch" style="margin-right:1rem;">Batch mode</n-checkbox> -->
      <n-space>
        <n-button type="error" @click="remove" v-if="vuerouter.params.id">Delete</n-button>
        <n-button type="primary" @click="save">Save</n-button>
      </n-space>
    </template>
    <n-form ref="formRef" :label-width="80" :model="form" :rules="rules">
      <n-space vertical>
        <n-tag type="success" size="large" v-if="cjsObject?.data?.length === 1">{{ cjsObject.data[0].id }}</n-tag>
        <n-alert title="Batch mode" type="warning" v-if="cjsObject?.data?.length > 1"
          >You have put the dataset containing more than one BibTex record. The data will be processed in batch mode:
          the same language will be set for every record. After processing will be completed, you will be forwarded to
          the list with all sources.</n-alert
        >
        <n-form-item label="Language variety" path="langLabel" style="display: block">
          <n-auto-complete
            @select="onSelect"
            :get-show="
              () => {
                return true;
              }
            "
            clearable
            :loading="langLoading"
            v-model:value="form.langLabel"
            :options="languages"
            placeholder="Language"
            @update:value="updateComplete" />
        </n-form-item>
        <n-form-item path="bib" label="BibTex">
          <n-input
            v-model:value="form.bib"
            type="textarea"
            clearable
            :autosize="{ minRows: 5, maxRows: 20 }"
            autofocus
            placeholder="Bibliography item in BibTex format..." />
        </n-form-item>
        <n-tag type="error" v-if="form.bib && !cjsObject?.data">BibTex error!</n-tag>

        <div v-if="cjsObject?.data" v-html="cjsObject.format('bibliography', formatting)"></div>
        <div v-if="!form.bib" style="color: darkorange">
          You can easily generate BibTex record via
          <n-button text tag="a" href="https://zbib.org" target="_blank" type="primary">
            zotero
            <strong>bib</strong>
          </n-button>
        </div>
      </n-space>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import store from '../store';
import { ref, reactive, onBeforeMount, computed, unref, h } from 'vue';
import router from '../router';
import { RouterLink, useRoute } from 'vue-router';
import type { SelectOption, FormInst, FormItemRule } from 'naive-ui';
import { useMessage } from 'naive-ui';
import Cite from 'citation-js';
// import { transliterate, slugify } from 'transliteration';

const message = useMessage();
const vuerouter = useRoute();

const formRef = ref<FormInst | null>(null);
const isLoaded = ref(false);
const form = reactive({ id: String(unref(vuerouter.params.id)), lang: '', langLabel: '', bib: '' });
const languages = ref([] as Array<SelectOption>);
const langLoading = ref(true);
// ['apa', 'vancouver', 'harvard1']
const formatting = reactive({ format: 'html', template: 'apa', lang: 'en-US' });

const rules = {
  langLabel: {
    required: true,
    trigger: ['blur', 'change'],
    message: 'Language should be set',
  },
  bib: {
    validator: validateBib,
    required: true,
    trigger: ['blur', 'input'],
    message: 'Valid BibTex format is expected',
  },
};

const cjsObject = computed(() => {
  try {
    return new Cite(form.bib, { generateGraph: false });
  } catch (error) {
    return new Cite('');
  }
});

function validateBib(rule: FormItemRule, value: string): boolean {
  return Boolean(cjsObject?.value?.data?.length);
}

function validateLang(rule: FormItemRule, value: string): boolean {
  return Boolean(cjsObject?.value?.data?.length);
}

const getLanguages = async (chunk?: string) => {
  langLoading.value = true;
  const langData = await store.get('languages', chunk);
  languages.value = langData.map((x: any, i: number) => ({ tag: x.tag, label: `${x.name} (${x.location})`, value: i }));
  langLoading.value = false;
  // console.log(chunk, languages.value.length);
};

const updateComplete = async (chunk?: string) => {
  // console.log("update:value", chunk, form.langLabel);
  if (chunk && chunk.length > 1) {
    // console.log("input", chunk);
    await getLanguages(chunk);
  }
};

const onSelect = (index: number) => {
  // console.log("select");
  const langId = languages.value[index]?.tag as string;
  form.lang = langId;
  formatting.lang = langId;
};

const setLanguage = async () => {
  await getLanguages(form.lang);
  const selectedLang = languages.value.filter(x => x.tag === form.lang).shift();
  // console.log(form.lang, selectedLang, selectedLang?.label);
  if (selectedLang?.label) {
    form.langLabel = selectedLang.label as any;
  }
};

const remove = async () => {
  // console.log(form.id);
  const { data } = await store.deleteById('sources', form.id);
  //   console.log('result', data);
  if (data?.[0]?.id === Number(form.id)) {
    // message.success("The item was deleted successfully");
    router.push('/sources');
  } else if (data?.length) {
    const links = data.map((x: any) =>
      store?.state?.user?.text_id === x.text_id
        ? h(
            RouterLink,
            { to: '/comment/' + x.id, style: 'display:block;', class: 'msglink' },
            { default: () => x.title }
          )
        : h('div', {}, { default: () => `${x.title} @ text #${x.text_id}` })
    );
    const container = h('div', {}, [h('span', {}, `There are comments with this source (${data.length})`)]);
    const vnode = h('div', {}, [container, links, 'Remove the references from comments before deleting this source.']);
    message.error(() => vnode, { duration: 5000, closable: true });
  } else {
    message.error('Unknown error');
  }
};

const save = async (e: MouseEvent) => {
  e.preventDefault();
  try {
    await setLanguage();
    await formRef.value?.validate(async errors => {
      if (!errors) {
        const { data } = await store.post('source', {
          lang: form.lang,
          bib: cjsObject.value.data,
          id: form.id,
          text: store?.state?.user?.text_id,
          raw: form.bib,
        });
        if (data?.error) {
          const note =
            data.error === `Key (citekey)=(${cjsObject?.value?.data?.[0]?.id}) already exists.`
              ? 'The publication with this ID already exists in the database. Please, pay attention to avoid duplicates!'
              : data.error;
          message.error(note, { duration: 5000 });
        } else {
          if (!form.id) {
            form.id = data?.[0]?.id;
            if (form.id) {
              router.replace('/source/' + form.id);
            }
          }
          if (data?.length > 1) {
            router.push('/sources');
          }
        }
        // console.log(data);
      } else {
        console.log(errors);
      }
    });
  } catch (error) {
    console.log('fail');
  }
};

onBeforeMount(async () => {
  if (form.id) {
    const results = await store.get('source', form.id);
    if (results.length) {
      const data = results.shift();
      // console.log('data from server', data);
      form.lang = data.lang;
      // form.bib = (new Cite(data[0].bibtex)).format('bibtex');
      // till the CitationJS update supporting non-Roman languages
      form.bib = data.raw;
    }
  } else {
    // console.log("default language", store.state?.user?.text?.lang);
    form.lang = unref(store.state?.user?.text?.lang) || '';
  }
  await setLanguage();
  isLoaded.value = true;
});
</script>

<style scoped lang="scss">
:deep(.csl-entry) {
  padding: 0.5rem;
  background: rgba(171, 196, 207, 0.745);
  border-radius: 3px;
  margin-bottom: 1rem;
}
</style>
