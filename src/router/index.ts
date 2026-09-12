import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/editor',
    },
    {
      path: '/editor',
      component: () => import('@/views/PageEditor.vue'),
    },
    {
      path: '/preview',
      component: () => import('@/views/PagePreview.vue'),
    },
  ],
})

export default router
