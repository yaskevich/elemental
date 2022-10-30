<template>
  <!-- <n-page-header subtitle="Review logs" @back="handleBack" style="max-width:600px;margin: 0 auto;padding-left: 1rem;"> -->
  <n-card title="Logs" class="minimal left" :bordered="false" v-if="isLoaded">
    <n-data-table ref="tableRef" :columns="columns" :data="logs" :row-props="rowProps" />
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, h, DefineComponent, toRaw } from 'vue';
import { RouterLink, useLink } from 'vue-router';
import { NTime } from 'naive-ui';
import store from '../store';
import router from '../router';

const tableRef = ref(null);
const logs = ref([]);
const users = ref([]);
const isLoaded = ref(false);
const scheme = reactive({} as keyable);

const columns = [
  // {
  //   title: 'ID',
  //   key: 'id',
  // },
  {
    title: 'ID',
    key: 'record_id',
    render: (row: IChange) => {
      return h(
        RouterLink,
        {
          to: '/' + row.table_name + '/' + row.record_id,
        },
        {
          default: () => row.record_id,
        }
      );
    },
  },
  {
    title: 'Date',
    key: 'created',
    render: (row: IChange) => {
      return h(
        NTime,
        {
          time: new Date(row.created),
          type: 'relative',
        },
        {
          default: () => new Date(0),
        }
      );
    },
  },
  {
    title: 'User',
    key: 'user_id',
    render: (row: IChange) => {
      const user = users.value[row.user_id] as IUser;
      return user?.firstname + ' ' + user?.lastname;
    },
  },
  {
    title: 'Changes',
    render: (row: IChange) => {
      return compareRecords(row.data0, row.data1);
    },
    ellipsis: {
      tooltip: true,
    },
  },
];

const rowProps = (row: IChange) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      // console.log(toRaw(row.data0), toRaw(row.data1));
      router.push('/logs/' + row.id);
    },
  };
};

const compareRecords = (data0: IComment, data1: IComment) => {
  const fields = [];

  if (!data0?.title) {
    return 'CREATED';
  }
  if (data0.title !== data1.title) {
    fields.push('Title');
  }
  if (data0.priority !== data1.priority) {
    fields.push('Priority');
  }
  if (data0.published !== data1.published) {
    fields.push('Status');
  }
  if (data0.tags.length !== new Set(data0.tags.concat(data1.tags)).size) {
    fields.push('Tags');
  }
  if (JSON.stringify(data0.issues) !== JSON.stringify(data1.issues)) {
    fields.push('Issues');
  }

  Object.keys(scheme).forEach(x => {
    if (JSON.stringify(data0.entry?.[x]) !== JSON.stringify(data1.entry?.[x])) {
      fields.push(scheme[x].title);
    }
  });

  return fields.join(', ');
};

onBeforeMount(async () => {
  logs.value = await store.get('logs', String(store?.state?.user?.text_id));
  const data = await store.get('users');
  users.value = Object.assign({}, ...data.map((x: any) => ({ [x.id]: x })));
  // console.log('data from server', logs.value);
  const texts = await store.get('texts', String(store?.state?.user?.text_id));
  Object.assign(scheme, Object.assign({}, ...texts.shift().scheme.map((x: any) => ({ [x.id]: x }))));
  isLoaded.value = true;
});
</script>
