import mermaid from 'mermaid'

const renderMermaid = async () => {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' })
  await mermaid.run({ querySelector: '.mermaid' })

  document.querySelectorAll('.mermaid').forEach((element) => {
    element.classList.remove('mermaid')
  })
}

renderMermaid()
