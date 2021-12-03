<template>

  <!-- <h1>{{entry.title}}</h1> -->
  <div>
    <div style="max-width:300px;margin: 0 auto;">
      <div style="margin-bottom: 10px;">
        <n-tag v-for="issue in entry.issues" :key="issue" closable @close="removeIssue(issue)" :color="{ color: issuesKV[issue].color, textColor: 'white', }">
          {{issuesKV[issue]?.["ru"]}}
        </n-tag>
      </div>
      <div style="margin-bottom:.5rem;">
        <n-input v-model:value="entry.num_id" style="width:75px;" type="text" placeholder="ID" />
        <n-switch style="padding-left:1rem;padding-bottom: 5px;" v-model:value="entry.published">
          <template #checked>Published</template>
          <template #unchecked>Draft</template>
        </n-switch>
        <router-link :to="'/preview/'+entry.id" style="margin-left:5px;">Preview</router-link>
        <n-dropdown trigger="hover" @select="addTag" :options="tagsList">
          <n-button> + tag</n-button>
        </n-dropdown>
        <n-dropdown trigger="hover" @select="addIssue" :options="issuesList">
          <n-button> + issue</n-button>
        </n-dropdown>

      </div>
      <n-text type="warning" v-if="!entry.num_id">ID should not be empty!</n-text>
      <n-input v-model:value="entry.title" type="text" placeholder="Heading" class="maininput" />
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
      <n-tag v-for="tag in entry.tags" :key="tag" closable @close="removeTag(tag)" style="margin-right: 10px;" size="small">
        {{tagsList.filter(x => x.key == tag)?.shift()?.["label"]}}
      </n-tag>

      <n-text type="warning" v-if="!entry.title">Heading should not be empty!</n-text>
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
      <n-input v-model:value="entry.trans" type="text" placeholder="Translation" />
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
      <Tiptap ref="briefRef" editorclass="briefeditor" />
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
      <Tiptap ref="contentRef" editorclass="fulleditor" />
    </div>
    <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
    <n-button type="primary" @click="saveComment" v-if="entry.title && entry.num_id">Save</n-button>

  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount, computed, onBeforeUnmount, onMounted } from 'vue';
  import { onBeforeRouteLeave } from 'vue-router';
  import Tiptap from './Tiptap.vue';
  import { useRoute } from 'vue-router';
  // defineProps<{ msg: string }>()

  const vuerouter = useRoute();
  const id = vuerouter.params.id;
  const entry = reactive({});
  const fromDB = ref('');
  const briefRef = ref(null);
  const contentRef = ref(null);

  const tagsList = reactive([]);
  const issuesList = reactive([]);
  const issuesKV = reactive({});

  const removeTag = id => {
    entry.tags = entry.tags.filter(x => x !== id);
  };

  const addTag = id => {
    entry.tags.push(id);
  };

  const removeIssue = id => {
    console.log('!!');
    entry.issues = entry.issues.filter(x => x !== id);
  };

  const addIssue = id => {
    console.log(id);
    entry.issues.push(id);
  };

  const askToLeave = event => {
    if (!checkIsEntryUpdated()) return;
    event.preventDefault();
    event.returnValue = '';
  };

  onBeforeRouteLeave(() => {
    // https://next.router.vuejs.org/guide/advanced/composition-api.html#navigation-guards
    if (checkIsEntryUpdated()){
      const answer = window.confirm('Leave the page?\nChanges you made may not be saved');
      // cancel the navigation and stay on the same page
      if (!answer) return false;
    }
  });

  onMounted(() => {
    window.addEventListener('beforeunload', askToLeave);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', askToLeave);
  });

  onBeforeMount(async () => {
    if (id) {
      const tagData = await store.get('tags');
      // console.log("tags", tagData);
      Object.assign(
        tagsList,
        tagData.map(x => ({ label: x.ru, key: x.id, disabled: computed(() => entry.tags?.includes(x.id)) }))
      );

      const issueData = await store.get('issues');
      const issueListData = issueData.map(x => ({
        label: x.ru,
        key: x.id,
        disabled: computed(() => entry.issues?.includes(x.id)),
      }));
      Object.assign(issuesList, issueListData);

      Object.assign(issuesKV, Object.fromEntries(issueData.map(x => [x.id, x])));
      console.log(issuesKV);

      const data = await store.get(`comment/${id}`);
      console.log('data from server', data);
      if (data.length) {
        // console.log("data", data);
        // entryCopy = JSON.parse(JSON.stringify(data[0])) ;
        fromDB.value = JSON.stringify(data[0]);
        Object.assign(entry, data[0]);

        const editorInstance = contentRef.value?.editor;
        if (editorInstance) {
          editorInstance.commands.setContent(data[0].content_json, false);
          briefRef.value.editor.commands.setContent(data[0].brief_json, false);
        }
      }
    }
  });


  const checkIsEntryUpdated = () => {
    const editorInstance = contentRef.value?.editor;
    const briefInstance = briefRef.value?.editor;

    if (editorInstance) {
      entry.content_json = editorInstance.getJSON();
      entry.content_html = editorInstance.getHTML();
      entry.content_text = editorInstance.getText();
      // console.log('Content', entry.content_text);
      entry.brief_json = briefInstance.getJSON();
      entry.brief_html = briefInstance.getHTML();
      entry.brief_text = briefInstance.getText();
    }
    return !(fromDB.value === JSON.stringify(entry));
  };

  const saveComment = async () => {
    if (!entry.text_id) {
      console.log('no text_id', store.state.user.text_id);
      entry.text_id = store.state.user.text_id;
    }
    checkIsEntryUpdated();
    const data = await store.post('comment', entry);
    console.log(JSON.stringify(entry.content_json));
    console.log(entry.content_html);
    if(data){
      fromDB.value = JSON.stringify(entry);
    }
  };

</script>

<style>

  .maininput div div input {
    font-weight: bold;
  }

</style>
