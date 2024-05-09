<template>
  <div v-if="isLoaded" class="left" style="padding: 0 10px 20px 10px">
    <n-space vertical justify="center" class="minimal" v-if="!store?.state?.user?.text_id">
      <n-alert title="No text" type="warning">Select specific text before (at Home screen)</n-alert>
    </n-space>
    <div v-else>
      <n-space vertical class="minimal" justify="center">
        <n-space justify="center">
          <n-radio-group @change="handleChange" v-model:value="annotationMode" name="radiogroup">
            <n-radio v-for="item in items" :key="item.value" :value="item.value" :label="item.label"
              :disabled="item.disabled" />
          </n-radio-group>
        </n-space>
        <n-space justify="center" size="large" v-if="annotationMode === 'comment'">
          <n-switch :round="false" :rail-style="actStyle" v-model:value="inspectMode" :disabled="!store.hasRights()">
            <template #checked>Inspect</template>
            <template #unchecked>Select</template>
          </n-switch>

          <n-switch :round="false" :rail-style="selStyle" :disabled="!store.hasRights()" v-model:value="singleMode"
            :style="`visibility: ${!inspectMode ? 'visible' : 'hidden'}`">
            <template #checked>Unit</template>
            <template #unchecked>Sequence</template>
          </n-switch>
        </n-space>
        <n-space justify="center" v-if="annotationMode === 'format'">
          <n-button-group size="small">
            <n-button @click="formattingMode = 'h1'" :type="formattingMode === 'h1' ? 'success' : 'default'"
              :disabled="!store.hasRights()">
              <template #icon>
                <n-icon :component="TitleFilled" />
              </template>
              Heading 1
            </n-button>
            <n-button @click="formattingMode = 'bold'" :type="formattingMode === 'bold' ? 'success' : 'default'"
              :disabled="!store.hasRights()">
              <template #icon>
                <n-icon :component="FormatBoldFilled" />
              </template>
              Bold
            </n-button>
            <n-button @click="formattingMode = 'italic'" :type="formattingMode === 'italic' ? 'success' : 'default'"
              :disabled="!store.hasRights()">
              <template #icon>
                <n-icon :component="FormatItalicFilled" />
              </template>
              Italic
            </n-button>
            <n-button @click="formattingMode = 'clear'" :type="formattingMode === 'clear' ? 'success' : 'default'"
              :disabled="!store.hasRights()">
              <template #icon>
                <n-icon :component="ClearFilled" />
              </template>
              Clear
            </n-button>
          </n-button-group>
        </n-space>
        <n-divider />
      </n-space>

      <!-- <n-divider /> -->

      <n-modal v-model:show="showModal" :preset="store.hasRights() ? 'dialog' : 'card'"
        :title="'Bound comments for “' + selectedToken.form + '”'" positive-text="Submit" negative-text="Cancel"
        @positive-click="submitModal" style="max-width: 500px;">
        <n-checkbox-group v-model:value="commentsToStore" :disabled="!store.hasRights()">
          <template v-for="(commentId, index) in selectedToken.comments" :key="index">
            <n-checkbox :value="commentId" :label="commentsObject[String(commentId)]['title']" />
            <n-button ghost type="primary" size="tiny" @click="goToComment(commentId)">Comment</n-button>
          </template>
        </n-checkbox-group>
      </n-modal>

      <n-scrollbar trigger="none" style="max-height: 600px">
        <div style="padding: 0 5px 0 5px">
          <template v-for="(token, index) in text" :key="token.id" style="padding: 0.5rem">
            <div v-if="index && token.p !== text[index - 1].p" style="margin-bottom: 1rem"></div>
            <template v-if="token.meta !== 'ip' && index && token.p === text[index - 1].p"></template>
            <button :id="`id${token.id}`" :class="`text-button ${token.meta === 'ip' ? (['«', '('].includes(token.repr) ? 'right' : 'left') : 'token'
    } ${token?.checked ? 'selected-button' : ''}  ${token?.comments?.length ? 'commented' : ''} ${highlightedTokens.length && highlightedTokens.includes(token.id) ? 'highlighted' : ''
    } ${token?.fmt?.join(' ') || ''}`" size="small" :title="store.state.user?.text?.grammar
    ? token?.pos
    : token.comments.map(x => commentsObject[String(x)]['title']).join('•')
    " :disabled="token.meta === 'ip+'" @click="selectToken(token, $event)" :style="annotationMode === 'grammar' &&
    store.state.user?.text?.grammar && token?.pos
    ? {
      'background-color': grammarScheme?.[token.pos]?.['color'] || 'gray',
      color: grammarScheme?.[token.pos]?.['font'] || 'black',
    }
    : ''
    ">
              {{ token.repr }}<sup v-if="token?.comments?.length">{{ token.comments.length }}</sup>
            </button>
          </template>
        </div>
      </n-scrollbar>

      <n-drawer v-model:show="showDrawer" placement="bottom" :on-update:show="drawerUpdated()">
        <n-drawer-content>
          <n-space vertical>
            <div style="margin: 5px">
              <template v-for="item in selectedArray" :key="item.id">
                <span v-if="item.meta !== 'ip'" class="sequence selected-button text-button">{{ item.form }}</span>
              </template>
            </div>
            <n-auto-complete clearable :options="options" placeholder="Comment title or ID"
              :on-update:value="(userInput: string) => queryDatabase(userInput)"
              :on-select="(selectedValue: number) => selectOption(selectedValue)" />
            <div v-if="selectedCommentId" style="margin: 5px">Comment: {{ selectedCommentTitle }}</div>
            <n-space>
              <n-button @click="clearSelection">Clear tokens selection</n-button>
              <n-button @click="createComment" type="warning">Bind tokens to new comment</n-button>
              <n-button @click="bindTokensToComment" v-if="selectedCommentId" type="success">Bind</n-button>
            </n-space>
          </n-space>
        </n-drawer-content>
      </n-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, onUpdated, nextTick, computed } from 'vue';
import store from '../store';
import router from '../router';
import { useRoute } from 'vue-router';
import { TitleFilled, FormatBoldFilled, FormatItalicFilled, ClearFilled } from '@vicons/material';

const vuerouter = useRoute();
const highlightedTokens = vuerouter.query?.tokens ? String(vuerouter.query.tokens).split(',').map(Number) : [];

// console.log('tokens to highlight', highlightedTokens);

const grammarScheme = reactive({} as ICategoriesScheme);
const commentsToStore = ref([] as Array<number>);
const showModal = ref(false);
const singleMode = ref(false);
const inspectMode = ref(!store.hasRights());
const isLoaded = ref(false);
const commentsObject = reactive({} as keyable);
const text = reactive([] as Array<IToken>);
const selectedToken = ref({} as IToken);
const token1 = ref({} as IToken);
const token2 = ref({} as IToken);
const options = ref([]);
const selectedCommentId = ref(0);
const selectedCommentTitle = ref('');
const selectedArray = ref([] as Array<IToken>);
const showDrawer = computed(() =>
  singleMode.value ? Boolean(token1.value?.id) : Boolean(token1.value?.id && token2.value?.id)
);
const formattingMode = ref('');

onUpdated(async () => {
  if (highlightedTokens.length) {
    nextTick(() => {
      store.scrollTo('id' + highlightedTokens[0]);
    });
  }
});

const loadText = async () => {
  isLoaded.value = false;
  // const userInfo = store.state.user;
  // const textInfo = store.state.user?.text;
  // console.log("text info", userInfo, textInfo);
  // console.log("grammar status", store.state.user?.text);
  if (store?.state?.user?.text_id) {
    const currentTextId = String(store?.state?.user?.text_id);
    const data = await store.get('text', currentTextId, { grammar: store.state.user?.text?.grammar });
    Object.assign(text, data);
    // console.log('content', Boolean(data[0]?.pos), data[0]);

    if (store.state.user?.text?.grammar && annotationMode.value === 'grammar') {
      const grammar = await store.get('grammar');
      console.log('grammar', grammar);
      Object.assign(grammarScheme, grammar);
    }

    const textComments = await store.get('textcomments', currentTextId);
    Object.assign(commentsObject, ...textComments.map((item: any) => ({ [item.id]: item })));
  }

  isLoaded.value = true;
};

onBeforeMount(async () => await loadText());

const handleChange = async () => {
  console.log("switch mode");
  await loadText();
};


// const drawerUpdated = (show:boolean) => {
const drawerUpdated = () => {
  // console.log('is drawer seen?', showDrawer.value);
  if (showDrawer.value) {
    if (singleMode.value) {
      selectedArray.value = [token1.value];
    } else {
      const min = Math.min(token1.value.id, token2.value.id);
      const max = Math.max(token1.value.id, token2.value.id);
      // console.log(min, max);
      selectedArray.value = text.filter((x: IToken) => x.id >= min && x.id <= max);
    }
  }
};

const createComment = () => {
  const tokens = selectedArray.value.map(({ id }) => id).join();
  router.push({ name: 'Comment', query: { tokens } });
};

const clearSelection = () => {
  token1.value.checked = token2.value.checked = false;
  token1.value = token2.value = {} as IToken;
};

const bindTokensToComment = async () => {
  const ids = selectedArray.value.map((x: IToken) => x.id);
  const { data } = await store.post('strings', { tokens: ids, id: selectedCommentId.value });
  if (ids.length === data?.length) {
    for (let item of selectedArray.value) {
      item.comments.push(selectedCommentId.value);
    }
    commentsObject[String(selectedCommentId.value)] = {
      id: selectedCommentId.value,
      title: selectedCommentTitle.value,
    };

    clearSelection();
  } else {
    console.error('bind', ids, data);
  }
};

const selectOption = (id: number) => {
  // console.log("sel comment id", id);
  selectedCommentId.value = id;
  selectedCommentTitle.value = options.value.filter((x: IOption) => x.value === id)[0]['label'];
};

const queryDatabase = async (chunk: string) => {
  if (chunk && chunk.replace(/ /g, '').length > 1 && store?.state?.user?.text_id) {
    const matches = await store.get('titles', String(store.state.user.text_id), { chunk: chunk });
    // console.log("matches", matches, "vs", chunk);
    options.value = matches.map((x: any) => ({ label: `${x.priority}. ${x.title}`, value: x.id } as IOption));
  }
};

const selectToken = async (token: IToken, e: MouseEvent) => {
  // console.log(annotationMode.value);
  if (annotationMode.value === 'comment') {
    if (inspectMode.value || e.shiftKey) {
      if (token?.comments?.length) {
        // console.log('inspect', token);
        selectedToken.value = token;
        commentsToStore.value = token.comments;
        showModal.value = true;
      } else {
        console.log('no bound comments');
      }
    } else {
      // console.log("token", token);
      if (token?.checked) {
        // console.log('de-select', token);
        if (token1.value?.id === token.id) {
          token1.value = token2.value;
          token2.value = {} as IToken;
        } else {
          token2.value = {} as IToken;
        }
        token.checked = false;
      } else {
        // console.log("select", token);
        if (!token1.value?.id) {
          token.checked = true;
          token1.value = token;
        } else {
          if (token2.value?.id && token.s === token1.value.s && token.s === token2.value.s) {
            // console.log("set!");
            const d1 = Math.abs(token.id - token1.value.id);
            const d2 = Math.abs(token.id - token2.value.id);
            if (d1 < d2) {
              token.checked = true;
              token1.value.checked = false;
              token1.value = token;
            } else {
              token.checked = true;
              token2.value.checked = false;
              token2.value = token;
            }
            // console.log("d1", d1);
            // console.log("d2", d2);
          } else if (token.s === token1.value.s) {
            token2.value = token;
            token.checked = true;
            // console.log("sel", token1.value);
          } else {
            console.log('nope!');
          }
        }
      }
    }
  } else if (annotationMode.value === 'format') {
    if (formattingMode.value === 'clear') {
      token.fmt = [];
    } else if (formattingMode.value === 'h1') {
      token.fmt = ['h1'];
    } else {
      token.fmt.includes('h1') ? (token.fmt = [formattingMode.value]) : token.fmt.push(formattingMode.value);
    }
    // console.log('format action', token.id, token.fmt);
    if (formattingMode.value) {
      const { data } = await store.post('format', token);
      console.log('format result', data);
    }
  }
};

const actStyle = (stateObject: IRailStyle) => {
  const { focused, checked }: IRailStyle = stateObject;
  const style = {} as any;
  if (checked) {
    style.background = '#ff69b4';
    if (focused) {
      style.boxShadow = '0 0 0 2px #d0305040';
    }
  } else {
    style.background = '#8a2be2';
    if (focused) {
      style.boxShadow = '0 0 0 2px #2080f040';
    }
  }
  return style;
};

const selStyle = (stateObject: IRailStyle) => {
  const { focused, checked }: IRailStyle = stateObject;
  const style = {} as any;
  if (checked) {
    style.background = '#d03050';
    if (focused) {
      style.boxShadow = '0 0 0 2px #d0305040';
    }
  } else {
    style.background = '#2080f0';
    if (focused) {
      style.boxShadow = '0 0 0 2px #2080f040';
    }
  }
  return style;
};

const submitModal = async () => {
  showModal.value = false;
  const { data } = await store.post('tokencomments', { id: selectedToken.value.id, comments: commentsToStore.value });
  if (data?.id === selectedToken.value.id) {
    selectedToken.value.comments = commentsToStore.value;
  } else {
    console.error(selectedToken.value.id, selectedToken.value.comments, '→', commentsToStore.value, 'data', data);
  }
};

const goToComment = (comment: number) => {
  // console.log("click", comment);
  router.push({ name: 'Comment', params: { id: comment } });
};

const annotationMode = ref('comment');
const items = [
  {
    value: 'comment',
    label: 'Comments',
    disabled: false,
  },
  {
    value: 'format',
    label: 'Formatting',
    disabled: false,
  },
  {
    value: 'grammar',
    label: 'Grammar',
    // disabled: true,
  },
];
</script>

<style scoped>
.text-button {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  background-color: transparent;
  background-repeat: no-repeat;
  border: none;
  cursor: pointer;
  overflow: hidden;
  outline: none;
  font-size: 1rem;
}

.token {
  padding: 0 5px 0 5px;
}

.left {
  margin-left: -5px;
}

.right {
  margin-right: -5px;
}

.selected-button {
  border: solid 1px black;
}

.sequence {
  font-weight: bold;
  /* color: darkred; */
  padding: 5px;
  margin-right: 5px;
  border-radius: 5px;
}

.commented {
  color: darkred;
  background-color: pink;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.highlighted {
  animation: blink 1s linear 1;
  background-color: yellow;
}

.bold {
  font-weight: bold;
}

.italic {
  font-style: italic;
}

.h1 {
  font-size: 1.2rem;
  font-weight: 300;
}
</style>
