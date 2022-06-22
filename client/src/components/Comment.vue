<template>
  <div v-if="!ready">
    loading...
    <!-- <n-spin size="large" /> -->
  </div>
  <!-- <h1>{{entry.title}}</h1> -->
  <div :style="`visibility:${ready ? 'visible' : 'hidden'}`">
    <n-card title :bordered="false" class="minimal">
      <div class="box">
        <n-space justify="center">
          <div v-for="(issue, index) in entry.issues" :key="index">
            <n-tooltip trigger="hover" placement="bottom">
              <template #trigger>
                <n-tag
                  closable
                  @close="removeIssue(issue)"
                  :color="{ color: issuesKV[issue[0]].color, textColor: 'white', }"
                >{{ issuesKV[issue[0]]?.["ru"] }}</n-tag>
              </template>
              {{ issue[1] ? ('Assigned to ' + usersKV[issue[1]].firstname + ' ' + usersKV[issue[1]].lastname) : 'Not assigned' }}
            </n-tooltip>
          </div>
        </n-space>
      </div>

      <div class="box">
        <n-space justify="center">
          <!-- <router-link :to="'/preview/'+entry.id">Preview</router-link> -->
          <n-button
            secondary
            type="info"
            :disabled="!entry.id"
            @click="showPreview(entry.id)"
          >Preview</n-button>

          <n-switch style="margin-top: .4rem;" v-model:value="entry.published" :round="false">
            <template #checked>Published</template>
            <template #unchecked>Draft</template>
          </n-switch>

          <n-button
            type="info"
            @click="saveComment"
            :disabled="!(entry.title && entry.priority)"
          >Save</n-button>
        </n-space>
      </div>

      <div class="box">
        <n-space justify="center">
          <n-input-number
            v-model:value="entry.priority"
            :validator="validateID"
            style="width:100px;"
            type="text"
            placeholder="ID"
          />

          <n-dropdown trigger="hover" @select="addTag" :options="tagsList">
            <n-button>+ tag</n-button>
          </n-dropdown>

          <n-dropdown trigger="hover" @select="addIssue" :options="issuesList">
            <n-button>+ issue</n-button>
          </n-dropdown>
        </n-space>
      </div>

      <n-text type="error" v-if="!entry.priority">ID should not be empty!</n-text>

      <div class="box">
        <n-input
          v-model:value="entry.title"
          type="text"
          placeholder="Heading"
          class="maininput"
          autofocus
        />
        <!-- <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" /> -->
      </div>

      <div class="box" v-if="boundStrings.length">
        <n-space justify="center">
          <n-dropdown
            trigger="hover"
            :options="[{ label: 'Go to text', key: 'go', stack: stack as Array<IToken>, icon: renderIcon(BackIcon) }, { label: 'Unbind span', key: 'unbind', stack: stack as Array<IToken>, icon: renderIcon(UnbindLink) }]"
            @select="handleSelect"
            v-for="(stack, index) in boundStrings"
            :key="index"
          >
            <n-button type="info" dashed size="small">
              <template v-for="item in stack" :key="item.id" style="margin-right: 5px;">
                <span v-if="item.meta !== 'ip'">{{ item.form }}&nbsp;</span>
              </template>
            </n-button>
          </n-dropdown>
        </n-space>
      </div>

      <div class="box">
        <n-tag
          v-for="tag in entry.tags"
          :key="tag"
          closable
          @close="removeTag(tag)"
          style="margin-right: 10px;"
          size="small"
        >{{ tagsList.filter((x: any) => x.key == tag)?.shift()?.["label"] }}</n-tag>
      </div>

      <n-text type="error" v-if="!entry.title">Heading should not be empty!</n-text>
      <!-- <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" /> -->
      <!-- <n-divider title-placement="center">
        <span class="zone">translation</span>
      </n-divider>-->
      <n-input v-model:value="entry.trans" type="text" placeholder="Translation" />
      <!-- <n-divider title-placement="center">
        <span class="zone">brief comment</span>
      </n-divider>-->
      <Tiptap ref="editor1Ref" editorclass="briefeditor" class="tiptapdiv" />
      <!-- <n-divider title-placement="center">
        <span class="zone">full comment</span>
      </n-divider>-->
      <!-- <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" /> -->
      <Tiptap ref="editor2Ref" editorclass="fulleditor" class="tiptapdiv" />

      <!-- <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" /> -->
      <n-space v-if="Boolean(entry.id)" justify="space-between">
        <n-popconfirm @positive-click="deleteComment">
          <template #trigger>
            <n-button type="error" :disabled="Boolean(boundStrings?.length)">Delete</n-button>
          </template> You are about to delete the comment. This action is permanent. Please confirm, if you are sure
        </n-popconfirm>
        <n-button type="info" @click="saveComment" :disabled="!(entry.title && entry.priority)">Save</n-button>
      </n-space>

      <p v-if="Boolean(boundStrings?.length)" style="font-size: 0.75rem;">
        <n-text
          type="error"
        >It is not allowed to delete a comment, if it has bound tokens. One should unbind tokens before.</n-text>
      </p>
    </n-card>
  </div>
</template>

<script setup lang="ts">

import store from '../store';
import { ref, reactive, onBeforeMount, computed, onBeforeUnmount, onMounted, ComponentPublicInstance, h } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import Tiptap from './Tiptap.vue';
import router from '../router';
// import { useRoute } from 'vue-router';
import type { DropdownOption } from 'naive-ui';
import type { Component } from 'vue';
import { NIcon } from 'naive-ui';
import { ArrowBackFilled as BackIcon, LinkOffFilled as UnbindLink } from '@vicons/material';

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
let id = Number(props.id);

interface IEntry {
  long_json: Object;
  long_html: string;
  long_text: string;
  brief_json: Object;
  brief_html: string;
  brief_text: string;
  text_id: number;
  id: number;
  issues: Array<[number, number]>;
  tags: Array<number>;
  priority: number;
  published: boolean;
  trans: string;
  title: string;
}

// const entry: IEntry = reactive<IEntry>({});
const entry: IEntry = reactive({}) as IEntry;
// ref<HTMLDivElement>();
const editor1Ref = ref<ComponentPublicInstance>();
const editor2Ref = ref<ComponentPublicInstance>();
const boundStrings = reactive([] as Array<Array<IToken>>);
const ready = ref(false);
const fromDB = ref('');
const kekRef = ref(null);

interface keyable {
  [key: string]: any;
}

const usersKV: keyable = reactive({}) as keyable;
const issuesKV: keyable = reactive({}) as keyable;

const tagsList = reactive([]);
const issuesList = reactive([]);

const removeTag = (id: number) => {
  entry.tags = entry.tags.filter(x => x !== id);
};

const addTag = (id: number) => {
  entry?.tags ? entry.tags.push(id) : (entry.tags = [id]);
};

const removeIssue = (item: [number, number]) => {
  entry.issues = entry.issues.filter(x => x[0] !== item[0] || x[0] !== item[0]);
};

const addIssue = (item: [number, number]) => {
  entry?.issues ? entry.issues.push(item) : (entry.issues = [item]);
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
  const usersData = await store.get('users');
  Object.assign(usersKV, Object.fromEntries(usersData.map((x: any) => [x.id, x])));
  // console.log("users k/v", usersKV);
  const tagData = await store.get('tags');

  Object.assign(
    tagsList,
    tagData.map((x: any) => ({ label: x.ru, key: x.id, disabled: computed(() => entry.tags?.includes(x.id)) }))
  );
  const issueData = await store.get('issues');
  const issueListData = issueData.map((x: any) => ({
    label: x.ru,
    key: x.id,
    disabled: computed(() => entry.issues?.map((d: any) => d[0]).includes(x.id)),
    children: [{
      label: '(Nobody)',
      key: [x.id, 0],
      disabled: false,
    }].concat(usersData.map((y: any) => ({
      label: `${y.firstname} ${y.lastname}`,
      key: [x.id, y.id],
      disabled: false,
    }))),
  }));
  Object.assign(issuesList, issueListData);

  Object.assign(issuesKV, Object.fromEntries(issueData.map((x: any) => [x.id, x])));
  // console.log(issuesKV);

  if (id) {
    const data = await store.get(`comment/${id}`);
    if (data.length) {
      fromDB.value = JSON.stringify(data[0]);
      Object.assign(entry, data[0]);

      const editor1: any = editor1Ref?.value;
      const editor2: any = editor2Ref?.value;

      if (editor1?.handle && editor2?.handle) {
        editor1.handle.commands.setContent(data?.[0].brief_json, false);
        editor2.handle.commands.setContent(data?.[0].long_json, false);
      } else {
        console.log("Cannot get Editor instance!");
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
    // console.log('no text_id', store.state.user.text_id);
    entry.text_id = store?.state?.user?.text_id as number || 1;
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
  const editor1: any = editor1Ref?.value;
  const editor2: any = editor2Ref?.value;

  if (editor1?.handle && editor2?.handle) {
    entry.brief_json = editor1.handle.getJSON();
    entry.brief_html = editor1.handle.getHTML();
    entry.brief_text = editor1.handle.getText();

    entry.long_json = editor2.handle.getJSON();
    entry.long_html = editor2.handle.getHTML();
    entry.long_text = editor2.handle.getText();

    checkValidMarkup(entry.brief_json);
    checkValidMarkup(entry.long_json);

    editor1.handle.commands.setContent(entry.brief_json, false);
    editor2.handle.commands.setContent(entry.long_json, false);
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

const deleteComment = async () => {
  if (entry?.id) {
    const { data } = await store.deleteById('comments', String(entry.id));
    if (data && data.length === 1 && data[0]?.id === entry.id) {
      router.push({ name: 'Comments' });
    } else {
      console.error('delete error for', entry.id);
    }
  }
};

const handleSelect = async (key: string | number, option: DropdownOption) => {
  if (option.key === 'go') {
    goToText(option.stack as Array<IToken>);
  } else {
    const tokens = (option.stack as Array<IToken>).map(x => x.id);
    const { data } = await store.post('commentstrings', { id: entry.id, tokens });
    const tokensCleared: Array<number> = (data as Array<IToken>).map(x => x.id);
    const tokenStr = tokensCleared.sort().join();

    if (data && tokenStr === tokens.sort().join()) {
      for (let i = 0; i < boundStrings.length; i++) {
        const boundStringsStr = boundStrings[i].map(y => y.id).sort().join();
        if (boundStringsStr === tokenStr) {
          boundStrings.splice(i, 1);
        }
      }
      console.log("span binding removed");
    } else {
      console.error('delete error for', entry.id);
    }
  }
}

const renderIcon = (icon: Component) => {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon)
    })
  }
};

</script>

<style>
.box {
  margin-bottom: 0.5rem;
}
.maininput div div input {
  font-weight: bold;
  min-width: 200px;
}
.tiptapdiv {
  margin-top: 2rem;
}
</style>
