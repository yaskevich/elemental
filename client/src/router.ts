import { createWebHistory, createRouter } from 'vue-router';
import Home from './components/Home.vue';
import Login from './components/Login.vue';
import Register from './components/Register.vue';
import Tags from './components/Tags.vue';
import Issues from './components/Issues.vue';
import Preview from './components/Preview.vue';
import Comment from './components/Comment.vue';
import Comments from './components/Comments.vue';
import Text from './components/Text.vue';

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
		component: Home,
	},
	{
		path: '/text',
		name: 'Text',
		component: Text,
		props: true,
	},
	{
		path: '/register',
		name: 'Register',
		component: Register,
	},
	{
		path: '/login',
		name: 'Login',
		component: Login,
	},
	{
		path: '/tags',
		name: 'Tags',
		component: Tags,
	},
	{
		path: '/issues',
		name: 'Issues',
		component: Issues,
	},
	{
		path: '/comments/:id?',
		name: 'Comments',
    component: Comments,
	},
	{
		path: '/comment/:id?',
		component: Comment,
		name: 'Comment',
		props: true
	},
	{
		path: '/preview/:id?',
		component: Preview,
		name: 'Preview',
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
