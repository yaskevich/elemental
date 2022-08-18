<template>
  <n-card title :bordered="false" class="minimal" v-if="ready">
    <n-space vertical size="large">
      <n-space justify="center">
        <div v-for="(issue, index) in comment.issues" :key="'issue' + index">
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

      <n-space justify="center">
        <n-button
          secondary
          type="info"
          :disabled="!comment.id"
          @click="showPreview(comment.id)"
        >Preview</n-button>

        <n-switch style="margin-top: .4rem;" v-model:value="comment.published" :round="false">
          <template #checked>Published</template>
          <template #unchecked>Draft</template>
        </n-switch>

        <n-button
          type="info"
          @click="saveComment"
          :disabled="!(comment.title && comment.priority)"
        >Save</n-button>
      </n-space>

      <n-space justify="center">
        <n-input-number
          v-model:value="comment.priority"
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

      <n-text type="error" v-if="!comment.priority">ID should not be empty</n-text>
      <n-space justify="center">
        <div v-for="(tag, index) in comment.tags" :key="index">
          <n-tag
            closable
            @close="removeTag(tag)"
            style="margin-right: 10px;"
            size="small"
          >{{ tagsList.filter((x: any) => x.key == tag)?.shift()?.["label"] }}</n-tag>
        </div>
      </n-space>

      <n-input
        v-model:value="comment.title"
        type="text"
        placeholder="Heading"
        class="maininput"
        autofocus
      ></n-input>

      <n-text type="error" v-if="!comment.title">Heading should not be empty!</n-text>

      <n-space justify="center" v-if="boundStrings.length">
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

      <template v-for="(item, index) in scheme" :key="item.id">
        <n-input
          v-if="item.type === 'line'"
          v-model:value="comment.entry[item.id]"
          type="text"
          :placeholder="item.title"
        />

        <Tiptap
          v-if="item.type === 'rich'"
          :ref="el => { editorRefs[item.id] = el }"
          :editorclass="index % 2 ? 'even' : 'odd'"
          :sources="sources"
          :content="comment.entry[item.id]"
          :images="images"
        />
      </template>

      <n-space v-if="Boolean(comment.id)" justify="space-between">
        <n-popconfirm @positive-click="deleteComment">
          <template #trigger>
            <n-button type="error" :disabled="Boolean(boundStrings?.length)">Delete</n-button>
          </template> You are about to delete the comment. This action is permanent. Please confirm, if you are sure
        </n-popconfirm>
        <n-button
          type="info"
          @click="saveComment"
          :disabled="!(comment.title && comment.priority)"
        >Save</n-button>
      </n-space>

      <n-text
        v-if="Boolean(boundStrings?.length)"
        style="font-size: 0.75rem;"
        type="error"
      >It is not allowed to delete a comment, if it has bound tokens. One should unbind tokens before.</n-text>
    </n-space>
  </n-card>
  <div v-else>
    loading...
    <!-- <n-spin size="large" /> -->
  </div>
</template>

<script setup lang="ts">

import store from '../store';
import { ref, reactive, onBeforeMount, computed, onBeforeUnmount, onMounted, ComponentPublicInstance, h, toRaw, watch, onRenderTracked, onRenderTriggered } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useMessage } from 'naive-ui';
import Tiptap from './Tiptap.vue';
import router from '../router';
// import { useRoute } from 'vue-router';
import type { DropdownOption } from 'naive-ui';
import type { Component } from 'vue';
import { NIcon } from 'naive-ui';
import { ArrowBackFilled as BackIcon, LinkOffFilled as UnbindLink } from '@vicons/material';
// import type { UploadFileInfo } from 'naive-ui';

const props = withDefaults(defineProps<{ id?: string; tokens?: string; }>(), {
  id: '',
  tokens: '[]',
});
const message = useMessage();
const scheme = store?.state?.user?.text?.scheme || [];
const textId = store?.state?.user?.text_id;
let tokensToBind = JSON.parse(props.tokens) as Array<IToken>;
let id = Number(props.id);

const comment = reactive({ entry: {} }) as IComment;
const comment0 = reactive({}) as IComment;

const boundStrings = reactive<Array<Array<IToken>>>([]);
const ready = ref(false);
const sources = reactive<Array<IBib>>([]);
const images = reactive<IImageItem[]>([]); // UploadFileInfo

const usersKV = reactive<keyable>({});
const issuesKV = reactive<keyable>({});
const tagsList = reactive([]);
const issuesList = reactive([]);
// ref<HTMLDivElement>();
const editorRefs = reactive<keyable>({});
// onRenderTracked((event) => {
//   //  console.log('renderTracked:', { key, target, type });

// });

// onRenderTriggered((event) => {
//   //  console.log('renderTriggered:', { key, target, type });
//   // debugger
// });

// watch(editorRefs, (selection, prevSelection) => {
//   console.log("WATCH", selection)
//   console.log("W", editorRefs['brief']?.handle.getJSON());
//   console.log("W", editorRefs['article']?.handle.getJSON());
// });

// watch(store.state, (selection, prevSelection) => {
//   console.log("WATCH!!!", selection)
// });

const removeTag = (id: number) => {
  comment.tags = comment.tags.filter(x => x !== id);
};

const addTag = (id: number) => {
  comment?.tags ? comment.tags.push(id) : (comment.tags = [id]);
};

const removeIssue = (item: [number, number]) => {
  comment.issues = comment.issues.filter(x => x[0] !== item[0] || x[0] !== item[0]);
};

const addIssue = (item: [number, number]) => {
  comment?.issues ? comment.issues.push(item) : (comment.issues = [item]);
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
  const [sourcesData, usersData, issueData, tagData, imagesData] = await Promise.all([
    store.get('source'), store.get('users'), store.get('issues'), store.get('tags'), store.get(`img/${textId}`),
  ]);

  Object.assign(images, imagesData.sort((a: any, b: any) => (new Date(a.created)).getTime() - (new Date(b.created)).getTime()));

  Object.assign(sources, sourcesData.map((x: any, i: number) => ({ ...x, label: `${x.citekey.padEnd(10, '.')} ${x.bibtex.title}`, value: i })));
  Object.assign(usersKV, Object.fromEntries(usersData.map((x: any) => [x.id, x])));
  Object.assign(
    tagsList,
    tagData.map((x: any) => ({ label: x.ru, key: x.id, disabled: computed(() => comment.tags?.includes(x.id)) }))
  );
  const issueListData = issueData.map((x: any) => ({
    label: x.ru,
    key: x.id,
    disabled: computed(() => comment.issues?.map((d: any) => d[0]).includes(x.id)),
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

  if (id) {
    const [commentData, stringsList] = await Promise.all([store.get(`comment/${id}`), store.get('commentstrings', String(textId), { comment: id }),]);

    if (commentData.length) {
      const commentStored = commentData?.[0];
      Object.assign(comment0, JSON.parse(JSON.stringify(toRaw(commentStored))));
      Object.assign(comment, commentStored);
    }

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
      // console.log("boundStrings", boundStrings);
    }

  } else {
    console.log("no ID!");

    const { priority } = await store.get('priority');

    if (tokensToBind.length) {
      comment.title = tokensToBind
        .filter((x: IToken) => x.meta !== 'ip')
        .map((x: IToken) => x.form)
        .join(' ');
      boundStrings.push(tokensToBind);
    }

    if (priority) {
      comment.priority = priority;
    }

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
  let result = false;

  scheme.filter(x => x.type === 'rich').map(x => {
    // console.log(x.id, commentStored.entry[x.id]);
    if (editorRefs[x.id]?.handle) {
      comment.entry[x.id] = editorRefs[x.id].handle.getJSON();
      checkValidMarkup(comment.entry[x.id]);
      editorRefs[x.id].handle.commands.setContent(comment.entry[x.id], false);
    }
  });

  if (comment?.id) {

    for (let key0 in comment0) {
      const key = key0 as keyof IComment;
      const val0 = comment0[key];
      const val = comment[key];
      // console.log(`${key}0`, toRaw(val0))
      // console.log(`${key}1`, toRaw(val));

      if (JSON.stringify(val0) !== JSON.stringify(val)) {
        console.log("change:", key);
        // console.log("change:", key, toRaw(val0), '→', toRaw(val));
        // console.log("change:", key, '\n\n', JSON.stringify(toRaw(val0)), '\n\n', JSON.stringify(toRaw(val)));
        result = true;
        break;
      }

    }
  } else {
    result = Boolean(comment?.title);
  }
  // console.log("update check result", result);
  return result;
};

const saveComment = async () => {
  if (checkIsEntryUpdated()) {
    console.log('changes → DB');
    // console.log(toRaw(comment));

    if (!comment?.text_id && textId) {
      comment.text_id = textId;
    }

    const { data } = await store.post('comment', comment);
    if (data?.id) {
      comment.id = data.id;
      Object.assign(comment0, JSON.parse(JSON.stringify(toRaw(comment))));
      router.replace('/comment/' + comment.id);
      const boundTokensNumber = tokensToBind.length;
      if (boundTokensNumber) {
        const result = await store.post('strings', { tokens: tokensToBind.map((x: IToken) => x.id), id: data.id });
        // console.log("bind tokens", result);
        if (boundTokensNumber === result.data?.length) {
          console.log(`${boundTokensNumber} tokens were bound!`);
          tokensToBind = [] as Array<IToken>;
        } else {
          console.error('tokens were not bound!');
        }
      }
    } else {
      console.log(data);
      message.error(`Changes were not saved: ${data?.error?.detail}`, { duration: 5000 });
    }
  } else {
    console.log('no changes – spare traffic...');
  }
};

const goToText = (stringTokens: Array<IToken>) => {
  router.push({ name: 'Text', params: { tokens: JSON.stringify(stringTokens) } });
};

const deleteComment = async () => {
  if (comment?.id) {
    const { data } = await store.deleteById('comments', String(comment.id));
    if (data && data.length === 1 && data[0]?.id === comment.id) {
      router.push({ name: 'Comments' });
    } else {
      console.error('delete error for', comment.id);
    }
  }
};

const handleSelect = async (key: string | number, option: DropdownOption) => {
  if (option.key === 'go') {
    goToText(option.stack as Array<IToken>);
  } else {
    const tokens = (option.stack as Array<IToken>).map(x => x.id);
    const { data } = await store.post('commentstrings', { id: comment.id, tokens });
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
      console.error('delete error for', comment.id);
    }
  }
};

const renderIcon = (icon: Component) => {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon)
    })
  }
};

</script>

<style>
.maininput div div input {
  font-weight: bold;
  min-width: 200px;
}
</style>
