<template>

  <!-- <h1>{{entry.title}}</h1> -->
  <div>
    <div style="max-width:300px;margin: 0 auto;">
      <div style="margin-bottom:.5rem;">
        <n-input v-model:value="entry.num_id" style="width:75px;" type="text" placeholder="ID"/>
        <n-switch style="padding-left:1rem;padding-bottom: 5px;" v-model:value="entry.published">
          <template #checked>Published</template>
          <template #unchecked>Draft</template>
        </n-switch>
        <router-link :to="'/preview/'+entry.id" style="margin-left:5px;">Preview</router-link>
      </div>
      <n-text type="warning" v-if="!entry.num_id">ID should not be empty!</n-text>
      <n-input v-model:value="entry.title" type="text" placeholder="Heading" class="maininput" />
      <n-text type="warning" v-if="!entry.title">Heading should not be empty!</n-text>
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;"/>
      <n-input v-model:value="entry.trans" type="text" placeholder="Translation" />
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;"/>
      <Tiptap ref="briefRef" editorclass="briefeditor" />
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;"/>
      <Tiptap ref="contentRef" editorclass="fulleditor"/>
      <h4>Tags</h4>
      <n-dynamic-tags v-model:value="tags" />
      <n-dropdown trigger="hover" @select="handleSelect" :options="tagsList">
        <n-button> Add a tag</n-button>
      </n-dropdown>
      <h4>Issues</h4>
      <n-dynamic-tags v-model:value="issues" />
      <n-dropdown trigger="hover" @select="handleSelect" :options="issuesList">
        <n-button> Add an issue</n-button>
      </n-dropdown>

    </div>
    <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;"/>
    <n-button type="primary" @click="saveComment" v-if="entry.title && entry.num_id">Save</n-button>

  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount, } from 'vue';
  import Tiptap from './Tiptap.vue';
  import { useRoute } from 'vue-router';
  // defineProps<{ msg: string }>()

  const vuerouter = useRoute();
  const id = vuerouter.params.id;
  const entry = reactive({});
  const briefRef = ref(null);
  const contentRef = ref(null);

  const tags = ref([]);
  const issues = ref([]);

  const tagsList = reactive([]);
  const issuesList = reactive([]);
  // const json = ref({});
  // let json = {};

  const handleSelect = (key) => {
        console.log(key)
  };

  onBeforeMount(async () => {
    if (id) {
      const tagData = await store.get('tags');
      const tagListData = tagData.map(x => ({label: x.ru, key: x.id, disabled: false}));
      Object.assign(tagsList, tagListData);

      const issueData = await store.get('issues');
      const issueListData = issueData.map(x => ({label: x.ru, key: x.id, disabled: false}));
      Object.assign(issuesList, issueListData);

      const data = await store.get(`comment/${id}`);
      console.log('data from server', data);
      if (data.length) {
        console.log("data", data);
        Object.assign(entry, data[0]);

        const editorInstance = contentRef.value?.editor;
        if (editorInstance) {
           editorInstance.commands.setContent(data[0].content_json, false);
           briefRef.value.editor.commands.setContent(data[0].brief_json, false);
        }
      }
    }
  });

  const saveComment = async () => {
    // store.state.user.text_id
    if(!entry.text_id) {
      console.log("no text_id", store.state.user.text_id);
      entry.text_id = store.state.user.text_id;
    }
    const editorInstance = contentRef.value?.editor;
    const briefInstance = briefRef.value?.editor

    if (editorInstance) {
      entry.content_json = editorInstance.getJSON();
      entry.content_html = editorInstance.getHTML();
      entry.content_text = editorInstance.getText();
      // console.log('Content', entry.content_text);
      entry.brief_json = briefInstance.getJSON();
      entry.brief_html = briefInstance.getHTML();
      entry.brief_text = briefInstance.getText();

      const data = await store.post("comment", entry);
      console.log('result', data);
    }
  };

</script>

<style>
.maininput div div input {
  font-weight: bold;
}
</style>
