<template>
  <n-card title="Stats" :bordered="false" class="minimal left">
    <template v-if="isLoaded">
      <n-space vertical v-if="data?.stats?.comments?.total">
        <n-tooltip trigger="hover" placement="top">
          <template #trigger>
            <n-h1 style="color: orangered; text-align: center; margin-top: -1.5rem; margin-bottom: -0.5rem">{{
              store.percent(data?.stats?.comments?.ready / data?.stats?.comments?.total)
            }}</n-h1>
          </template>
          {{ data?.stats?.comments?.ready }} published comments to {{ data?.stats?.comments?.draft }} drafts
        </n-tooltip>

        <div style="text-align: center">
          <n-tooltip trigger="hover" placement="bottom">
            <template #trigger>
              <span>ETC: <n-time :time="data?.stats?.etc" type="date" unix format="MMM yyyy" /></span>
            </template>
            Esitmated Time to Complete is <n-time :time="data?.stats?.etc" type="relative" unix />
          </n-tooltip>
        </div>

        <n-descriptions label-placement="left" bordered :column="1">
          <n-descriptions-item>
            <template #label> Comments </template>
            <n-tag>{{ data?.stats?.comments?.total }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item>
            <template #label> Changes </template>
            <n-tag>{{ data?.stats?.changes?.map((x: any) => x.count).reduce((a: any, b: any) => a + b, 0) }}</n-tag>
          </n-descriptions-item>

          <!-- <n-descriptions-item v-for="user in data?.stats?.changes">
          <template #label>
            • {{ data?.users[user?.user_id]?.firstname + ' ' + data?.users[user?.user_id]?.lastname }}
          </template>
          {{ user?.count }}
        </n-descriptions-item> -->

          <n-descriptions-item>
            <template #label> Words </template>
            <n-tag> {{ total }} </n-tag>
          </n-descriptions-item>

          <n-descriptions-item v-for="word in data?.stats?.words?.sort((a:any, b:any) => b.count - a.count)">
            <template #label>
              • with{{ word?.qty ? ' ' + word?.qty : 'out' }} comment{{ word?.qty === 1 ? '' : 's' }}
            </template>
            <n-space>
              <div style="min-width: 50px">
                <n-tag>{{ word?.count }}</n-tag>
              </div>
              <n-tag type="info"> {{ store.percent(word?.count / total) }} </n-tag>
            </n-space>
          </n-descriptions-item>
        </n-descriptions>

        <div ref="divRef" style="text-align: center" v-if="Object.keys(data!.stats!.changes)?.length > 1">
          <Chart
            :size="{ width: divRef?.clientWidth || 0, height: data?.stats?.changes?.length * 40 }"
            :data="changes"
            :margin="margin"
            direction="vertical"
            :axis="axis">
            <template #layers>
              <Grid strokeDasharray="2,2" />
              <Bar :dataKeys="['abbr', 'count']" :barStyle="{ fill: '#6f9fde' }" />
            </template>
            <template #widgets>
              <Tooltip
                borderColor="#48CAE4"
                :config="{
                  count: { color: 'darkred' },
                  // avg: { color: '#0096c7' },
                  // inc: { color: '#48cae4' },
                }" />
            </template>
          </Chart>
        </div>
        <!-- <n-divider></n-divider> -->
        <div>
          <n-h4>Tags</n-h4>
          <n-tabs type="line" animated>
            <n-tab-pane name="grouped" tab="Groups">
              <n-space vertical>
                <n-space v-for="tag in data?.stats?.tags" justify="space-between">
                  <n-space v-if="tag?.tags?.length">
                    <n-tag type="success" v-for="tid in tag.tags">{{ data.tags?.[tid]['title'] }}</n-tag>
                  </n-space>
                  <n-tag :bordered="false" v-else>without tags</n-tag>
                  <n-tag>{{ tag.qty }}</n-tag>
                </n-space>
              </n-space>
            </n-tab-pane>
            <n-tab-pane name="units" tab="Occurencies">
              <n-space vertical>
                <n-space justify="space-between" v-for="item in tagsArray">
                  <n-tag type="success">{{ data.tags[item[0]].title }}</n-tag>
                  <n-tag>{{ item[1] }}</n-tag>
                </n-space>
              </n-space>
            </n-tab-pane>
          </n-tabs>
        </div>
      </n-space>
      <n-alert v-else title="No comments" type="warning"
        >Metrics cannot be counted when there are no comments added</n-alert
      >
    </template>
    <!-- <n-divider></n-divider> -->
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, onMounted } from 'vue';
import { Chart, Grid, Line, Bar, Tooltip, Marker } from 'vue3-charts';
import { ChartAxis } from 'vue3-charts/dist/types';
import store from '../store';
const data = reactive({} as any);
const isLoaded = ref(false);
const divRef = ref<HTMLDivElement>();
const margin = ref({
  left: 0,
  top: 20,
  right: 20,
  bottom: 0,
});

const changes = ref([]);
const total = ref(0);
const tagsArray = [] as any;

const axis = ref({
  primary: {
    type: 'band',
  },
  secondary: {
    domain: ['dataMin', 'dataMax + 100'],
    type: 'linear',
    ticks: 8,
  },
} as ChartAxis);

onBeforeMount(async () => {
  const [stats, users, issues, tags] = await Promise.all([
    store.get('stats', String(store?.state?.user?.text_id)),
    store.get('users'),
    store.get('issues'),
    store.get('tags'),
  ]);

  const uniqTags = {} as any;
  for (let tag of stats?.tags) {
    for (let tagId of tag?.tags) {
      // console.log(tagId, tag.qty);
      const qty = uniqTags?.[tagId] ? uniqTags[tagId] : 0;
      uniqTags[tagId] = qty + Number(tag.qty);
    }
  }

  Object.assign(
    tagsArray,
    Object.entries(uniqTags).sort((a: any, b: any) => b[1] - a[1])
  );

  const usersKV = store.convertArrayToObject(users);
  Object.assign(data, {
    stats,
    users: usersKV,
    issues,
    tags: store.convertArrayToObject(tags) as keyable,
  });

  changes.value = stats?.changes
    ?.sort((a: any, b: any) => b?.count - a?.count)
    .map((x: any) => ({
      count: x.count,
      abbr: usersKV[x.user_id]?.firstname?.charAt(0) + '.' + usersKV[x.user_id]?.lastname?.charAt(0) + '.',
      user: usersKV[x.user_id]?.firstname + ' ' + usersKV[x.user_id]?.lastname,
    }));

  total.value = stats?.words?.map((x: any) => x.count).reduce((a: any, b: any) => a + b, 0);

  isLoaded.value = true;
});
</script>
