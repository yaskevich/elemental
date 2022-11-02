<template>
  <n-card title="Change" class="minimal left" v-if="isLoaded">
    <template #header>
      <span style="text-transform: capitalize">{{ record?.table_name }}</span> • <n-time :time="timestamp" /> • ID
      {{ record?.record_id }}
    </template>
    <n-space vertical size="large">
      <n-space justify="space-between">
        <n-text>{{ user?.firstname }} {{ user?.lastname }} </n-text>
        <n-text><n-time type="relative" :time="timestamp" /> </n-text>
      </n-space>

      <table style="width: 100%; border-collapse: collapse">
        <tr id="title">
          <td class="bordered bold">Title</td>
          <td class="bordered">{{ record?.data0?.title }}</td>
          <td class="bordered">{{ record?.data1?.title }}</td>
        </tr>
        <tr :id="field.id" v-for="field in store?.state?.user?.text?.scheme">
          <td class="bordered bold">{{ field.title }}</td>
          <td
            class="bordered"
            v-html="
              field.type === 'line'
                ? record?.data0?.entry?.[field.id]
                : store.convertJSONtoHTML(record?.data0?.entry?.[field.id], sources)
            "></td>
          <td
            class="bordered"
            v-html="
              field.type === 'line'
                ? record?.data1?.entry?.[field.id]
                : store.convertJSONtoHTML(record?.data1?.entry?.[field.id], sources)
            "></td>
        </tr>
        <tr id="priority">
          <td class="bordered bold">Priority</td>

          <td class="bordered">{{ record?.data0?.priority }}</td>
          <td class="bordered">{{ record?.data1?.priority }}</td>
        </tr>
        <tr id="published">
          <td class="bordered bold">Status</td>

          <td class="bordered">
            <span v-if="record?.data0 && 'published' in record.data0">{{
              record?.data0?.published ? 'Published' : 'Draft'
            }}</span>
          </td>
          <td class="bordered">{{ record?.data1?.published ? 'Published' : 'Draft' }}</td>
        </tr>
        <tr id="issues">
          <td class="bordered bold">Issues</td>

          <td class="bordered">
            <n-space>
              <span
                v-for="item in record?.data0?.issues"
                :style="'padding: 3px;background-color:' + issuesKV[item[0]].color"
                >{{ issuesKV[item[0]][lang] + ' @' + usersKV[item[1]]?.username }}
              </span>
            </n-space>
          </td>
          <td class="bordered">
            <n-space>
              <span
                v-for="item in record?.data1?.issues"
                :style="'color:white;padding: 3px;background-color:' + issuesKV[item[0]].color"
                >{{ issuesKV[item[0]][lang] + ' @' + usersKV[item[1]]?.username }}
              </span>
            </n-space>
          </td>
        </tr>
        <tr id="tags">
          <td class="bordered bold">Tags</td>

          <td class="bordered">{{ record?.data0?.tags?.map(x => tagsKV[x][lang]).join(', ') }}</td>
          <td class="bordered">{{ record?.data1?.tags?.map(x => tagsKV[x][lang]).join(', ') }}</td>
        </tr>
      </table>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, h, DefineComponent, toRaw, onUpdated, nextTick } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { NTime } from 'naive-ui';
import store from '../store';
const vuerouter = useRoute();

const isLoaded = ref(false);
let id = Number(vuerouter.params.id);
const record = ref<IChange>();
const timestamp = ref<Date>();
const sources = reactive<Array<IBib>>([]);
const usersKV = reactive<keyable>({});
const issuesKV = reactive<keyable>({});
const tagsKV = reactive([]);
const lang = store?.state?.user?.text?.lang?.substring(0, 2) || 'en';
const user = reactive({} as IUser);

console.log();

onUpdated(async () => {
  if (vuerouter?.query?.select) {
    nextTick(() => {
      store.scrollTo(String(vuerouter.query.select));
    });
  }
});

onBeforeMount(async () => {
  const data = await store.get('change', String(id));
  console.log(data);
  record.value = data;
  timestamp.value = new Date(data.created);
  const [sourcesData, usersData, issueData, tagData] = await Promise.all([
    store.get('source'),
    store.get('users'),
    store.get('issues'),
    store.get('tags'),
  ]);
  Object.assign(
    sources,
    sourcesData.map((x: any, i: number) => ({
      ...x,
      label: `${x.citekey.padEnd(10, '.')} ${x.bibtex.title}`,
      value: i,
    }))
  );
  Object.assign(usersKV, Object.fromEntries(usersData.map((x: any) => [x.id, x])));
  if (record?.value?.user_id) {
    Object.assign(user, usersKV?.[record.value.user_id]);
  }

  Object.assign(tagsKV, Object.fromEntries(tagData.map((x: any) => [x.id, x])));
  Object.assign(issuesKV, Object.fromEntries(issueData.map((x: any) => [x.id, x])));

  isLoaded.value = true;
});
</script>

<style scoped lang="scss">
td.bordered {
  border: 1px solid rgba(54, 51, 51, 0.236);
  padding: 10px;
}
td.bold {
  font-weight: bold;
  writing-mode: vertical-lr;
}
:deep(td > figure > img) {
  max-height: 50px;
  max-width: 50px;
}
</style>
