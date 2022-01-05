<script setup lang="ts">

  import { ref, reactive, onBeforeMount } from 'vue';
  import store from '../store';
  import router from '../router';

  // defineProps<{ msg: string }>()

  // const msg = "Smart Annotation Tool"

  const data = ref();

  onBeforeMount(async () => {
    data.value = await store.get('texts');
  });

  const goToText = async(id: number, title: string) => {
    // console.log("go to text", id);
    // localStorage.setItem('text_id', String(id));
    if (id && store?.state?.user){
      const { data } = await store.post('user/text', { id: id });
      console.log("change text", data);
      if (data?.id){
        store.state.user.text_id = id;
        document.title = title;
        router.push(`/comments/${id}`);
      } else {
        console.error("error", data);
      }
    }
  };

  const state = store.state;

</script>

<template>

  <!-- <h1>{{ msg }}</h1> -->
  <h3>Projects</h3>
  <div class="center-column">
    <div class="left-column">
      <!-- <p>See <code>README.md</code> for more information.</p> -->
      <div v-for="(value, key) in data" :key="key" style="padding:.5rem;" :title="value.meta">
        <!-- <n-button type="info">Info</n-button> -->
        <n-button @click="goToText(value.id, value.title)" :type="value.id === store?.state?.user?.text_id ? 'info': ''">
          {{value.author}}.&nbsp;{{value.title}}
          <!-- <n-text type="info">{{value.author}}</n-text>.&nbsp;
        «<n-text strong>{{value.title}}</n-text>» -->
        </n-button>
      </div>
      <!-- <button type="button" @click="count++">count is: {{ count }}</button> -->
      <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
      <n-descriptions label-placement="top" bordered :column="3" size="small">
        <n-descriptions-item label="Client">{{store?.version}}</n-descriptions-item>
        <n-descriptions-item label="Server">{{state?.user?.server}}</n-descriptions-item>
        <n-descriptions-item label="Commit" v-if="state?.user?.commit">
          <n-button text
                    tag="a"
                    :href="'https://github.com/yaskevich/elemental/commit/' + state.user.commit"
                    target="_blank"
                    type="primary">{{state.user.commit}}
          </n-button>
        </n-descriptions-item>
      </n-descriptions>

    </div>
    <div style="margin: 2rem;">
    <n-button text tag="a" href="https://icons8.com/icon/93125/quote" target="_blank" type="primary">Quote icon by Icons8</n-button>
    </div>
  </div>

</template>

<style scoped>

  a {
    color: #42b983;
  }

  label {
    margin: 0 0.5em;
    font-weight: bold;
  }

  code {
    background-color: #eee;
    padding: 2px 4px;
    border-radius: 4px;
    color: #304455;
  }

</style>
