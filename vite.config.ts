import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'

const commonConfig = {
  plugins: [react(), tsconfigPaths(), nodePolyfills()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['js-big-decimal'],
  },
}

export default defineConfig(({ mode }) => {
  if (mode === 'demo') {
    // デモ・テストページ用の設定
    return {
      ...commonConfig,
      build: {
        outDir: 'dist/app',
        rollupOptions: {
          input: resolve(__dirname, 'index.html'),
          output: {
            format: 'iife',
            entryFileNames: 'bundle.js',
          },
        },
      },
    }
  }

  // ライブラリビルド用の設定（デフォルト）
  return {
    ...commonConfig,
    build: {
      outDir: 'dist/app',
      minify: false,
      sourcemap: true,
      lib: {
        entry: resolve(__dirname, 'src/index.tsx'),
        name: 'NeroWallet',
        fileName: 'bundle',
        formats: ['es'],
      },
      cssCodeSplit: false,
      cssMinify: false,
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          '@rainbow-me/rainbowkit',
          '@tanstack/react-query',
          'wagmi',
          'viem',
          '@web3auth/base',
          '@web3auth/auth-adapter',
          '@web3auth/ethereum-provider',
          '@web3auth/modal',
          '@web3auth/web3auth-wagmi-connector',
        ],
        output: {
          inlineDynamicImports: true,
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'style.css'
            return assetInfo.name || 'asset'
          },
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'jsxRuntime',
          },
        },
      },
    },
  }
})
