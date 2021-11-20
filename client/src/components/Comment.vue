<template>

  <h1>{{entry.title}}</h1>
  <div>
    <div style="max-width:300px;margin: 0 auto;">
      <n-switch style="padding-bottom:1rem;" v-model:value="entry.published">
        <template #checked>Published</template>
        <template #unchecked>Draft</template>
      </n-switch>
      <n-input v-model:value="entry.title" type="text" placeholder="Heading" />
      <Tiptap ref="tiptapRef" />
    </div>
    <n-button type="primary" @click="saveComment">Save</n-button>
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
  const tiptapRef = ref(null);

  // const json = ref({});
  // let json = {};

  onBeforeMount(async () => {
    if (id) {
      const data = await store.get(`comments/${id}`);
      console.log('data from server', data);
      if (data.length) {
        console.log("data", data);
        Object.assign(entry, data[0]);


        const editorInstance = tiptapRef.value?.editor;
        if (editorInstance) {
           editorInstance.commands.setContent(data[0].content_json, false);
        }
      }
    }
  });

  const saveComment = () => {
    const editorInstance = tiptapRef.value?.editor;
    if (editorInstance) {
      entry.content_json = editorInstance.getJSON();
      // console.log(JSON.stringify(entry.content_json));
      entry.content_html = editorInstance.getHTML();
      entry.content_text = editorInstance.getText();
      console.log('Content', entry.content_text);
    }
  };

</script>

<style scoped>

</style>
