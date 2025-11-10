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
      minify: true,
      sourcemap: true,
      lib: {
        entry: resolve(__dirname, 'src/index.tsx'),
        name: 'NeroWallet',
        fileName: 'bundle',
        formats: ['es'],
      },
      cssCodeSplit: false,
      cssMinify: true,
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          '@rainbow-me/rainbowkit',
          '@tanstack/react-query',
          'wagmi',
          'viem',
          // Note: ethers is NOT external - it's bundled to handle dependencies like 'userop'
        ],
        output: {
          inlineDynamicImports: true,
          preserveModules: false,
          interop: 'auto',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'style.css') return 'style.css'
            return assetInfo.name || 'assets/[name][extname]'
          },
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'jsxRuntime',
          },
        },
      },
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
        esmExternals: ['ethers'],
      },
    },
  }
})
