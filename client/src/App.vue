<script setup lang="ts">
import { h, Component, ref, reactive, onBeforeMount, computed, } from 'vue';
import { MenuOption, NIcon } from 'naive-ui';
import { RouterLink, useRoute } from 'vue-router';
import {
  HomeFilled,
  CommentFilled,
  TextSnippetFilled,
  SettingsFilled,
  PersonFilled,
  PermMediaFilled,
  AssignmentFilled,
  LabelFilled,
  BackupFilled,
  HistoryFilled,
  PersonSearchFilled,
  LogOutFilled,
  EditNoteFilled,
  MenuBookFilled,
} from '@vicons/material'
import store from './store';
import router from './router';
import Login from './components/Login.vue';
import Register from './components/Register.vue';

const vuerouter = useRoute();
const activeKey = ref<string | null>(null); // vuerouter?.name||'Home'
const dataReady = ref(false);
const loggedIn = computed(() => store?.state?.token?.length);
const state = store.state;

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) })
};
const user = computed(() => state?.user?.username);

const makeItem = (name: string, title: string, icon: Component, disabled: boolean = false) => ({
  label: () => h(RouterLink, { to: { name: name, params: { lang: 'en-US' } } },
    { default: () => title }),
  key: name,
  disabled: disabled,
  icon: renderIcon(icon)
});

const processMenu = (key: string, item: MenuOption) => {
  if (key === 'logout') {
    store.logoutUser();
  } else if (key === 'profile') {
    router.push(`/user/${state?.user?.id}`);
  }
  // console.log("key", key);
};

const menuOptions: MenuOption[] = reactive([
  makeItem('Home', 'Home', HomeFilled),
  makeItem('Comments', 'Comments', CommentFilled),
  makeItem('Text', 'Text', TextSnippetFilled),
  {
    label: 'Management',
    key: 'management',
    icon: renderIcon(SettingsFilled),
    children: [
      makeItem('Media', 'Media', PermMediaFilled),
      makeItem('Sources', 'Sources', MenuBookFilled),
      makeItem('Tags', 'Tags', AssignmentFilled),
      makeItem('Issues', 'Issues', LabelFilled),
      makeItem('Backups', 'Backups', BackupFilled),
      makeItem('Users', 'Users', PersonSearchFilled),
      makeItem('Logs', 'Logs', HistoryFilled, true),
      // makeItem('', '', ),
    ],
    // children: [
    //   {
    //     type: 'group',
    //     label: 'Project',
    //     key: 'project-management',
    //     children: [
    //       makeItem('Media', 'Media', PermMediaFilled),
    //       makeItem('Tags', 'Tags', AssignmentFilled),
    //       makeItem('Issues', 'Issues', LabelFilled),
    //       makeItem('Backups', 'Backups', BackupFilled),
    //       makeItem('Users', 'Users', PersonSearchFilled),
    //       makeItem('Logs', 'Logs', HistoryFilled, true),
    //       // makeItem('', '', ),
    //     ]
    //   },
    // ]
  },
  {
    label: user,
    key: 'username',
    disabled: false,
    icon: renderIcon(PersonFilled),
    children: [
      {
        label: 'Log out',
        key: 'logout',
        disabled: false,
        icon: renderIcon(LogOutFilled),
      },
      {
        label: 'Edit profile',
        key: 'profile',
        disabled: false,
        icon: renderIcon(EditNoteFilled),
      }
    ]
  },
]);

onBeforeMount(async () => {
  await store.getUser();
  dataReady.value = true;
  document.title = store?.state?.user?.text?.title || 'App';
  activeKey.value = String(vuerouter.name);
  // console.log("state", store.state.user);
});

</script>

<template>
  <n-message-provider>
    <div id="main" v-if="loggedIn">
      <div v-if="dataReady">
        <n-menu
          v-model:value="activeKey"
          mode="horizontal"
          :options="menuOptions"
          @update:value="processMenu"
        />
        <router-view />
      </div>
    </div>
    <div v-else style="max-width:300px;margin:auto">
      <n-tabs
        default-value="signin"
        size="large"
        animated
        justify-content="center"
        style="margin: 0 -4px"
        pane-style="padding-left: 4px; padding-right: 4px; box-sizing: border-box;"
      >
        <n-tab-pane name="signin" tab="Log in">
          <Login />
        </n-tab-pane>
        <n-tab-pane name="signup" tab="Register">
          <Register />
        </n-tab-pane>
      </n-tabs>
    </div>
  </n-message-provider>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  /* 
  color: #2c3e50;
  margin-top: 60px;
  */
  max-width: 900px;
  margin: 0 auto;
}

.left {
  text-align: left;
}

.minimal {
  max-width: 600px;
  margin: auto;
}

.center-column {
  text-align: center;

  .left-column {
    padding: 0 1rem 0 1rem;
    display: inline-table;
    text-align: left;
  }
}

.zone {
  border: 1px solid lightgray;
  padding: 0px 5px 0px 5px;
  font-size: smaller;
  border-radius: 10% / 50%;
  font-variant: small-caps;
}
</style>
