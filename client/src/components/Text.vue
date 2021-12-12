<script setup lang="ts">

  import { ref, reactive, onBeforeMount } from 'vue';
  import store from '../store';
  import router from '../router';
  import { useRoute } from 'vue-router';

  const vuerouter = useRoute();
  const id = vuerouter.params.id || store.state.user.text_id;

  interface IToken {
    id: number;
    comment?: string;
    form: string;
    repr: string;
    meta: string;
    p: number;
    s: number;
  };

  const text = reactive([] as Array<IToken>);
  const token1 = ref({} as IToken);
  const token2 = ref({} as IToken);

  onBeforeMount(async () => {
    const data = await store.get('text', String(id));
    Object.assign(text, data);
  });

  const selectToken = (token: IToken) => {
    // console.log("token", token);
    if (token?.comment){
        console.log("de-select", token);
        if (token1.value?.id === token.id){
          token1.value = token2.value;
          token2.value = {} as IToken;
        } else {
          token2.value = {} as IToken;
        }
        token.comment = '';
    } else {
        // console.log("select", token);
      if(!token1.value?.id) {
          token.comment = '42';
          token1.value = token;
      } else {
        if (token2.value?.id){
          // console.log("set!");
          const d1 = Math.abs(token.id - token1.value.id);
          const d2 = Math.abs(token.id - token2.value.id);
          if (d1 < d2) {
            token.comment = '42';
            token1.value.comment = '';
            token1.value = token;
          } else {
            token.comment = '42';
            token2.value.comment = '';
            token2.value = token;
          }
          // console.log("d1", d1);
          // console.log("d2", d2);
        } else if (token.s === token1.value.s){
            token2.value = token;
            token.comment = '42';
            // console.log("sel", token1.value);
        } else {
          console.log("nope!");
        }

      }

    }
  }



</script>

<template>

  <div class="center-column">
    <div class="left-column">
      <template v-for="(token, index) in text" :key="token.id" style="padding:.5rem;">
      <div v-if="index && token.p !== text[index-1].p" style="margin-bottom:1rem;"></div>
      <button :class="'text-button' + (token?.comment?.length?'selected-button':'')" size="small" :title="token.meta" v-if="token.meta !== 'pt'"   :disabled="token.meta === 'pt+'" @click="selectToken(token)" >
        {{token.form}}
      </button>
      </template>
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
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
.selected-button{
  border: solid 1px red;
}
</style>
