import { createWebHistory, createRouter } from 'vue-router';
// import Home from './components/Home.vue';
// import Login from './components/Login.vue';
// import Register from './components/Register.vue';
// import Tags from './components/Tags.vue';
// import Issues from './components/Issues.vue';
// import Preview from './components/Preview.vue';
// import Comment from './components/Comment.vue';
// import Comments from './components/Comments.vue';
// import Text from './components/Text.vue';
// import Logs from './components/Logs.vue';
// import Backups from './components/Backups.vue';
// import Project from './components/Project.vue';
// import Media from './components/Media.vue';
// import Import from './components/Import.vue';
// import Users from './components/Users.vue';
// import User from './components/User.vue';
// import Sources from './components/Sources.vue';
// import Source from './components/Source.vue';
// import Flow from './components/Flow.vue';
// import Scheme from './components/Scheme.vue';
// import Classes from './components/Classes.vue';

const routes = [
  // {
  // path: '/test',
  // name: 'Test',
  // component: () => import('./components/Test.vue'),
  // component: Test,
  // },
  {
    path: '/',
    alias: ['/home'],
    name: 'Home',
    // component: Home,
    component: () => import('./components/Home.vue'),
  },
  {
    path: '/text',
    name: 'Text',
    // component: Text,
    component: () => import('./components/Text.vue'),
    props: true,
  },
  {
    path: '/register',
    name: 'Register',
    // component: Register,
    component: () => import('./components/Register.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    // component: Login,
    component: () => import('./components/Login.vue'),
  },
  {
    path: '/tags',
    name: 'Tags',
    // component: Tags,
    component: () => import('./components/Tags.vue'),
  },
  {
    path: '/issues',
    name: 'Issues',
    // component: Issues,
    component: () => import('./components/Issues.vue'),
  },
  {
    path: '/backups',
    name: 'Backups',
    // component: Backups,
    component: () => import('./components/Backups.vue'),
  },
  {
    path: '/comments/:id?',
    name: 'Comments',
    // component: Comments,
    component: () => import('./components/Comments.vue'),
  },
  {
    path: '/comment/:id?',
    // component: Comment,
    component: () => import('./components/Comment.vue'),
    name: 'Comment',
    props: true,
  },
  {
    path: '/preview/:id?',
    // component: Preview,
    component: () => import('./components/Preview.vue'),
    name: 'Preview',
  },
  {
    path: '/logs',
    // component: Logs,
    component: () => import('./components/Logs.vue'),
    name: 'Logs',
  },
  {
    path: '/project/:id?',
    // component: Project,
    component: () => import('./components/Project.vue'),
    name: 'Project',
  },
  {
    path: '/media',
    // component: Media,
    component: () => import('./components/Media.vue'),
    name: 'Media',
  },
  {
    path: '/import/:id?',
    // component: Import,
    component: () => import('./components/Import.vue'),
    name: 'Import',
  },
  {
    path: '/users',
    // component: Users,
    component: () => import('./components/Users.vue'),
    name: 'Users',
  },
  {
    path: '/user/:id?',
    // component: User,
    component: () => import('./components/User.vue'),
    name: 'User',
  },
  {
    path: '/sources',
    // component: Sources,
    component: () => import('./components/Sources.vue'),
    name: 'Sources',
  },
  {
    path: '/source/:id?',
    // component: Source,
    component: () => import('./components/Source.vue'),
    name: 'Source',
  },
  {
    path: '/flow',
    // component: Flow,
    component: () => import('./components/Flow.vue'),
    name: 'Flow',
  },
  {
    path: '/scheme/:id?',
    // component: Scheme,
    component: () => import('./components/Scheme.vue'),
    name: 'Scheme',
  },
  {
    path: '/classes',
    // component: Classes,
    component: () => import('./components/Classes.vue'),
    name: 'Classes',
  },
  {
    path: '/logs/:id',
    component: () => import('./components/Change.vue'),
    name: 'Change',
  },
  {
    path: '/index',
    component: () => import('./components/Index.vue'),
    name: 'Index',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
