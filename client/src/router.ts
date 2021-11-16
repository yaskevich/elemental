import { createWebHistory, createRouter } from 'vue-router';
import Home from './components/Home.vue';
import Comments from './components/Comments.vue';

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
		path: '/comments',
		name: 'Comments',
    component: Comments,
	},

];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
