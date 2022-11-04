<template>
  <!-- <n-page-header subtitle="Review logs" @back="handleBack" style="max-width:600px;margin: 0 auto;padding-left: 1rem;"> -->
  <n-card title="Logs" class="minimal left" :bordered="false" v-if="isLoaded">
    <!-- :row-props="rowProps" -->
    <n-data-table ref="tableRef" :columns="columns" :data="logs" />
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, h, DefineComponent, toRaw } from 'vue';
// import { RouterLink, useLink } from 'vue-router';
import { NTime, NButton, NSpace } from 'naive-ui';
import store from '../store';
import router from '../router';

const tableRef = ref(null);
const logs = ref([]);
const users = ref([]);
const isLoaded = ref(false);
const scheme = reactive({} as keyable);

const renderId = (id: number, isExisting: boolean) => {
  if (isExisting) {
    return h(
      NButton,
      {
        // to: '/' + row.table_name + '/' + row.record_id,
        onClick: () => router.push('/comment/' + id),
      },
      {
        default: () => id,
      }
    );
  }

  return h(
    NButton,
    {
      disabled: true,
    },
    {
      default: () => id,
    }
  );
};

const columns = [
  {
    title: 'ID',
    key: 'record_id',
    render: (row: IChange) => renderId(row.record_id, row.present),
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
      return h(
        NSpace,
        { vertical: true },
        {
          default: () => compareRecords(Number(row.id), row.data0, row.data1),
        }
      );
    },
    // ellipsis: {
    //   tooltip: true,
    // },
  },
];

const rowProps = (row: IChange) => {
  return {
    onClick: () => {
      // console.log(toRaw(row.data0), toRaw(row.data1));
      // router.push('/logs/' + row.id);
    },
  };
};

const compareRecords = (id: number, data0: IComment, data1: IComment) => {
  const fields = [];

  if (!data0?.title) {
    return h(
      NButton,
      { onClick: () => router.push({ name: 'Change', params: { id } }), type: 'warning' },
      { default: () => 'CREATED' }
    );
  }
  if (data0.title !== data1.title) {
    fields.push(['title', 'Title']);
  }
  if (data0.priority !== data1.priority) {
    fields.push(['priority', 'Priority']);
  }
  if (data0.published !== data1.published) {
    fields.push(['published', 'Status']);
  }
  if (data0.tags.length !== new Set(data0.tags.concat(data1.tags)).size) {
    fields.push(['tags', 'Tags']);
  }
  if (JSON.stringify(data0.issues) !== JSON.stringify(data1.issues)) {
    fields.push(['issues', 'Issues']);
  }

  Object.keys(scheme).forEach(x => {
    if (JSON.stringify(data0.entry?.[x]) !== JSON.stringify(data1.entry?.[x])) {
      fields.push([x, scheme[x].title]);
    }
  });

  return fields.map(x =>
    h(
      NButton,
      {
        onClick: () => router.push({ name: 'Change', params: { id }, query: { select: x[0] } }),
        size: 'small',
        secondary: true,
      },
      {
        default: () => x[1],
      }
    )
  );
};

onBeforeMount(async () => {
  logs.value = await store.get('logs', String(store?.state?.user?.text_id));
  const data = await store.get('users');
  users.value = Object.assign({}, ...data.map((x: any) => ({ [x.id]: x })));
  // console.log('data from server', logs.value);
  const texts = await store.get('texts', String(store?.state?.user?.text_id));
  const schemeKV = texts?.shift()?.scheme?.map((x: any) => ({ [x.id]: x }));
  if (schemeKV && Object.keys(schemeKV).length) {
    Object.assign(scheme, Object.assign({}, ...schemeKV));
  }
  isLoaded.value = true;
});
</script>
