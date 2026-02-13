import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/avatar',
    name: 'AvatarFrame',
    component: () => import('../views/AvatarFrame.vue')
  },
  {
    path: '/horoscope',
    name: 'Horoscope',
    component: () => import('../views/Horoscope.vue')
  },
  {
    path: '/redpacket',
    name: 'RedPacketCover',
    component: () => import('../views/RedPacketCover.vue')
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
  },
  {
    path: '/auth-callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallback.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
