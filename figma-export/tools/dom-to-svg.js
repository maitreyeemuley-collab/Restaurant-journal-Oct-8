/**
 * Dev tool: snapshots the page currently shown in the browser into an editable SVG (real text,
 * rectangles, borders, shadows, icons) so it can be dragged into Figma. Not part of the app.
 *
 * Usage (from the browser console / a browser-automation call):
 *   const m = await import('/figma-export/tools/dom-to-svg.js?v=' + Date.now())
 *   await m.capture('mobile/04-discover')   // POSTs the SVG to the local receiver
 */
const NS_SKIP = new Set([
  'script',
  'style',
  'head',
  'title',
  'meta',
  'link',
  'noscript',
  'template',
])
const RECEIVER = 'http://localhost:5199/save'

const num = (n) => Math.round(n * 100) / 100
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function parseColor(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || '')
  if (!m) return null
  const t = m[1].split(/[\s,/]+/).filter(Boolean)
  const alpha =
    t[3] === undefined ? 1 : t[3].endsWith('%') ? parseFloat(t[3]) / 100 : parseFloat(t[3])
  return {
    r: Math.round(parseFloat(t[0])),
    g: Math.round(parseFloat(t[1])),
    b: Math.round(parseFloat(t[2])),
    a: alpha,
  }
}
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('')
const paint = (attr, c) =>
  ` ${attr}="${hex(c)}"` + (c.a < 1 ? ` ${attr}-opacity="${num(c.a)}"` : '')

function cornerRadius(value, w, h) {
  const first = (value || '0').split(' ')[0]
  const px = first.endsWith('%')
    ? (parseFloat(first) / 100) * Math.min(w, h)
    : parseFloat(first) || 0
  return Math.min(px, Math.min(w, h) / 2)
}
function radiiOf(cs, w, h) {
  return [
    cornerRadius(cs.borderTopLeftRadius, w, h),
    cornerRadius(cs.borderTopRightRadius, w, h),
    cornerRadius(cs.borderBottomRightRadius, w, h),
    cornerRadius(cs.borderBottomLeftRadius, w, h),
  ]
}
function roundedPath(x, y, w, h, [tl, tr, br, bl]) {
  const a = (r, dx, dy) =>
    r > 0 ? `A${num(r)} ${num(r)} 0 0 1 ${num(dx)} ${num(dy)}` : `L${num(dx)} ${num(dy)}`
  return (
    `M${num(x + tl)} ${num(y)}H${num(x + w - tr)}${a(tr, x + w, y + tr)}V${num(y + h - br)}` +
    `${a(br, x + w - br, y + h)}H${num(x + bl)}${a(bl, x, y + h - bl)}V${num(y + tl)}${a(tl, x + tl, y)}Z`
  )
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

const measureCtx = document.createElement('canvas').getContext('2d')
function fontMetrics(cs) {
  measureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  const m = measureCtx.measureText('Mg')
  return { ascent: m.fontBoundingBoxAscent, descent: m.fontBoundingBoxDescent, ctx: measureCtx }
}

function underlined(el) {
  for (let e = el; e && e !== document.body; e = e.parentElement) {
    const c = getComputedStyle(e)
    if (c.textDecorationLine.includes('underline')) return true
    if (c.display !== 'inline') break
  }
  return false
}

function textElement(text, x, baselineY, cs, color, extra = '') {
  const family = cs.fontFamily.split(',')[0].trim().replace(/["']/g, '')
  const ls =
    cs.letterSpacing !== 'normal' ? ` letter-spacing="${parseFloat(cs.letterSpacing)}"` : ''
  const deco = extra.includes('underline') ? ' text-decoration="underline"' : ''
  return (
    `<text x="${num(x)}" y="${num(baselineY)}" font-family="${esc(family)}" font-size="${parseFloat(cs.fontSize)}"` +
    ` font-weight="${cs.fontWeight}"${ls}${deco}${paint('fill', color)} xml:space="preserve">${esc(text)}</text>`
  )
}

export async function toSvg() {
  const width = window.innerWidth
  const height = window.innerHeight
  const defs = []
  let idCounter = 0
  const nextId = (p) => `${p}${++idCounter}`
  const tileData = new Map()
  let nodes = 0

  await Promise.all(
    [...document.querySelectorAll('img.leaflet-tile')]
      .filter((i) => i.complete && i.naturalWidth)
      .map(async (img) => {
        try {
          const res = await fetch(img.src, { mode: 'cors' })
          tileData.set(img, await blobToDataUrl(await res.blob()))
        } catch {
          /* leave the tile out */
        }
      }),
  )

  function shadowFilter(cs, rect) {
    if (!cs.boxShadow || cs.boxShadow === 'none') return null
    const parts = cs.boxShadow
      .split(/,(?![^(]*\))/)
      .map((s) => s.trim())
      .filter((s) => !s.includes('inset'))
    if (parts.length === 0) return null
    const id = nextId('shadow')
    let chain = '<feFlood flood-opacity="0" result="BackgroundImageFix"/>'
    let prev = 'BackgroundImageFix'
    parts.forEach((part, i) => {
      const color = parseColor(part)
      const nums = part
        .replace(/rgba?\([^)]*\)/, '')
        .trim()
        .split(/\s+/)
        .map(parseFloat)
      if (!color) return
      const [dx = 0, dy = 0, blur = 0] = nums
      const result = `effect${i + 1}_dropShadow`
      chain +=
        `<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha${i}"/>` +
        `<feOffset dx="${dx}" dy="${dy}"/><feGaussianBlur stdDeviation="${num(blur / 2)}"/>` +
        `<feComposite in2="hardAlpha${i}" operator="out"/>` +
        `<feColorMatrix type="matrix" values="0 0 0 0 ${num(color.r / 255)} 0 0 0 0 ${num(color.g / 255)} 0 0 0 0 ${num(color.b / 255)} 0 0 0 ${num(color.a)} 0"/>` +
        `<feBlend mode="normal" in2="${prev}" result="${result}"/>`
      prev = result
    })
    chain += `<feBlend mode="normal" in="SourceGraphic" in2="${prev}" result="shape"/>`
    defs.push(
      `<filter id="${id}" x="${num(rect.left - 60)}" y="${num(rect.top - 60)}" width="${num(rect.width + 120)}" height="${num(rect.height + 120)}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">${chain}</filter>`,
    )
    return id
  }

  function drawBox(el, cs, rect, out) {
    const { left: x, top: y, width: w, height: h } = rect
    if (w <= 0 || h <= 0) return
    const r = radiiOf(cs, w, h)
    const bg = parseColor(cs.backgroundColor)
    if (bg && bg.a > 0) {
      const filterId = shadowFilter(cs, rect)
      out.push(
        `<path d="${roundedPath(x, y, w, h, r)}"${paint('fill', bg)}${filterId ? ` filter="url(#${filterId})"` : ''}/>`,
      )
    }
    const widths = ['Top', 'Right', 'Bottom', 'Left'].map((s) =>
      cs[`border${s}Style`] === 'none' ? 0 : parseFloat(cs[`border${s}Width`]) || 0,
    )
    const colors = ['Top', 'Right', 'Bottom', 'Left'].map((s) => parseColor(cs[`border${s}Color`]))
    if (widths.some((v) => v > 0)) {
      const uniform =
        widths.every((v) => v === widths[0]) &&
        colors.every((c) => c && c.a === colors[0].a && hex(c) === hex(colors[0]))
      if (uniform) {
        const bw = widths[0]
        out.push(
          `<path d="${roundedPath(
            x + bw / 2,
            y + bw / 2,
            w - bw,
            h - bw,
            r.map((v) => Math.max(0, v - bw / 2)),
          )}"${paint('stroke', colors[0])} stroke-width="${bw}"/>`,
        )
      } else {
        const [bt, br, bb, bl] = widths
        if (bt)
          out.push(
            `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${bt}"${paint('fill', colors[0])}/>`,
          )
        if (bb)
          out.push(
            `<rect x="${num(x)}" y="${num(y + h - bb)}" width="${num(w)}" height="${bb}"${paint('fill', colors[2])}/>`,
          )
        if (bl)
          out.push(
            `<rect x="${num(x)}" y="${num(y)}" width="${bl}" height="${num(h)}"${paint('fill', colors[3])}/>`,
          )
        if (br)
          out.push(
            `<rect x="${num(x + w - br)}" y="${num(y)}" width="${br}" height="${num(h)}"${paint('fill', colors[1])}/>`,
          )
      }
    }
    const ow = cs.outlineStyle === 'none' ? 0 : parseFloat(cs.outlineWidth) || 0
    const oc = parseColor(cs.outlineColor)
    if (ow > 0 && oc && oc.a > 0) {
      const e = (parseFloat(cs.outlineOffset) || 0) + ow / 2
      out.push(
        `<path d="${roundedPath(
          x - e,
          y - e,
          w + 2 * e,
          h + 2 * e,
          r.map((v) => v + e),
        )}"${paint('stroke', oc)} stroke-width="${ow}"/>`,
      )
    }
  }

  function drawTextNode(node, out) {
    const parent = node.parentElement
    if (!parent || !/\S/.test(node.data)) return
    const cs = getComputedStyle(parent)
    if (cs.visibility === 'hidden') return
    const color = parseColor(cs.color)
    if (!color) return
    const { ascent } = fontMetrics(cs)
    const lines = []
    const range = document.createRange()
    for (let i = 0; i < node.data.length; i++) {
      const ch = node.data[i]
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const rects = range.getClientRects()
      if (rects.length === 0) continue
      const rc = rects[0]
      if (rc.width === 0 && /\s/.test(ch)) continue
      const last = lines[lines.length - 1]
      if (last && Math.abs(last.top - rc.top) < 3) last.text += ch
      else lines.push({ top: rc.top, left: rc.left, text: ch })
    }
    const deco = underlined(parent) ? 'underline' : ''
    for (const line of lines) {
      let text = line.text.replace(/\s+$/g, '')
      if (!text || line.top >= height || line.left >= width) continue
      if (cs.textTransform === 'uppercase') text = text.toUpperCase()
      out.push(textElement(text, line.left, line.top + ascent, cs, color, deco))
      nodes++
    }
  }

  function drawFormValue(el, cs, rect, out) {
    const tag = el.tagName.toLowerCase()
    const type = (el.getAttribute('type') || 'text').toLowerCase()
    if (tag === 'input' && type === 'checkbox') {
      const s = Math.min(rect.width, rect.height)
      const checked = el.checked
      out.push(
        `<rect x="${num(rect.left + 1)}" y="${num(rect.top + 1)}" width="${num(s - 2)}" height="${num(s - 2)}" rx="4"${checked ? paint('fill', { r: 180, g: 71, b: 43, a: 1 }) : ' fill="#ffffff"'}${paint('stroke', checked ? { r: 180, g: 71, b: 43, a: 1 } : { r: 133, g: 118, b: 103, a: 1 })} stroke-width="1.5"/>`,
      )
      if (checked) {
        out.push(
          `<path d="M${num(rect.left + s * 0.28)} ${num(rect.top + s * 0.52)}l${num(s * 0.17)} ${num(s * 0.18)} ${num(s * 0.29)}-${num(s * 0.34)}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
        )
      }
      return
    }
    let text = ''
    let color = parseColor(cs.color)
    if (tag === 'select') {
      text = el.selectedOptions[0]?.textContent?.trim() ?? ''
    } else if (el.value) {
      text = type === 'password' ? '•'.repeat(el.value.length) : el.value
    } else if (el.placeholder) {
      text = el.placeholder
      color = { r: 117, g: 117, b: 117, a: 1 }
    }
    if (tag === 'select') {
      const cy = rect.top + rect.height / 2
      out.push(
        `<path d="M${num(rect.left + rect.width - 26)} ${num(cy - 2)}l5 5 5-5" stroke="#2b2420" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      )
    }
    if (!text || !color) return
    const { ascent, descent, ctx } = fontMetrics(cs)
    const padL = parseFloat(cs.paddingLeft) + (parseFloat(cs.borderLeftWidth) || 0)
    const padR = parseFloat(cs.paddingRight) + (parseFloat(cs.borderRightWidth) || 0)
    const x = rect.left + padL
    if (tag === 'textarea') {
      const maxW = rect.width - padL - padR
      const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5
      let top = rect.top + parseFloat(cs.paddingTop) + (parseFloat(cs.borderTopWidth) || 0)
      let line = ''
      const flush = () => {
        out.push(
          textElement(
            line.trimEnd(),
            x,
            top + (lineH - (ascent + descent)) / 2 + ascent,
            cs,
            color,
          ),
        )
        top += lineH
        line = ''
      }
      for (const word of text.split(' ')) {
        const attempt = line ? `${line} ${word}` : word
        if (line && ctx.measureText(attempt).width > maxW) flush()
        line = line ? `${line} ${word}` : word
      }
      if (line) flush()
    } else {
      const baseline = rect.top + rect.height / 2 - (ascent + descent) / 2 + ascent
      out.push(textElement(text, x, baseline, cs, color))
    }
    nodes++
  }

  function drawIcon(el, cs, rect, out) {
    const vb = el.viewBox && el.viewBox.baseVal
    const vbW = vb && vb.width ? vb.width : 24
    const scale = rect.width / vbW
    const color = hex(parseColor(cs.color) || { r: 0, g: 0, b: 0, a: 1 })
    const attr = (name) => {
      const v = el.getAttribute(name)
      return v ? ` ${name}="${esc(v === 'currentColor' ? color : v)}"` : ''
    }
    out.push(
      `<g transform="translate(${num(rect.left)} ${num(rect.top)}) scale(${num(scale)})"${attr('fill')}${attr('stroke')}${attr('stroke-width')}${attr('stroke-linecap')}${attr('stroke-linejoin')}>${el.innerHTML.replace(/currentColor/g, color)}</g>`,
    )
    nodes++
  }

  const positioned = (el) => {
    const p = getComputedStyle(el).position
    return p === 'absolute' || p === 'fixed' || p === 'sticky'
  }
  const zIndexOf = (el) => parseInt(getComputedStyle(el).zIndex, 10) || 0
  const maxZCache = new Map()
  /** Highest z-index among positioned descendants (e.g. Leaflet's controls, z-index 1000). */
  function maxZBelow(el) {
    if (maxZCache.has(el)) return maxZCache.get(el)
    // An isolated element is its own stacking context: nothing inside can paint above its siblings.
    if (getComputedStyle(el).isolation === 'isolate') {
      maxZCache.set(el, 0)
      return 0
    }
    let max = 0
    for (const d of el.querySelectorAll('*')) {
      const c = getComputedStyle(d)
      if (c.position !== 'static' && c.zIndex !== 'auto')
        max = Math.max(max, parseInt(c.zIndex, 10) || 0)
    }
    maxZCache.set(el, max)
    return max
  }
  /** Paint order key: positioned elements, and wrappers holding a z-indexed descendant, go on top. */
  function stackKey(el) {
    if (positioned(el)) return { top: true, z: zIndexOf(el) }
    const z = maxZBelow(el)
    return z > 0 ? { top: true, z } : { top: false, z: 0 }
  }

  function walkChildren(el, out, deferred) {
    const kids = [...el.childNodes]
    const keyed = kids.map((k, i) => ({
      k,
      i,
      key: k.nodeType === 1 ? stackKey(k) : { top: false, z: 0 },
    }))
    const normal = keyed.filter((e) => !e.key.top)
    const top = keyed.filter((e) => e.key.top).sort((a, b) => a.key.z - b.key.z || a.i - b.i)
    for (const { k } of [...normal, ...top]) walk(k, out, deferred)
  }

  function walk(node, out, deferred) {
    if (node.nodeType === 3) return drawTextNode(node, out)
    if (node.nodeType !== 1) return
    const el = node
    const tag = el.tagName.toLowerCase()
    if (NS_SKIP.has(tag) || el.classList.contains('visually-hidden')) return
    if (el.classList.contains('leaflet-tile-pane')) {
      for (const [img, url] of tileData) {
        const r = img.getBoundingClientRect()
        if (r.right <= 0 || r.bottom <= 0 || r.left >= width || r.top >= height) continue
        out.push(
          `<image x="${num(r.left)}" y="${num(r.top)}" width="${num(r.width)}" height="${num(r.height)}" xlink:href="${url}"/>`,
        )
      }
      return
    }
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return
    if (tag === 'dialog') {
      if (!el.open) return
      if (deferred) {
        deferred.push(el)
        return
      }
    }
    const rect = el.getBoundingClientRect()
    // Skip anything entirely outside the frame (long lists scroll far below the screen).
    if (
      rect.width > 0 &&
      rect.height > 0 &&
      cs.position !== 'fixed' &&
      (rect.top >= height || rect.bottom <= 0 || rect.left >= width || rect.right <= 0)
    ) {
      return
    }
    const group = []

    if (el.classList.contains('rj-pin')) {
      // The pin is a rotated square with three rounded corners: draw the teardrop directly.
      const c = parseColor(getComputedStyle(el).backgroundColor)
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const s = 22
      const filterId = shadowFilter(cs, { left: -s / 2, top: -s / 2, width: s, height: s }) // local to the rotated <g>
      group.push(
        `<g transform="translate(${num(cx)} ${num(cy)}) rotate(-45)"><path d="${roundedPath(-s / 2, -s / 2, s, s, [s / 2, s / 2, s / 2, 0])}"${c ? paint('fill', c) : ''} stroke="#ffffff" stroke-width="3"${filterId ? ` filter="url(#${filterId})"` : ''}/></g>`,
      )
      out.push(group.join(''))
      nodes++
      return
    }

    if (tag === 'svg') {
      drawIcon(el, cs, rect, group)
    } else if (tag === 'img') {
      drawBox(el, cs, rect, group)
      if (el.src.startsWith('data:') && rect.width > 0) {
        const id = nextId('img')
        defs.push(
          `<clipPath id="${id}"><path d="${roundedPath(rect.left, rect.top, rect.width, rect.height, radiiOf(cs, rect.width, rect.height))}"/></clipPath>`,
        )
        group.push(
          `<image x="${num(rect.left)}" y="${num(rect.top)}" width="${num(rect.width)}" height="${num(rect.height)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})" xlink:href="${el.src}"/>`,
        )
        nodes++
      }
    } else if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      const type = (el.getAttribute('type') || 'text').toLowerCase()
      if (['hidden', 'radio', 'file'].includes(type)) return
      if (type !== 'checkbox') drawBox(el, cs, rect, group)
      drawFormValue(el, cs, rect, group)
    } else {
      drawBox(el, cs, rect, group)
      nodes++
      const clips =
        (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') &&
        tag !== 'html' &&
        tag !== 'body'
      const inner = []
      if (tag === 'details' && !el.open) {
        const summary = el.querySelector('summary')
        if (summary) walk(summary, inner, null)
      } else {
        walkChildren(el, inner, deferred)
      }
      if (clips && rect.width > 0 && rect.height > 0) {
        const id = nextId('clip')
        defs.push(
          `<clipPath id="${id}"><path d="${roundedPath(rect.left, rect.top, rect.width, rect.height, radiiOf(cs, rect.width, rect.height))}"/></clipPath>`,
        )
        group.push(`<g clip-path="url(#${id})">${inner.join('')}</g>`)
      } else {
        group.push(inner.join(''))
      }
    }

    const opacity = parseFloat(cs.opacity)
    out.push(opacity < 1 ? `<g opacity="${num(opacity)}">${group.join('')}</g>` : group.join(''))
  }

  const body = []
  const deferred = []
  const bodyBg = parseColor(getComputedStyle(document.body).backgroundColor) || {
    r: 250,
    g: 245,
    b: 238,
    a: 1,
  }
  body.push(`<rect width="${width}" height="${height}"${paint('fill', bodyBg)}/>`)
  walkChildren(document.body, body, deferred)
  for (const dialog of deferred) {
    body.push(`<rect width="${width}" height="${height}" fill="#2b2420" fill-opacity="0.5"/>`)
    walk(dialog, body, null)
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">` +
    `<defs><clipPath id="frame"><rect width="${width}" height="${height}"/></clipPath>${defs.join('')}</defs>` +
    `<g clip-path="url(#frame)">${body.join('')}</g></svg>`
  return { svg, width, height, nodes }
}

/** Snapshot the current page and POST it to the local receiver under `name`. */
export async function capture(name) {
  const style = document.createElement('style')
  style.textContent =
    '*{animation:none!important;transition:none!important;caret-color:transparent!important}'
  document.head.appendChild(style)
  try {
    await document.fonts.ready
    await new Promise((r) => setTimeout(r, 250))
    const { svg, width, height, nodes } = await toSvg()
    const res = await fetch(`${RECEIVER}?name=${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: svg,
    })
    return { name, width, height, nodes, bytes: svg.length, saved: await res.text() }
  } finally {
    style.remove()
  }
}
