<template>

  <div class="center-column">
    <div class="left-column">
      <n-space justify="center">
        <div>
          <h3>Comments</h3>
        </div>
        <div>
          <h3 style="margin-top:.7em;margin-left: 5em;">
            <n-button type="info" dashed @click="addComment">+ new</n-button>
          </h3>
        </div>
      </n-space>
      <div v-if="!id">
        <n-text type="error">Select specific text before (at Home screen)!</n-text>
      </div>
      <n-data-table remote :columns="columns" :data="comments" :pagination="pagination" :row-key="getID" />
    </div>
  </div>

</template>

<script setup lang="ts">

  import store from '../store';
  import { ref, reactive, onBeforeMount, h, DefineComponent } from 'vue';
  import router from '../router';
  import { useRoute } from 'vue-router';
  import { NTag, NButton, NText } from 'naive-ui';

  const vuerouter = useRoute();
  const id = vuerouter.params.id || store.state.user.text_id;

  const comments = reactive([]);

  interface keyable {
    [key: string]: any
  };
  const issues: keyable = reactive({}) as keyable;

  // defineProps<{ msg: string }>()
  const getID = (row:any) => {
    return row.id;
  };

  const editComment = (id:number) => {
    router.push(`/comment/${id}`);
  };

  const columns = [
    {
      title: 'Title',
      key: 'title',
      render(row:any) {
        return h(
          // workaround for vue-tsc. Maybe, not good solution
          NButton as unknown as DefineComponent,
          {
            size: 'small',
            type: row.published ? '' : 'warning',
            secondary: row.published ? undefined : true,
             // <n-button strong secondary type="warning">Warning</n-button>
            onClick: () => editComment(row.id),
          },
          { default: () => row.title }
        );
      },
    },
    {
      title: 'ID',
      key: 'num_id',
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
      render(row:any) {
        const issuesList = row.issues.map((d:string) => {
          return h(
                  'div',
                  {
                    class: 'square',
                    style: `background-color:${issues?.[d]?.color||'black'}; margin: 2px;`,
                    title: issues?.[d]?.ru
                  },
                  ''
                  )
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

  onBeforeMount(async () => {
    const issuesData = await store.get('issues');
    const issuesObject = Object.fromEntries(issuesData.map((x:any) => [x.id, x]));
    Object.assign(issues, issuesObject);
    // console.log('issues from server', issues);

    if (id) {
      localStorage.setItem('text_id', String(id));
      const data = await store.get('comments/' + id);
      Object.assign(comments, data);
      console.log('data from server', data);
    }
  });

  const addComment = () => {
    router.push('/comment');
  };

  const pagination = { pageSize: 10 };

</script>

<style >
.square {
   width: 50%;
   height: 0;
   padding-bottom: 50%;
}
</style>
