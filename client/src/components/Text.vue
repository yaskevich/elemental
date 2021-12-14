<script setup lang="ts">

  import { ref, reactive, onBeforeMount, computed } from 'vue';
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
  }

  const text = reactive([] as Array<IToken>);
  const token1 = ref({} as IToken);
  const token2 = ref({} as IToken);
  const options = ref([]);
  const selectedCommentId = ref(0 as number);
  const selectedCommentTitle = ref('' as string);
  const selectedArray = ref([] as Array<IToken>);
  const showDrawer = computed(() => Boolean(token1.value?.id && token2.value?.id));

  interface IOption {
    value: number;
    label: string;
  };

  onBeforeMount(async () => {
      const data = await store.get('text', String(id));
      Object.assign(text, data);
  });

  // const drawerUpdated = (show:boolean) => {
  const drawerUpdated = () => {
    console.log('is drawer seen?', showDrawer.value);
    if (showDrawer.value) {
      const min = Math.min(token1.value.id, token2.value.id);
      const max = Math.max(token1.value.id, token2.value.id);
      // console.log(min, max);
      selectedArray.value = text.filter((x: IToken) => x.id >= min && x.id <= max);
    }
  };

  const clearSelection = () => {
    token1.value.checked = token2.value.checked = false;
    token1.value = token2.value = {} as IToken;
  };

  const bindTokensToComment = () => {
    console.log("binding is not implemented yet!");
  };

  const selectOption = (id:number) => {
    // console.log("sel comment id", id);
    selectedCommentId.value = id;
    selectedCommentTitle.value = options.value.filter((x:IOption) => x.value === id)[0]["label"];

  };

  const queryDatabase = async (chunk:string) => {
    if (chunk && chunk.length > 1) {
      const matches = await store.get('titles', String(2), { chunk: chunk });
      // console.log("matches", matches, "vs", chunk);
      options.value = matches.map((x:any) => ({ label: x.title, value: x.id } as IOption));
    }
  };

  const selectToken = (token: IToken) => {
    // console.log("token", token);
    if (token?.checked) {
      console.log('de-select', token);
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
  };

</script>

<template>

  <div class="center-column">
    <div class="left-column">
      <template v-for="(token, index) in text" :key="token.id" style="padding:.5rem;">
        <div v-if="index && token.p !== text[index-1].p" style="margin-bottom:1rem;"></div>
        <button :class="'text-button' + (token?.checked ?'selected-button':'')" size="small" :title="token.meta" v-if="token.meta !== 'ip'"   :disabled="token.meta === 'ip+'" @click="selectToken(token)" >
          {{token.form}}
        </button>
        </template>
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />

      <n-drawer v-model:show="showDrawer" placement="bottom" :on-update:show="drawerUpdated()">
        <n-drawer-content>
          <n-space vertical>
            <div style="margin: 5px;">
              <template v-for="item in selectedArray" :key="item.id">
                <span v-if="item.meta !== 'ip'" class="sequence selected-button text-button">{{item.form}}</span>
              </template>
            </div>
            <n-auto-complete clearable :options="options" placeholder="Comment title" :on-update:value="(userInput: string) => queryDatabase(userInput)" :on-select="(selectedValue: number) => selectOption(selectedValue)"
            />
            <div v-if="selectedCommentId" style="margin: 5px;">
              Comment: {{selectedCommentTitle}}
            </div>
            <div>
              <n-button @click="clearSelection">Clear tokens selection</n-button>
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

</style>
