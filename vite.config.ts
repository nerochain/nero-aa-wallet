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
          // Web3Auth packages - externalized so modal can render properly
          '@web3auth/auth-adapter',
          '@web3auth/base',
          '@web3auth/ethereum-provider',
          '@web3auth/modal',
          '@web3auth/web3auth-wagmi-connector',
          // Note: ethers is bundled with polyfills injected
        ],
        output: {
          inlineDynamicImports: true,
          preserveModules: false,
          interop: 'auto',
          // Inject polyfills BEFORE any imports - using intro instead of banner
          intro: `
(function() {
  if (typeof globalThis.global === 'undefined') {
    globalThis.global = globalThis;
  }
  if (typeof globalThis.process === 'undefined') {
    globalThis.process = {
      env: {},
      version: 'v16.0.0',
      versions: { node: '16.0.0' },
      nextTick: function(fn) {
        return Promise.resolve().then(fn);
      },
      once: function(event, handler) {
        return handler;
      },
      on: function() {},
      off: function() {},
      removeListener: function() {},
      removeAllListeners: function() {},
      emit: function() {},
      binding: function() { throw new Error('process.binding is not supported'); },
      cwd: function() { return '/'; },
      chdir: function() {}
    };
  }
  if (typeof globalThis.Buffer === 'undefined' && typeof window !== 'undefined') {
    try {
      globalThis.Buffer = require('buffer').Buffer;
    } catch (e) {}
  }
})();
          `,
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
        esmExternals: true,
        requireReturnsDefault: (id) => {
          // Ethers v5 is pure ESM - no default export
          if (id === 'ethers') return false
          return 'auto'
        },
      },
    },
  }
})
