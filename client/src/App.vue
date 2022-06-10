<script setup lang="ts">
// import router from './router'
import { ref, reactive, onBeforeMount, computed, } from 'vue'
import store from './store'
import Login from './components/Login.vue'
import Register from './components/Register.vue'

import { h, Component } from 'vue'
import { MenuOption, NIcon } from 'naive-ui'
import { RouterLink, useRoute } from 'vue-router'
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
} from '@vicons/material'

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

const menuOptions: MenuOption[] = reactive([
  makeItem('Home', 'Home', HomeFilled),
  makeItem('Comments', 'Comments', CommentFilled),
  makeItem('Text', 'Text', TextSnippetFilled),
  {
    label: 'Management',
    key: 'management',
    icon: renderIcon(SettingsFilled),
    children: [
      {
        type: 'group',
        label: 'Project',
        key: 'project-management',
        children: [
          makeItem('Media', 'Media', PermMediaFilled),
          makeItem('Tags', 'Tags', AssignmentFilled),
          makeItem('Issues', 'Issues', LabelFilled),
          makeItem('Backups', 'Backups', BackupFilled),
          makeItem('Logs', 'Logs', HistoryFilled, true),
          // makeItem('', '', ),
        ]
      },
    ]
  },
  {
    label: user,
    key: 'username',
    disabled: true,
    icon: renderIcon(PersonFilled)
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
  <!-- <div id="main" v-if="dataReady"> -->
  <div id="main" v-if="loggedIn">
    <div v-if="dataReady">
      <n-menu v-model:value="activeKey" mode="horizontal" :options="menuOptions" />
      <!-- 
        <div id="nav">
        <router-link to="/">Home</router-link>|
        <router-link
          to="/comments"
          v-if="store?.state?.user?.text_id && store?.state?.user?.text?.comments"
        >Comments</router-link>|
        <router-link
          to="/text"
          v-if="store?.state?.user?.text_id && store?.state?.user?.text?.loaded"
        >Text</router-link>|
        <router-link to="/media">Media</router-link>|
        <router-link to="/tags">Tags</router-link>|
        <router-link to="/issues">Issues</router-link>|
        <router-link to="/backups">Backups</router-link>|
        <router-link to="/logs">Logs</router-link>
        |
        {{ state?.user?.username }}
      </div>-->
      <n-message-provider>
        <router-view />
      </n-message-provider>
    </div>
  </div>
  <div v-else>
    <h3>Login</h3>
    <Login />If you do not have an account, please, register
    <Register />
  </div>
  <!-- <div v-else>
    загрузка...
  </div>-->
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
/*
#nav {
  padding: 1rem;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
*/
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
