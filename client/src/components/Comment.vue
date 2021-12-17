<template>

  <div v-if="!ready">
    loading...
    <!-- <n-spin size="large" /> -->
  </div>
  <!-- <h1>{{entry.title}}</h1> -->
  <div :style="`visibility:${ready?'visible':'hidden'}`">
    <div style="max-width:300px;margin: 0 auto;">

      <div class="box">
        <n-space justify="center">
          <n-tag v-for="issue in entry.issues" :key="issue" closable @close="removeIssue(issue)" :color="{ color: issuesKV[issue].color, textColor: 'white', }">
            {{issuesKV[issue]?.["ru"]}}
          </n-tag>
        </n-space>
      </div>

      <div class="box">
        <n-space justify="center">
          <!-- <router-link :to="'/preview/'+entry.id">Preview</router-link> -->
          <n-button secondary type="info" :disabled="!id" @click="showPreview(entry.id)">Preview</n-button>

          <n-switch style="margin-top: .4rem;" v-model:value="entry.published" :round="false">
            <template #checked>Published</template>
            <template #unchecked>Draft</template>
          </n-switch>

          <n-button type="info" @click="saveComment" :disabled="!(entry.title && entry.priority)">Save</n-button>
        </n-space>
      </div>

      <div class="box">
        <n-space justify="center">

          <n-input-number v-model:value="entry.priority"
                          :validator="validateID"
                          style="width:100px;"
                          type="text"
                          placeholder="ID" />

          <n-dropdown trigger="hover" @select="addTag" :options="tagsList">
            <n-button> + tag</n-button>
          </n-dropdown>

          <n-dropdown trigger="hover" @select="addIssue" :options="issuesList">
            <n-button> + issue</n-button>
          </n-dropdown>

        </n-space>
      </div>

      <n-text type="error" v-if="!entry.priority">ID should not be empty!</n-text>

      <div class="box">
        <n-input v-model:value="entry.title" type="text" placeholder="Heading" class="maininput" />
        <!-- <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" /> -->
      </div>

      <div class="box" v-if="boundStrings.length">
        <n-space justify="center">
          <n-button type="info" dashed v-for="(stack, index) in boundStrings" :key="index" size="small" @click="goToText(stack)">
            <template v-for="item in stack" :key="item.id" style="margin-right: 5px;">
                  <span v-if="item.meta !== 'ip'">
                    {{item.form}}&nbsp;
                  </span>
                </template>
          </n-button>
        </n-space>
      </div>

      <div class="box">
        <n-tag v-for="tag in entry.tags" :key="tag" closable @close="removeTag(tag)" style="margin-right: 10px;" size="small">
          {{tagsList.filter((x:any) => x.key == tag)?.shift()?.["label"]}}
        </n-tag>
      </div>

      <n-text type="error" v-if="!entry.title">Heading should not be empty!</n-text>
      <!-- <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" /> -->
      <n-input v-model:value="entry.trans" type="text" placeholder="Translation" />
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />

      <Tiptap ref="briefRef" editorclass="briefeditor" />

      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />

      <Tiptap ref="contentRef" editorclass="fulleditor" />

      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />

    </div>
  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount, computed, onBeforeUnmount, onMounted } from 'vue';
  import { onBeforeRouteLeave } from 'vue-router';
  import Tiptap from './Tiptap.vue';
  import router from '../router';
  // import { useRoute } from 'vue-router';

  interface IToken {
    id: number;
    checked?: boolean;
    form: string;
    repr: string;
    meta: string;
    p: number;
    s: number;
    comments: Array<number>;
  }

  interface Props {
    id?: string;
    tokens?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    id: '',
    tokens: '[]',
  });

  // console.log('props', props);
  let tokensToBind = JSON.parse(props.tokens) as Array<IToken>;
  // console.log('in tokens', tokensToBind);
  // const vuerouter = useRoute();
  // const id = vuerouter.params.id;
  let id = props.id;

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

  // const entry: IEntry = reactive<IEntry>({});
  const entry: IEntry = reactive({}) as IEntry;

  const fromDB = ref('');
  const briefRef = ref<HTMLDivElement>();
  const contentRef = ref<HTMLDivElement>();
  const ready = ref(false);

  const boundStrings = reactive([] as Array<Array<IToken>>);

  interface keyable {
    [key: string]: any;
  }

  const tagsList = reactive([]);
  const issuesList = reactive([]);
  const issuesKV: keyable = reactive({}) as keyable;

  const removeTag = (id: number) => {
    entry.tags = entry.tags.filter(x => x !== id);
  };

  const addTag = (id: number) => {
    entry?.tags ? entry.tags.push(id) : (entry.tags = [id]);
  };

  const removeIssue = (id: number) => {
    entry.issues = entry.issues.filter(x => x !== id);
  };

  const addIssue = (id: number) => {
    entry?.issues ? entry.issues.push(id) : (entry.issues = [id]);
  };

  const askToLeave = (event: any) => {
    if (!checkIsEntryUpdated()) return;
    event.preventDefault();
    event.returnValue = '';
  };

  const showPreview = (id: number) => {
    router.push(`/preview/${id}`);
  };

  const validateID = (x: number) => x > 0;

  onBeforeRouteLeave(() => {
    // https://next.router.vuejs.org/guide/advanced/composition-api.html#navigation-guards
    if (checkIsEntryUpdated()) {
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
    const tagData = await store.get('tags');
    // console.log("tags", tagData);
    Object.assign(
      tagsList,
      tagData.map((x: any) => ({ label: x.ru, key: x.id, disabled: computed(() => entry.tags?.includes(x.id)) }))
    );
    const issueData = await store.get('issues');
    const issueListData = issueData.map((x: any) => ({
      label: x.ru,
      key: x.id,
      disabled: computed(() => entry.issues?.includes(x.id)),
    }));
    Object.assign(issuesList, issueListData);

    Object.assign(issuesKV, Object.fromEntries(issueData.map((x: any) => [x.id, x])));
    // console.log(issuesKV);

    if (id) {
      const data = await store.get(`comment/${id}`);
      // console.log('data from server', data);
      if (data.length) {
        // console.log("data", data);
        // entryCopy = JSON.parse(JSON.stringify(data[0])) ;
        fromDB.value = JSON.stringify(data[0]);
        Object.assign(entry, data[0]);

        if ((contentRef.value as any)?.editor) {
          const longInstance = (contentRef.value as any).editor;
          const briefInstance = (briefRef.value as any).editor;
          longInstance.commands.setContent(data[0].long_json, false);
          briefInstance.commands.setContent(data[0].brief_json, false);
        }
      }
    } else {
      const { priority } = await store.get('priority');
      if (tokensToBind.length) {
        entry.title = tokensToBind
          .filter((x: IToken) => x.meta !== 'ip')
          .map((x: IToken) => x.form)
          .join(' ');
        boundStrings.push(tokensToBind);
      }
      if (priority) {
        entry.priority = priority;
      }
    }

    if (!entry.text_id) {
      console.log('no text_id', store.state.user.text_id);
      entry.text_id = store.state.user.text_id as number;
    }

    if (entry?.id) {
      const stringsList = await store.get('commentstrings', String(entry.text_id), { comment: entry.id });
      // console.log("strings list", stringsList);
      if (stringsList.length) {
        let key = '';
        let stack = [] as Array<IToken>;
        for (let item of stringsList) {
          if (item.s !== key) {
            if (stack.length) {
              boundStrings.push(stack);
              stack = [];
            }
            key = item.s;
          }
          stack.push(item);
        }
        boundStrings.push(stack);
      }
      // console.log("boundStrings", boundStrings);
    }

    ready.value = true;
  });

  const checkValidMarkup = (document: any) => {
    for (let paragraph of document.content) {
      // console.log(paragraph);
      if (paragraph?.content) {
        for (let node of paragraph.content) {
          // console.log(node.text, "type", node.type);
          if (node.marks?.length === 1 && node.marks.filter((x: any) => x.type === 'bold')?.length === 1) {
            // console.log("error", node);
            console.log('fix!');
            delete node.marks;
          }
        }
      }
    }
  };

  const checkIsEntryUpdated = () => {
    let result: boolean = false;
    if ((contentRef.value as any)?.editor) {
      const longInstance = (contentRef.value as any).editor;
      const briefInstance = (briefRef.value as any).editor;
      entry.long_json = longInstance.getJSON();
      entry.long_html = longInstance.getHTML();
      entry.long_text = longInstance.getText();
      // console.log('Content', entry.long_text);
      entry.brief_json = briefInstance.getJSON();
      entry.brief_html = briefInstance.getHTML();
      entry.brief_text = briefInstance.getText();

      checkValidMarkup(entry.long_json);
      checkValidMarkup(entry.brief_json);

      longInstance.commands.setContent(entry.long_json, false);
      briefInstance.commands.setContent(entry.brief_json, false);
    }
    // console.log("1", fromDB.value);
    // console.log("2", JSON.stringify(entry));

    if (entry.id) {
      result = !(fromDB.value === JSON.stringify(entry));
    } else {
      result = Boolean(entry?.title || entry?.trans || entry?.long_text || entry?.brief_text);
    }
    // console.log("update check result", result);
    return result;
  };

  const saveComment = async () => {
    // console.log(JSON.stringify(entry.long_json));
    // console.log(entry.long_html);

    if (checkIsEntryUpdated()) {
      console.log('changes → DB');
      const data = await store.post('comment', entry);
      if (data?.data?.id) {
        entry.id = data.data.id;
        fromDB.value = JSON.stringify(entry);
        router.replace('/comment/' + entry.id);
        const boundTokensNumber = tokensToBind.length;
        if (boundTokensNumber) {
          const result = await store.post('strings', { tokens: tokensToBind.map((x: IToken) => x.id), id: data.data.id });
          // console.log("bind tokens", result);
          if (boundTokensNumber === result.data?.length) {
            console.log(`${boundTokensNumber} tokens were bound!`);
            tokensToBind = [] as Array<IToken>;
          } else {
            console.error('tokens were not bound!');
          }
        }
      }
    } else {
      console.log('no changes – spare traffic...');
    }
  };
  const goToText = (stringTokens: Array<IToken>) => {
    router.push({ name: 'Text', params: { tokens: JSON.stringify(stringTokens) } });
  };

</script>

<style>

  .box {
    margin-bottom: 0.5rem;
  }
  .maininput div div input {
    font-weight: bold;
  }

</style>
