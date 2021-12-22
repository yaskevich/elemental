<script setup lang="ts">

  import { ref, reactive, onBeforeMount, onUpdated, nextTick, computed } from 'vue';
  import store from '../store';
  import router from '../router';
  import { useRoute } from 'vue-router';

  const vuerouter = useRoute();
  const id = vuerouter.params.id || store.state.user.text_id;

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

  interface IOption {
    value: number;
    label: string;
  }

  interface IRailStyle {
    focused: boolean;
    checked: boolean;
  }

  interface keyable {
    [key: string]: any;
  }

  interface Props {
    tokens?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    tokens: '[]',
  });

  // console.log('text props', props);

  let highlightedTokens: Array<number> = JSON.parse(props.tokens).map((x: IToken) => x.id);

  const commentsToStore = ref([] as Array<number>);
  const showModal = ref(false);
  const singleMode = ref(false);
  const inspectMode = ref(false);
  const isLoaded = ref(false);
  const commentsObject = reactive({} as keyable);
  const text = reactive([] as Array<IToken>);
  const selectedToken = ref({} as IToken);
  const token1 = ref({} as IToken);
  const token2 = ref({} as IToken);
  const options = ref([]);
  const selectedCommentId = ref(0 as number);
  const selectedCommentTitle = ref('' as string);
  const selectedArray = ref([] as Array<IToken>);
  const showDrawer = computed(() =>
    singleMode.value ? Boolean(token1.value?.id) : Boolean(token1.value?.id && token2.value?.id)
  );

  const scrollTo = (id: number) => {
    let element = document.querySelector(`#id${id}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  onUpdated(async () => {
    if (highlightedTokens.length) {
      nextTick(() => {
        scrollTo(highlightedTokens[0]);
      });
    }
  });

  onBeforeMount(async () => {
    // console.log('before mount');
    const data = await store.get('text', String(id));
    Object.assign(text, data);
    const textComments = await store.get('textcomments', String(id));
    Object.assign(commentsObject, ...textComments.map((item: any) => ({ [item.id]: item })));
    isLoaded.value = true;
  });

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
    router.push({ name: 'Comment', params: { tokens: JSON.stringify(selectedArray.value) } });
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
    if (chunk && chunk.replace(/ /g, '').length > 1) {
      const matches = await store.get('titles', String(store.state.user.text_id), { chunk: chunk });
      // console.log("matches", matches, "vs", chunk);
      options.value = matches.map((x: any) => ({ label: `${x.priority}. ${x.title}`, value: x.id } as IOption));
    }
  };

  const selectToken = (token: IToken, e: MouseEvent) => {
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
  };

  const railStyle = (stateObject: IRailStyle) => {
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

  const goToComment = (comment:number) => {
    // console.log("click", comment);
    router.push({ name: 'Comment', params: { id: comment } });
  }

</script>

<template>

  <div class="center-column" v-if="isLoaded">
    <div class="left-column">
      <n-space justify="space-between" style="margin-right: 2rem;margin-left: 2rem;">
        <n-button :color="inspectMode?'#ff69b4':'#8a2be2'" size="tiny" @click="inspectMode = !inspectMode">{{inspectMode?'Inspect':'Select'}}</n-button>
        <n-switch :round="false" :rail-style="railStyle" v-model:value="singleMode" :style="`visibility: ${!inspectMode? 'visible': 'hidden'}`">
          <template #checked>Unit</template>
          <template #unchecked>Sequence</template>
        </n-switch>
      </n-space>
      <n-divider style="text-align: center; margin:auto;padding:1rem;" />
      <n-modal v-model:show="showModal"
               preset="dialog"
               :title="'Bound comments for “' + selectedToken.form + '”'"
               positive-text="Submit"
               negative-text="Cancel"
               @positive-click="submitModal">
        <n-checkbox-group v-model:value="commentsToStore">
          <template  v-for="(commentId, index) in selectedToken.comments" :key="index">
            <n-checkbox :value="commentId" :label="commentsObject[String(commentId)]['title']" />
            <n-button ghost type="primary" size="tiny" @click="goToComment(commentId)">Comment</n-button>
          </template>
        </n-checkbox-group>

      </n-modal>
      <div>
        <template v-for="(token, index) in text" :key="token.id" style="padding:.5rem;">
                        <div v-if="index && token.p !== text[index-1].p" style="margin-bottom:1rem;"></div>
                        <button :id="`id${token.id}`" :class="`text-button ${token?.checked ?'selected-button':''}  ${token?.comments?.length? 'commented': ''} ${highlightedTokens.length && highlightedTokens.includes(token.id) ? 'highlighted': ''}`" size="small" :title="token.comments.map(x=>commentsObject[String(x)]['title']).join('•')" v-if="token.meta !== 'ip'"   :disabled="token.meta === 'ip+'" @click="selectToken(token, $event)" >
                        {{token.form}}<sup v-if="token?.comments?.length">{{token.comments.length}}</sup>
                        </button>
                      </template>
      </div>
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />

      <n-drawer v-model:show="showDrawer" placement="bottom" :on-update:show="drawerUpdated()">
        <n-drawer-content>
          <n-space vertical>
            <div style="margin: 5px;">
              <template v-for="item in selectedArray" :key="item.id">
                              <span v-if="item.meta !== 'ip'" class="sequence selected-button text-button">{{item.form}}</span>
                            </template>
            </div>
            <n-auto-complete clearable
                             :options="options"
                             placeholder="Comment title or ID"
                             :on-update:value="(userInput: string) => queryDatabase(userInput)"
                             :on-select="(selectedValue: number) => selectOption(selectedValue)" />
            <div v-if="selectedCommentId" style="margin: 5px;">
              Comment: {{selectedCommentTitle}}
            </div>
            <div>
              <n-button @click="clearSelection">Clear tokens selection</n-button>
              &nbsp;
              <n-button @click="createComment" type="warning">Bind tokens to new comment</n-button>
              &nbsp;
              <n-button @click="bindTokensToComment" v-if="selectedCommentId" type="success">Bind</n-button>
            </div>
          </n-space>
        </n-drawer-content>
      </n-drawer>
    </div>
  </div>

</template>

<style scoped>

  .text-button {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    background-color: transparent;
    background-repeat: no-repeat;
    border: none;
    cursor: pointer;
    overflow: hidden;
    outline: none;
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

</style>
