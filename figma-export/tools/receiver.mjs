// Dev tool: tiny local server that saves SVGs POSTed by dom-to-svg.js into figma-export/.
//   node figma-export/tools/receiver.mjs "$PWD"   (listens on http://localhost:5199)
import { createServer } from 'node:http'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.argv[2]
createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (req.method === 'OPTIONS') return res.end()
  const url = new URL(req.url, 'http://localhost')
  const name = url.searchParams.get('name') ?? ''
  if (!/^[a-z0-9][a-z0-9/_-]*$/i.test(name)) {
    res.statusCode = 400
    return res.end('bad name')
  }
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    const file = join(root, 'figma-export', `${name}.svg`)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, Buffer.concat(chunks))
    res.end(`saved ${name}.svg`)
  })
}).listen(5199, () => console.log('receiver on 5199'))
