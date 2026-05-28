import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig( {
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    plugins: [
      vue(),
      vueDevTools(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false,
        },
        manifest: {
          name: 'APTeN',
          short_name: 'APTeN',
          description: '아파트 단지 통합 관리 플랫폼',
          theme_color: '#4973E5',
          background_color: '#FFFFFF',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          lang: 'ko',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              // maskable은 별도 디자인 파일 권장
              src: '/icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // SPA 라우팅 fallback. /api 요청은 그대로 백엔드로 보낸다.
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/],
          // 정적 자원만 precache
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // 시설/GX 이미지 중 대용량(~2.5 MB)이 있어 precache 한도를 4 MiB로 설정
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          // 알림과 주차는 실시간성 때문에 캐싱 부적합. 추후 화면별로 추가.
          runtimeCaching: [],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
);