// One-page CV rendered from src/data/cv.yaml — the same file feeds /cv on the site.
// Compile from the repo root: typst compile --root . cv/resume.typ dist/Daniil_Eskov_CV.pdf
// `npm run pdf` also copies it to dist/resume.pdf, the stable path older links point at.
#let cv = yaml("/src/data/cv.yaml")

#set document(title: cv.name + " — " + cv.headline, author: cv.name)
#set page(paper: "a4", margin: (x: 1.6cm, y: 1.4cm))
#set text(font: "Libertinus Serif", size: 10pt, lang: "ru")
#set par(leading: 0.55em)
#show heading.where(level: 1): it => block(
  above: 1.1em, below: 0.5em,
  text(size: 10.5pt, weight: "bold", tracking: 0.06em, upper(it.body)),
)
#show link: set text(fill: rgb("#1d4ed8"))

#let muted = luma(90)
#let contacts = {
  let out = (link(cv.contacts.telegram, "Telegram"),)
  if cv.contacts.email != "" { out.push(link("mailto:" + cv.contacts.email, cv.contacts.email)) }
  out.push(link(cv.contacts.site, cv.contacts.site.replace("https://", "")))
  out.push(link(cv.contacts.github, "GitHub"))
  if cv.location != "" { out.push(cv.location) }
  out
}

#text(size: 20pt, weight: "bold")[#cv.name]
#v(-0.5em)
#text(size: 11pt, fill: muted)[#cv.headline]
#v(0.1em)
#contacts.join([ #h(0.4em) · #h(0.4em) ])

= О себе
#cv.summary

= Стек
#for g in cv.stack [
  *#g.group:* #g.items.join(", ") \
]

= Опыт
#for e in cv.experience [
  #block(above: 0.8em, below: 0.3em)[
    *#e.role* #h(1fr) #text(fill: muted)[#e.period]
    #if e.org != "" [ \ #text(fill: muted)[#e.org] ]
  ]
  #list(..e.points.map(p => [#p]))
]

= Проекты
#for p in cv.projects [
  - *#p.name* — #p.line. #text(fill: muted)[#p.stack]
]

= Образование
#for e in cv.education [
  *#e.degree*
  #if e.place != "" [ — #e.place ]
  #h(1fr) #text(fill: muted)[#e.period] \
]

= Языки
#cv.languages.join(", ")
