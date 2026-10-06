import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])

export function renderQualityDeliveryRecords(records) {
  const ids = new Set()
  for (const record of records) {
    if (!/^C\d{2}$/.test(record.id) || ids.has(record.id)) throw new Error(`Invalid record ID: ${record.id}`)
    ids.add(record.id)
  }
  const navigation = records.map(record => `            <li><a href="#${escapeHtml(record.id)}"><span>${escapeHtml(record.id)}</span>${escapeHtml(record.title)}</a></li>`).join('\n')
  const articles = records.map(record => `        <article id="${escapeHtml(record.id)}" aria-labelledby="heading-${escapeHtml(record.id)}">
          <h2 id="heading-${escapeHtml(record.id)}"><span>${escapeHtml(record.id)}</span>${escapeHtml(record.headline)}</h2>
${record.body.map(paragraph => `          <p>${escapeHtml(paragraph)}</p>`).join('\n')}
          <dl>
${record.fields.map(field => `            <div><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.value)}</dd></div>`).join('\n')}
          </dl>
          <a class="back-to-index" href="#record-index">返回记录目录</a>
        </article>`).join('\n')

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f8f9fc" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="description" content="阅读交付保障中的 ${records.length} 份关联记录，包括训练目标、客户需求、生产条件、质量检查与交付对照。" />
    <meta property="og:locale" content="zh_CN" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="刻行时空" />
    <meta property="og:title" content="交付保障 · 任务记录｜刻行时空" />
    <meta property="og:description" content="查看训练目标、客户需求、生产记录、质量检查与交付结果。" />
    <meta name="twitter:card" content="summary" />
    <title>交付保障 · 任务记录｜刻行时空</title>
    <style>
      @font-face{font-family:MotionGrotesque;src:url('/assets/fonts/miniature-graphic/bricolage-grotesque-latin-variable.woff2') format('woff2');font-weight:200 800;font-display:swap}
      :root{font-family:MotionGrotesque,'PingFang SC','Microsoft YaHei',sans-serif;color:#23282a;background:#f8f9fc;font-synthesis:none;scrollbar-color:#9295a4 #f8f9fc}
      *{box-sizing:border-box}body{margin:0}a{color:#39418f;text-underline-offset:5px;text-decoration-thickness:1px}a:hover{color:#23282a}a:focus-visible{outline:2px solid #39418f;outline-offset:5px}::selection{background:#39418f;color:#fff}
      .skip{position:absolute;top:12px;left:24px;padding:12px;background:#f8f9fc;transform:translateY(-200%)}.skip:focus{transform:none}
      .site-bar,main,.site-footer{width:min(1220px,calc(100% - 64px));margin-inline:auto}.site-bar{display:flex;justify-content:space-between;align-items:center;gap:24px;min-height:80px;border-bottom:1px solid #d8dcdf}.site-bar a{font-size:14px}.site-bar .brand{font-size:18px;font-weight:600;color:#23282a;text-decoration:none}
      .intro{padding:64px 0 48px}.intro h1{margin:0 0 16px;font-size:clamp(32px,4vw,48px);font-weight:550;line-height:1.25;letter-spacing:-.03em;text-wrap:balance}.intro p{margin:0;color:#545963;font-size:15px;line-height:1.8}
      .reading-layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:64px;align-items:start}.record-index{position:sticky;top:24px;max-height:calc(100svh - 48px);overflow:auto;padding:4px 8px 24px 0;scrollbar-width:thin}.record-index h2{font-size:15px;font-weight:550;margin:0 0 14px}.record-index ol{margin:0;padding:0;list-style:none}.record-index a{display:flex;align-items:baseline;gap:12px;min-height:42px;padding:10px 0;color:#545963;font-size:13px;line-height:1.65;text-decoration:none}.record-index a:hover{color:#39418f;text-decoration:underline}.record-index span{flex:0 0 30px;color:#39418f;font-variant-numeric:tabular-nums}
      .records{min-width:0;max-width:75ch}.records article{scroll-margin-top:28px;padding:0 0 56px;margin:0 0 44px;border-bottom:1px solid #d8dcdf}.records h2{display:flex;align-items:baseline;gap:14px;margin:0 0 16px;font-size:clamp(23px,2.2vw,30px);font-weight:550;line-height:1.45;letter-spacing:-.025em;text-wrap:balance}.records h2 span{flex-shrink:0;color:#39418f;font-size:14px;letter-spacing:0;font-variant-numeric:tabular-nums}.records p{font-size:15px;line-height:1.85;margin:0 0 24px;color:#545963}.records dl{margin:0 0 22px}.records dl>div{display:grid;grid-template-columns:128px minmax(0,1fr);gap:20px;padding:14px 0;border-top:1px solid #d8dcdf;font-size:14px;line-height:1.85}.records dt{color:#545963}.records dd{margin:0;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.back-to-index{display:inline-block;padding:8px 0;font-size:12px}.site-footer{display:flex;flex-wrap:wrap;gap:18px 30px;padding:0 0 48px;font-size:14px}
      @media(max-width:900px){.reading-layout{grid-template-columns:210px minmax(0,1fr);gap:36px}.records dl>div{grid-template-columns:104px minmax(0,1fr);gap:16px}}
      @media(max-width:699px){.site-bar,main,.site-footer{width:calc(100% - 40px)}.site-bar{min-height:70px;gap:16px}.site-bar a{font-size:12px}.site-bar .brand{font-size:16px}.intro{padding:40px 0 32px}.reading-layout{display:block}.record-index{position:static;max-height:none;padding:0 0 32px;margin-bottom:32px;border-bottom:1px solid #d8dcdf}.record-index a{min-height:44px}.records h2{gap:10px}.records p{font-size:14px}.records dl>div{grid-template-columns:1fr;gap:3px;padding:13px 0}.records article{margin-bottom:32px;padding-bottom:32px}.site-footer{padding-bottom:36px;font-size:13px}}
      @media print{.skip,.site-bar,.record-index,.back-to-index,.site-footer{display:none}main{width:100%;margin:0}.intro{padding:0 0 24px}.reading-layout{display:block}.records{max-width:none}.records article{break-inside:avoid}.records a{color:inherit}}
    </style>
  </head>
  <body>
    <a class="skip" href="#records">跳至完整记录</a>
    <header class="site-bar"><a class="brand" href="/">刻行时空</a><a href="/quality/delivery/">返回交付保障</a></header>
    <main>
      <header class="intro"><h1>任务记录</h1><p>DEMO-FR-0084 · ${records.length} 份关联记录</p></header>
      <div class="reading-layout">
        <nav class="record-index" id="record-index" aria-labelledby="record-index-title">
          <h2 id="record-index-title">记录目录</h2>
          <ol>
${navigation}
          </ol>
        </nav>
        <div class="records" id="records">
${articles}
        </div>
      </div>
    </main>
    <footer class="site-footer"><a href="/quality/delivery/">返回交付保障</a><a href="/">返回首页</a><a href="mailto:hello@kexing.space">联系我们</a></footer>
  </body>
</html>
`
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const records = JSON.parse(await readFile(path.join(projectRoot, 'public/assets/quality-trace/content.json'), 'utf8'))
  const target = path.join(projectRoot, 'quality/delivery/records/index.html')
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, renderQualityDeliveryRecords(records))
  console.log(`Generated ${records.length} static quality delivery records.`)
}
