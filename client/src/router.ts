import { createWebHistory, createRouter } from 'vue-router';
// import Home from './components/Home.vue';
// import User from './components/User.vue';

const routes = [
	{
		// path: '/test',
		// name: 'Test',
		// component: () => import('./components/Test.vue'),
    // component: Test,
	},

];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
