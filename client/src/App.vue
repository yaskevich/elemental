<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import router from './router'
import { ref, reactive, onBeforeMount, computed, } from 'vue'
import store from './store'
import Login from './components/Login.vue'
import Register from './components/Register.vue'

const loggedIn = computed(() => store?.state?.token?.length);
const state = store.state;

const dataReady = ref(false);

onBeforeMount(async () => {
  await store.getUser();
  dataReady.value = true;
  document.title = store?.state?.user?.text?.title || 'App';
  // console.log("state", store.state.user);
});

</script>

<template>
  <!-- <div id="main" v-if="dataReady"> -->
  <div id="main" v-if="loggedIn">
    <div v-if="dataReady">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/comments" v-if="store?.state?.user?.text_id && store?.state?.user?.text?.comments">Comments</router-link> |
      <router-link to="/text" v-if="store?.state?.user?.text_id && store?.state?.user?.text?.loaded">Text</router-link> |
      <router-link to="/tags">Tags</router-link> |
      <router-link to="/issues">Issues</router-link> |
      <router-link to="/backups">Backups</router-link> |
      <router-link to="/logs">Logs</router-link> |
      {{state?.user?.username}}
      <!-- <span v-if="loggedIn">
        <router-link to="/profile">Моё</router-link> |
        <a href ="#" @click="doLogOut">Выйти</a>
      </span> -->
      <!-- <span v-else>
        <router-link to="/login">Войти</router-link>
      </span> -->
    </div>
    <n-message-provider>
      <router-view/>
    </n-message-provider>
    </div>
</div>
<div v-else>
  <h3>Login</h3>
   <Login/>
   If you do not have an account, please, register
   <Register/>
</div>
<!-- <div v-else>
    загрузка...
</div> -->
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  // margin-top: 60px;
  max-width: 900px;
  margin: 0 auto;
}
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

.center-column {
  text-align: center;

  .left-column {
    padding:0 1rem 0 1rem;
    display: inline-table; text-align: left;
  }
}
</style>
