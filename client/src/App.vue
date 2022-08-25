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
  ReceiptLongFilled,
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

const settings = ref<ISettings>();

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
      makeItem('Flow', 'Flow', ReceiptLongFilled),
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
  const storedTitle = store?.state?.user?.text?.title;
  document.title = storedTitle || 'App';
  activeKey.value = String(vuerouter.name);
  // console.log("state", store.state.user);
  if (!storedTitle) {
    const { data } = await store.getUnauthorized('settings');
    settings.value = data;
  }
  dataReady.value = true;
});

const color = 'green';

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
          <Register v-if="settings?.registration_open" />
          <n-h2 v-else>
            <n-text type="warning">Registration is closed.</n-text>
          </n-h2>
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

// annotation markers and zones
var,
button {
  border-radius: 1px;
  padding: 2px 2px 2px 2px;
  font-style: normal;

  &.error {
    color: black;
    background-color: #f0a020;
    // rgba(232, 209, 0, 0.59);
    // v-bind("color")
    font-family: monospace;
    // border: 1px solid red;
    padding-left: 5px;
    padding-right: 5px;
  }

  &.name {
    color: #1060c9;
    background-color: rgb(243 243 4 / 42%);
    font-weight: bold;
  }

  &.example {
    // background-color: #f6f8fa;
    color: #2c4b56;
    background-color: lightgray;
  }

  &.book {
    background: #eee;
    // padding: 0 3px;
    // color: #c76c0c;

    text-decoration: underline;
    // color: black;
    // background-color: silver;
  }
}

blockquote.quote {
  // color: #2C4B56;
  // background-color: lightgray;

  background: #f9f9f9;
  border-left: 10px solid #ccc;
  margin: 1.5em 10px;
  padding: 0.5em 10px;
  quotes: "\201C""\201D""\2018""\2019";
}
/*
blockquote:before {
  color: #ccc;
  content: open-quote;
  font-size: 4em;
  line-height: 0.1em;
  margin-right: 0.25em;
  vertical-align: -0.4em;
}
*/
figure {
  max-width: 25rem;
  /*border: 3px solid #0d0d0d;*/
  border-radius: 0.5rem;
  margin: 1rem 0;
  padding: 0.5rem;

  text-align: center;
  margin: auto;

  &[draggable="true"] {
    border: 3px solid lightpink;
    padding: 5px;
  }
}
figcaption {
  margin-top: 0.25rem;
  text-align: center;
  padding: 0.5rem;
  border: 2px dashed #0d0d0d20;
  border-radius: 0.5rem;
}
cite {
  font-style: normal;
  color: gray;
  /*
  padding: 0px 5px;
  */
}
</style>
