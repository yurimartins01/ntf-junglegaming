import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'lighthouse', 'reports')
const RUNS = 3
const PORT = 4173
const BASE_URL = process.env.LH_URL ?? `http://localhost:${PORT}`
const PAGES = [
  { id: 'home', label: 'Início', path: '/' },
  { id: 'detail', label: 'Detalhe do NFT', path: '/nft/emerald-ape-042' },
]
const PROFILES = [
  { id: 'mobile', config: undefined, formFactor: 'mobile' },
  { id: 'desktop', config: desktopConfig, formFactor: 'desktop' },
]
const TARGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function waitForServer(url) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
    }
    await sleep(500)
  }
  throw new Error(`Server did not start at ${url}`)
}

function startPreview() {
  const child = spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['preview', '--host', '127.0.0.1'], {
    cwd: root,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  return child
}

async function toolVersions() {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  const lhPkg = JSON.parse(await readFile(path.join(root, 'node_modules/lighthouse/package.json'), 'utf8'))
  return {
    lighthouse: lhPkg.version,
    chrome: undefined,
    node: process.version,
    vite: pkg.devDependencies.vite,
    react: pkg.dependencies.react,
  }
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const managed = !process.env.LH_URL
  const server = managed ? startPreview() : null
  try {
    await waitForServer(BASE_URL)
    const chromePath = process.env.CHROME_PATH
    const versions = await toolVersions()
    const results = []

    for (const page of PAGES) {
      for (const profile of PROFILES) {
        const runs = []
        for (let run = 1; run <= RUNS; run++) {
          const chrome = await launch({ ...(chromePath ? { chromePath } : {}), chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] })
          try {
            const flags = { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: Object.keys(TARGETS) }
            const result = await lighthouse(`${BASE_URL}${page.path}`, flags, profile.config)
            if (!result) throw new Error('Lighthouse returned no result')
            versions.chrome = result.lhr.environment.hostUserAgent
            const [json, html] = result.report
            const base = `${page.id}-${profile.id}-run${run}`
            await writeFile(path.join(outDir, `${base}.json`), json)
            await writeFile(path.join(outDir, `${base}.html`), html)
            const { categories, audits } = result.lhr
            runs.push({
              run,
              scores: Object.fromEntries(Object.keys(TARGETS).map((key) => [key, Math.round((categories[key]?.score ?? 0) * 100)])),
              lcp: audits['largest-contentful-paint'].numericValue,
              cls: audits['cumulative-layout-shift'].numericValue,
              tbt: audits['total-blocking-time'].numericValue,
            })
            console.log(`${base}: ${JSON.stringify(runs.at(-1).scores)} LCP ${Math.round(runs.at(-1).lcp)}ms CLS ${runs.at(-1).cls.toFixed(3)} TBT ${Math.round(runs.at(-1).tbt)}ms`)
          } finally {
            await chrome.kill()
          }
        }
        results.push({
          page: page.label,
          path: page.path,
          profile: profile.id,
          runs,
          median: {
            scores: Object.fromEntries(Object.keys(TARGETS).map((key) => [key, median(runs.map((r) => r.scores[key]))])),
            lcp: median(runs.map((r) => r.lcp)),
            cls: median(runs.map((r) => r.cls)),
            tbt: median(runs.map((r) => r.tbt)),
          },
        })
      }
    }

    const environment = {
      date: new Date().toISOString(),
      os: `${os.type()} ${os.release()} (${os.arch()})`,
      cpu: `${os.cpus()[0]?.model ?? 'unknown'} x${os.cpus().length}`,
      memoryGB: Math.round(os.totalmem() / 1024 ** 3),
      url: BASE_URL,
      build: 'vite build + vite preview, VITE_ENABLE_MOCKS=true, default scenario',
      throttling: 'Lighthouse defaults (simulated: mobile = Slow 4G + 4x CPU, desktop = no CPU slowdown)',
      runsPerCombination: RUNS,
      statistic: 'median',
    }
    await writeFile(path.join(outDir, 'summary.json'), JSON.stringify({ versions, environment, targets: TARGETS, results }, null, 2))

    const rows = results.map(
      (r) =>
        `| ${r.page} | ${r.profile} | ${r.median.scores.performance} | ${r.median.scores.accessibility} | ${r.median.scores['best-practices']} | ${r.median.scores.seo} | ${Math.round(r.median.lcp)} ms | ${r.median.cls.toFixed(3)} | ${Math.round(r.median.tbt)} ms |`,
    )
    const md = [
      '# Lighthouse — resultados medidos',
      '',
      `Medianas de ${RUNS} execuções por página e perfil. Metas: Performance ≥ ${TARGETS.performance}, Accessibility ≥ ${TARGETS.accessibility}, Best Practices ≥ ${TARGETS['best-practices']}, SEO ≥ ${TARGETS.seo}.`,
      '',
      '| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |',
      '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...rows,
      '',
      '## Ferramentas e ambiente',
      '',
      `- Lighthouse ${versions.lighthouse}; ${versions.chrome}; Node ${versions.node}; Vite ${versions.vite}; React ${versions.react}`,
      `- ${environment.os}; ${environment.cpu}; ${environment.memoryGB} GB RAM`,
      `- ${environment.build}`,
      `- Throttling: ${environment.throttling}`,
      `- Data: ${environment.date}`,
      '',
      'Relatórios HTML/JSON individuais: `lighthouse/reports/<página>-<perfil>-run<N>.(html|json)`.',
      '',
    ].join('\n')
    await writeFile(path.join(outDir, 'summary.md'), md)
    console.log('\n' + md)
  } finally {
    server?.kill()
    if (managed && process.platform === 'win32' && server?.pid) {
      spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' })
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
