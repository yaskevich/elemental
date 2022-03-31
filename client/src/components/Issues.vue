<template>

  <h3>Issues</h3>

  <n-space vertical>
    <n-input style="min-width:250px;" autosize v-model:value="newIssue.en" type="text" placeholder="English title" />
    <n-input autosize style="min-width:250px;" v-model:value="newIssue.ru" type="text" placeholder="Russian title" />
    <div style="width:100px;text-align:center;margin: 0 auto;">
      <n-color-picker v-model:value="newIssue.color"
                      :show-alpha="false"
                      :swatches="['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf']" />
    </div>
    <n-button type="info" dashed @click="editIssue(newIssue)">Create new issue +</n-button>
  </n-space>
  <n-divider style="width:300px;text-align: center; margin:auto;padding:1rem;" />
  <div v-if="!issues.length">
    <n-text type="error">There are no issues!</n-text>
  </div>
  <div class="center-column">
    <div class="left-column">

      <n-space vertical>
        <n-input-group v-for="item in issues" :key="item.id" style="display:block;">
          <n-space justify="space-between">

            <n-color-picker style="width:70px;" v-model:value="item.color"
                            :show-alpha="false"
                            :swatches="['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf']" />
            <div>
              <n-input autosize v-model:value="item.en" placeholder="English title" />
              <n-input autosize v-model:value="item.ru" placeholder="Russian title" />
            </div>
            <n-button type="primary" ghost @click="editIssue(item)">Save</n-button>
          </n-space>
        </n-input-group>
      </n-space>

    </div>
  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount } from 'vue';

  const getColor = () => "#" + Math.floor(Math.random() * (1 << 3 * 8)).toString(16).padStart(6, "0");

  interface IIssue {
    id?: number,
    en: string,
    ru: string,
    color: string,
  };

  const newIssue:IIssue = reactive({ en: '', ru: '', color: getColor() }) as IIssue;

  const issues:Array<IIssue> = reactive([]) as Array<IIssue>;

  onBeforeMount(async () => {
    const data = await store.get('issues');
    Object.assign(issues, data);
    console.log('data from server', data);
  });

  const editIssue = async (issue:IIssue) => {
    console.log('edit issue', issue);
    if (issue.en && issue.ru && issue.color){
    const params: IIssue = { } as IIssue;
    if (issue?.id) {
      params.id = issue.id;
    }
    params.en = issue.en;
    params.ru = issue.ru;
    params.color = issue.color;
    const result = await store.post('issue', params);
    if (result?.data?.id) {
      params.id = result.data.id;
      if (!issue?.id) {
        issues.push(params);
        newIssue.en = newIssue.ru = '';
        newIssue.color = getColor();
      }
    } else {
      console.log('error', result);
    }
  } else {
    console.log("Fields are empty");
  }
  };

</script>

<style scoped>

</style>
