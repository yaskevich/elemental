<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import router from './router'
import { ref, reactive, onBeforeMount, computed, } from 'vue'
import store from './store'
import Login from './components/Login.vue'
import Register from './components/Register.vue'


onBeforeMount(async () => {
  await store.getUser();
});

const loggedIn = computed(() => store?.state?.token?.length);



</script>

<template>
  <!-- <div id="main" v-if="dataReady"> -->
  <div id="main" v-if="loggedIn">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/comments">Comments</router-link> |
      <router-link to="/tags">Tags</router-link> |
      <router-link to="/issues">Issues</router-link> |
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
  padding-left:3rem;

  .left-column {
    display: inline-table; text-align: left;
  }
}
</style>
