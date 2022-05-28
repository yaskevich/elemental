<template>

  <div style="max-width:600px;margin: 0 auto;text-align: left; padding: 0 15px 10px 15px">
    <h2><span style="color:lightgray;">({{entry.priority}})</span> {{entry.title}}</h2>
    <div>
      <n-divider title-placement="left">
        <span class="zone">translation</span>
      </n-divider>
      <p style="margin-top:-1rem;font-style:italic;">{{entry.trans}}</p>
      <n-divider title-placement="left">
        <span class="zone">brief comment</span>
      </n-divider>
      <div v-if="entry.brief_text">
        <div v-html="entry.brief_html"></div>
      </div>
      <n-divider title-placement="left">
        <span class="zone">full comment</span>
      </n-divider>
      <div v-if="entry.long_text">
        <div v-html="entry.long_html"></div>
      </div>
      <n-divider />
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
:deep(var.error) {
  display:none;
}

:deep(img){
  max-width:370px;
  max-height: 300px;
}

.zone {
  border: 1px solid lightgray;padding: 0px 5px 0px 5px;font-size: smaller; border-radius: 10% / 50%;
  font-variant: small-caps;
}

:deep(img + p) {
  color: gray;
  font-weight: bold;
  margin-top: -5px;
}
</style>
