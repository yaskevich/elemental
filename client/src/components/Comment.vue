<template>

  <!-- <h1>{{entry.title}}</h1> -->
  <div>
    <div style="max-width:300px;margin: 0 auto;">
      <n-switch style="padding-bottom:1rem;" v-model:value="entry.published">
        <template #checked>Published</template>
        <template #unchecked>Draft</template>
      </n-switch>
      <n-input v-model:value="entry.title" type="text" placeholder="Heading" class="maininput" />
      <n-text type="warning" v-if="!entry.title">Heading should not be empty!</n-text>
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;"/>
      <n-input v-model:value="entry.trans" type="text" placeholder="Translation" />
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;"/>
      <Tiptap ref="briefRef" editorclass="briefeditor" />
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;"/>
      <Tiptap ref="contentRef" editorclass="fulleditor"/>
    </div>
    <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;"/>
    <n-button type="primary" @click="saveComment" v-if="entry.title">Save</n-button>
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

  // const json = ref({});
  // let json = {};

  onBeforeMount(async () => {
    if (id) {
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
