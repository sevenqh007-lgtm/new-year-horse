import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/blessing',
    name: 'Blessing',
    component: () => import('../views/Blessing.vue')
  },
  {
    path: '/firework',
    name: 'Firework',
    component: () => import('../views/Firework.vue')
  },
  {
    path: '/generator',
    name: 'Generator',
    component: () => import('../views/Generator.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
