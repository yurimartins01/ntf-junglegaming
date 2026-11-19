import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { imagetools } from 'vite-imagetools'

function preloadBootstrapChunks(): Plugin {
  const entries = [/src\/mocks\/browser\.ts$/, /src\/app\/App\.tsx$/]
  const routes: Record<string, RegExp> = {
    '/': /src\/routes\/index\.tsx\?tsr-split/,
    '/nft/': /src\/routes\/nft\.\$nftId\.tsx\?tsr-split/,
    '/cart': /src\/routes\/cart\.tsx\?tsr-split/,
    '/checkout': /src\/routes\/checkout\.tsx\?tsr-split/,
  }
  const normalize = (id: string) => id.replaceAll('\\', '/')
  return {
    name: 'preload-bootstrap-chunks',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html
        const collect = (patterns: RegExp[]) => {
          const files = new Set<string>()
          const visit = (fileName: string) => {
            if (files.has(fileName)) return
            files.add(fileName)
            const chunk = bundle[fileName]
            if (chunk?.type === 'chunk') chunk.imports.forEach(visit)
          }
          for (const item of Object.values(bundle)) {
            if (item.type === 'chunk' && item.facadeModuleId && patterns.some((pattern) => pattern.test(normalize(item.facadeModuleId!)))) visit(item.fileName)
          }
          return files
        }

        const alreadyLinked = new Set([...html.matchAll(/href="\/?([^"]+\.js)"/g)].map((match) => match[1]))
        const bootstrap = [...collect(entries)].filter((fileName) => !alreadyLinked.has(fileName))
        const tags = bootstrap.map((fileName) => `    <link rel="modulepreload" crossorigin href="/${fileName}" />`)

        const routeMap: Record<string, string[]> = {}
        for (const [path, pattern] of Object.entries(routes)) {
          routeMap[path] = [...collect([pattern])].filter((fileName) => !alreadyLinked.has(fileName) && !bootstrap.includes(fileName)).map((fileName) => `/${fileName}`)
        }
        const script =
          `    <script>(function(){var m=${JSON.stringify(routeMap)};var p=location.pathname;` +
          `var k=p==='/'?'/':Object.keys(m).filter(function(x){return x!=='/'&&p.indexOf(x)===0})[0];` +
          `(m[k]||[]).forEach(function(f){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=f;document.head.appendChild(l)})})()</script>`
        return html.replace('</head>', `${[...tags, script].join('\n')}\n  </head>`)
      },
    },
  }
}

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    preloadBootstrapChunks(),
    react(),
    tailwindcss(),
    imagetools({
      defaultDirectives: (url) =>
        url.searchParams.has('webp') ? new URLSearchParams({ format: 'webp', quality: '80' }) : new URLSearchParams(),
    }),
    svgr({
      svgrOptions: {
        replaceAttrValues: {
          '#D28A4C': 'currentColor',
          '#F5F1EB': 'currentColor',
          '#140D0A': 'currentColor',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'tough-cookie': fileURLToPath(new URL('./src/mocks/stubs/tough-cookie.ts', import.meta.url)),
    },
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
})
