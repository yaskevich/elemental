<template>

  <div v-if="!ready">
    loading...
  </div>

  <n-card title="Comments" :bordered="false" :style="`visibility:${ready?'visible':'hidden'}`">
    <template #header-extra>
    <n-button type="primary"  @click="addComment">+ new</n-button>
  </template>
    <div v-if="!store?.state?.user?.text_id">
      <n-text type="error">Select specific text before (at Home screen)!</n-text>
    </div>
    <!-- <n-data-table remote :columns="columns" :data="comments" :pagination="pagination" :row-key="getID" :row-class-name="rowClassName" /> -->
    <n-data-table remote :columns="columns" :data="comments" :pagination="pagination" :row-key="getID" :row-props="rowProps"
    />
    <template #footer>
    <!-- #footer -->
  </template>
    <template #action>
    <!-- #action -->
  </template>
  </n-card>


</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount, h, DefineComponent } from 'vue';
  import router from '../router';
  import { useRoute } from 'vue-router';
  import { NTag, NButton, NText, NTooltip } from 'naive-ui';

  const vuerouter = useRoute();

  const ready = ref(false);
  const comments = reactive([]);

  interface keyable {
    [key: string]: any;
  }
  const issues: keyable = reactive({}) as keyable;
  const users: keyable = reactive({}) as keyable;

  // defineProps<{ msg: string }>()
  const getID = (row: any) => {
    return row.id;
  };

  const editComment = (id: number) => {
    router.push(`/comment/${id}`);
  };

  const rowProps = row => ({
    style: 'cursor: pointer;',
    onClick: () => {
      editComment(row.id);
    },
  });

  const columns = [
    {
      title: 'Title',
      key: 'title',
      // ellipsis: { tooltip: true},
      // render(row:any) {
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
    },
    {
      title: 'ID',
      key: 'priority',
      render(row: any) {
        // <span v-if="item.published" style="margin-left:10px;color:blue;">✓</span>
        // return row.published ? "true" : "false";
        return h(
          row.bound ? ((NTag as unknown) as DefineComponent) : ((NText as unknown) as DefineComponent),
          {
            type: row.bound ? 'info' : 'error',
          },
          {
            default: () => row.priority,
          }
        );
      },
    },
    // {
    //   title: 'Status',
    //   key: 'published',
    //   align: 'center',
    //   render(row:any) {
    //     // <span v-if="item.published" style="margin-left:10px;color:blue;">✓</span>
    //     // return row.published ? "true" : "false";
    //     return h(
    //       NText,
    //       {
    //         type: 'info',
    //       },
    //       {
    //         default: () => row.published ? '✓': '',
    //       }
    //     );
    //   }
    // },
    {
      title: 'Issues',
      key: 'issues',
      render(row: any) {
        const issuesList = row.issues.map((d: string) => {
          return h(
            NTooltip,
            {
              placement: 'left',
              trigger: 'hover',
            },
            {
              default: () => `${issues?.[d[0]]?.ru}${users?.[d[1]]?.username ? ' @' + users?.[d[1]]?.username : ''}`,
              trigger: () =>
                h('div', {
                  class: 'square',
                  style: `background-color:${issues?.[d[0]]?.color || 'black'};`,
                }),
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
    //   render(row) {
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

  // const rowClassName = (row, index) => {
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

    const issuesData = await store.get('issues');
    const issuesObject = Object.fromEntries(issuesData.map((x: any) => [x.id, x]));
    Object.assign(issues, issuesObject);

    const usersData = await store.get('users');
    Object.assign(users, Object.fromEntries(usersData.map((x: any) => [x.id, x])));
    // console.log('issues from server', issues);

    if (store?.state?.user?.text_id) {
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

  const pagination = { pageSize: 10 };

</script>

<style scoped lang="scss">

  :deep(td .square) {
    width: 50%;
    height: 0;
    padding-bottom: 50%;
    margin: 2px;
  }

  /*
  :deep(.bound td:nth-of-type(2)) {
    background-color: lightblue !important;
  }
  */

</style>
