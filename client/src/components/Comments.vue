<template>
  <div v-if="!ready">loading...</div>
  <div v-else class="minimal left">
    <div v-if="!store?.state?.user?.text_id">
      <n-alert title="No text" type="warning">Select specific text before (at Home screen)</n-alert>
    </div>

    <n-card title="Comments" :bordered="false" v-else>
      <template #header-extra v-if="store.hasRights()">
        <n-button type="primary" @click="addComment">+ new</n-button>
      </template>

      <n-space vertical :size="12">
        <n-space>
          <n-button @click="reset">Reset</n-button>
          <!-- <n-button @click="clearSorter">Reset sorting</n-button>
          <n-button @click="clearFilters">Reset filters</n-button>-->
          <n-select
            v-model:value="selectedUser"
            filterable
            placeholder="Filter by user"
            :options="userList"
            @update:value="selectUser" />
          <n-select
            v-model:value="selectedTag"
            filterable
            placeholder="Filter by tag"
            :options="tagsList"
            @update:value="selectTag" />
        </n-space>
        <!-- <n-data-table remote :columns="columns" :data="comments" :pagination="pagination" :row-key="getID" :row-class-name="rowClassName" /> -->
        <n-data-table
          ref="tableRef"
          :columns="columns"
          :data="comments"
          :pagination="pagination"
          :row-key="getID"
          :row-props="rowProps"
          :summary="summary"
          :paginate-single-page="false" />
      </n-space>
      <template #footer>
        <!-- #footer -->
      </template>
      <template #action>
        <!-- #action -->
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import store from '../store';
import { ref, reactive, onBeforeMount, h, DefineComponent } from 'vue';
import router from '../router';
import { useRoute } from 'vue-router';
import { NTag, NButton, NText, NTooltip, NIcon } from 'naive-ui';
import { CheckBoxFilled as CheckIcon } from '@vicons/material';
import { HelpOutlineFilled as HelpIcon } from '@vicons/material';
import { SquareRound as SquareIcon } from '@vicons/material';

const vuerouter = useRoute();
const tableRef = ref(null);
const ready = ref(false);
const comments = reactive([]);
const issues: keyable = reactive({}) as keyable;
const issuesArray = reactive([{ value: 0, label: '(no label)' }] as Array<{ label: string; value: number }>);
const issuesValues = reactive([] as Array<number>);
const users: keyable = reactive({}) as keyable;
const userList = reactive([]);
const tagsList = reactive([]);
const selectedUser = ref(null);
const selectedTag = ref(null);
// defineProps<{ msg: string }>()
const getID = (row: IRow) => {
  return row.id;
};

const editComment = (id: number) => {
  router.push(`/comment/${id}`);
};

const rowProps = (row: IRow) => ({
  style: 'cursor: pointer;',
  onClick: () => {
    // console.log("id", row.id);
    if (row?.id) {
      editComment(row.id);
    }
  },
  onAuxclick: () => {
    // console.log("id", row.id);
    if (row?.id) {
      window.open(`/comment/${row.id}`, '_blank');
    }
  },
  // onContextmenu: () => {
  //   console.log("test");
  // },
});

const selectUser = (x: number) => (tableRef?.value as any).filter({ issues: -x });

const selectTag = (x: number) => (tableRef?.value as any).filter({ title: -x });
// {
//   console.log("x", x);
// };

const clearSorter = () => (tableRef?.value as any).sort(null);

const clearFilters = () => {
  (tableRef?.value as any).filter(null);
  selectedUser.value = null;
  selectedTag.value = null;
};

const reset = () => {
  clearSorter(), clearFilters();
};

const columns = [
  {
    title: 'Title',
    key: 'title',
    // ellipsis: { tooltip: true},
    // render(row:IRow {
    //   return h(
    //     // workaround for vue-tsc. Maybe, not good solution
    //     NButton as unknown as DefineComponent,
    //     {
    //       size: 'small',
    //       type: row.published ? 'primary' : '',
    //       //secondary: row.published ? undefined : true,
    //        // <n-button strong secondary type="warning">Warning</n-button>
    //       onClick: () => editComment(row.id),
    //     },
    //     { default: () => row.title }
    //   );
    // },
    // defaultSortOrder: 'ascend',
    sorter: 'default',
    filter(optionValue: number, row: IRow) {
      selectedUser.value = null;
      if (optionValue > 0) {
        selectedTag.value = null;
      }
      return optionValue ? row.tags.includes(Math.abs(optionValue)) : !row.tags.length;
    },
  },
  {
    title: 'ID',
    key: 'priority',
    sorter: (row1: IRow, row2: IRow) => row1.priority - row2.priority,
    render(row: IRow) {
      // <span v-if="item.published" style="margin-left:10px;color:blue;">✓</span>
      // return row.published ? "true" : "false";
      return h(
        row.bound ? (NTag as unknown as DefineComponent) : (NText as unknown as DefineComponent),
        {
          type: row.bound ? 'info' : 'error',
        },
        {
          default: () => row.priority,
        }
      );
    },
  },
  {
    title: h(NIcon, { color: 'gray', size: 24, title: 'Status' }, { default: () => h(CheckIcon) }),
    key: 'published',
    sorter: (row1: IRow, row2: IRow) => Number(row1.published) - Number(row2.published),
    align: 'center',
    render(row: IRow) {
      // <span v-if="item.published" style="margin-left:10px;color:blue;">✓</span>
      // return row.published ? "true" : "false";
      // return h(
      //   NText,
      //   {
      //     type: 'info',
      //   },
      //   {
      //     default: () => row.published ? '✓': '',
      //   }
      // );
      return row.published
        ? h(NIcon, { color: 'green', size: 16 }, { default: () => h(CheckIcon) })
        : h('small', { style: 'color:#d0d3d4' }, 'draft');
    },
  },
  {
    title: h(NIcon, { color: 'gray', size: 24, title: 'Issues' }, { default: () => h(HelpIcon) }),
    key: 'issues',
    // defaultFilterOptionValues: issuesValues,
    filterOptions: issuesArray,
    filter(optionValue: number, row: IRow) {
      selectedTag.value = null;
      if (optionValue > 0) {
        selectedUser.value = null;
      }
      return optionValue
        ? row.issues.map((x: Array<number>) => x[Number(optionValue < 0)]).includes(Math.abs(optionValue))
        : !row.issues.length;
    },
    render(row: IRow) {
      const issuesList = row.issues.map((d: Array<number>) => {
        return h(
          NTooltip,
          {
            placement: 'left',
            trigger: 'hover',
          },
          {
            default: () => `${issues?.[d[0]]?.title}${users?.[d[1]]?.username ? ' @' + users?.[d[1]]?.username : ''}`,
            trigger: () =>
              h(
                NIcon,
                {
                  color: issues?.[d[0]]?.color || 'black',
                  size: 18,
                  // class: 'square',
                  // style: `background-color:${issues?.[d[0]]?.color || 'black'};`,
                },
                { default: () => h(SquareIcon) }
              ),
          }
        );
        // return h(
        //   NTag,
        //   {
        //     style: {
        //       marginRight: '6px',
        //     },
        //     type: 'info',
        //   },
        //   {
        //     default: () => d,
        //   }
        // );
      });
      return issuesList;
    },
  },
  // {
  //   title: 'Action',
  //   key: 'actions',
  //   render(row:IRow) {
  //     return h(
  //       NButton,
  //       {
  //         size: 'small',
  //         onClick: () => sendMail(row),
  //       },
  //       { default: () => 'Edit' }
  //     );
  //   },
  // },
];

// const rowClassName = ((row;IRow), (index:number)) => {
//   if (row.bound) {
//     return 'bound'
//   }
//   return null
// };

onBeforeMount(async () => {
  const pathId = Number(vuerouter.params?.id);
  if (pathId && store?.state?.user && pathId !== store.state.user?.text_id) {
    store.state.user.text_id = pathId;
    const { data } = await store.post('user/text', { id: vuerouter.params.id });
    console.log('change text id to prop', data);
  }

  if (store?.state?.user?.text_id) {
    const issuesData = await store.get('issues');
    const issuesObject = Object.fromEntries(issuesData.map((x: any) => [x.id, x]));
    Object.assign(issues, issuesObject);

    issuesArray.push(...issuesData.map((x: any) => ({ value: x.id, label: x.title })));
    issuesValues.push(...issuesArray.map((x: any) => x.value));

    const usersData = await store.get('users');
    Object.assign(users, Object.fromEntries(usersData.map((x: any) => [x.id, x])));
    // console.log('issues from server', issues);
    Object.assign(
      userList,
      usersData.map((x: any) => ({ value: x.id, label: `${x.firstname} ${x.lastname}` }))
    );

    const tagsData = await store.get('tags');
    Object.assign(
      tagsList,
      tagsData.map((x: any) => ({ value: x.id, label: x.title }))
    );

    // localStorage.setItem('text_id', String(id));
    const data = await store.get('comments/' + store.state.user.text_id);
    Object.assign(comments, data);
    // console.log('data from server', data);
  }
  ready.value = true;
});

const addComment = () => {
  router.push('/comment');
};

const pagination = reactive({
  page: 1,
  onChange: (page: number) => {
    pagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
  },
  showSizePicker: true,
  pageSize: 100,
  pageSizes: [10, 100, 500, 1000, 5000],
});

const summary = (pageData: Array<IRow>) => {
  // console.log("pagedata", pageData);
  return {
    priority: {},
    published: {},
    issues: {},
    title: {
      value: h(
        'span',
        { style: { color: 'gray', 'font-weight': 'bold' } },
        // pageData.reduce((prevValue, row) => prevValue + row.priority, 0)
        pageData.length
      ),
      colSpan: 3,
    },
  };
};
</script>
