<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import HelloWorld from './components/HelloWorld.vue'
import router from './router'

</script>

<template>
  <!-- <div id="main" v-if="dataReady"> -->
  <div id="main">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/comments">Comments</router-link> |
      <!-- <span v-if="loggedIn">
        <router-link to="/profile">Моё</router-link> |
        <a href ="#" @click="doLogOut">Выйти</a>
      </span> -->
      <!-- <span v-else>
        <router-link to="/login">Войти</router-link>
      </span> -->
    </div>
    <router-view/>
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
  margin-top: 60px;
}
#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
