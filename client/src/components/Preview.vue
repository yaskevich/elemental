<template>

  <div style="max-width:300px;margin: 0 auto;text-align: left;">

    <h2>{{entry.title}}</h2>
    <div>
      <div style="">
        <p style="margin-top:-1rem;">Translation: <span style="font-style:italic;">{{entry.trans}}</span></p>
        <div v-if="entry.brief_text">
          <h4>Brief comment</h4>
          <div v-html="entry.brief_html"></div>
        </div>
        <div v-if="entry.long_text">
          <h4>Full comment</h4>
          <div v-html="entry.long_html"></div>
        </div>
        <n-divider style="" /> № {{entry.priority}}
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount } from 'vue';
  import { useRoute } from 'vue-router';

  const vuerouter = useRoute();
  const id = vuerouter.params.id;

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

  const entry: IEntry = reactive({}) as IEntry;

  onBeforeMount(async () => {
    if (id) {
      const data = await store.get(`comment/${id}`);
      console.log('data from server', data);
      if (data.length) {
        console.log('data', data);
        Object.assign(entry, data[0]);
      }
    }
  });

</script>

<style scoped lang="scss">
::v-deep var.error {
  display:none;
}
</style>
