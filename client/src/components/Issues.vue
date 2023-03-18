<template>
  <n-card title="Issues" :bordered="false" class="minimal left" v-if="isLoaded">
    <template #header-extra>
      <n-button v-if="!showForm" type="primary" @click="showForm = true">+ new</n-button>
    </template>

    <n-input-group style="display: block; max-width: 300px; text-align: center; margin: 0 auto" v-if="showForm">
      <n-space vertical>
        <n-input v-model:value="newIssue.title" type="text" placeholder="Title" />
        <!-- <n-input v-model:value="newIssue.ru" type="text" placeholder="Russian title" /> -->
        <n-color-picker
          v-model:value="newIssue.color"
          :show-alpha="false"
          :swatches="['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf']" />
        <n-space justify="center">
          <n-button tertiary type="warning" @click="showForm = false">Cancel</n-button>
          <n-button type="info" @click="editIssue(newIssue)">Save</n-button>
        </n-space>
      </n-space>
      <n-divider style="width: 300px; text-align: center; margin: auto; padding: 1rem" />
    </n-input-group>

    <div v-if="!issues.length">
      <n-text type="error">There are no issues!</n-text>
    </div>

    <n-space vertical size="large">
      <n-grid x-gap="12" cols="3" responsive="screen" y-gap="6" v-for="item in issues" :key="item.id">
        <!-- 
        <n-input-group v-for="item in issues" :key="item.id" style="display:block;">
        <n-space :size="4">-->
        <n-gi>
          <n-input v-model:value="item.title" placeholder="Title" style="min-width: 100%" />
        </n-gi>
        <!-- <n-gi>
          <n-input v-model:value="item.ru" placeholder="Russian title" />
        </n-gi> -->
        <n-gi>
          <n-color-picker
            style="width: 70px"
            v-model:value="item.color"
            :show-alpha="false"
            :swatches="['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf']" />
        </n-gi>
        <n-gi style="text-align: right">
          <n-dropdown
            trigger="hover"
            :options="[
              { label: 'Save', key: 0, data: item },
              { label: 'Delete', key: 1, data: item },
            ]"
            @select="handleSelect">
            <n-button>Manage</n-button>
          </n-dropdown>
        </n-gi>
        <!-- </n-space>
        </n-input-group>
        -->
      </n-grid>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import store from '../store';
import { ref, reactive, onBeforeMount } from 'vue';
import { useMessage } from 'naive-ui';

const message = useMessage();

const getColor = () =>
  '#' +
  Math.floor(Math.random() * (1 << (3 * 8)))
    .toString(16)
    .padStart(6, '0');

const showForm = ref(false);
const isLoaded = ref(false);
const newIssue: IIssue = reactive({ title: '', color: getColor() }) as IIssue;

const issues: Array<IIssue> = reactive([]) as Array<IIssue>;

onBeforeMount(async () => {
  const data = await store.get('issues');
  Object.assign(issues, data);
  // console.log('data from server', data);
  isLoaded.value = true;
});

const handleSelect = async (key: string | number, option: any) => {
  // console.log(String(key), option);
  if (key) {
    const { data } = await store.deleteById('issues', option.data.id);
    console.log('del', data);
    if (data.success) {
      message.success('The issue was deleted succesfully');

      Object.assign(
        issues,
        issues.filter((x: IIssue) => x.id !== data?.id)
      );
    } else {
      message.error(`The issue cannot be deleted.\nThere are comments bound (${data?.comments})`);
    }
  } else {
    await editIssue(option.data);
  }
};

const editIssue = async (issue: IIssue) => {
  // console.log('edit issue', issue);
  if (issue.title && issue.color) {
    const params: IIssue = {} as IIssue;
    if (issue?.id) {
      params.id = issue.id;
    }
    params.title = issue.title;
    params.color = issue.color;
    const result = await store.post('issue', params);
    if (result?.data?.id) {
      params.id = result.data.id;
      if (!issue?.id) {
        showForm.value = false;
        issues.unshift(params);
        newIssue.title = '';
        newIssue.color = getColor();
      }
      message.success('The issue was saved succesfully');
    } else {
      console.log('error', result);
    }
  } else {
    console.log('Fields are empty');
  }
};
</script>
