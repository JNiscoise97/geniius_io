export function highlightSearchMatches(
  text: string,
  search: string,
  registerRef?: (el: HTMLElement) => void
) {
  if (!search.trim()) return [text]

  const normalizedSearch = search.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  const regex = new RegExp(`(${search})`, "gi")

  return text.split(regex).map((chunk, i) => {
    const normalizedChunk = chunk.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

    if (normalizedChunk === normalizedSearch) {
      return (
        <mark
          key={i}
          className="bg-yellow-200 text-yellow-900 px-1 rounded-sm"
          ref={registerRef} // ✅ chaque match enregistre sa ref
        >
          {chunk}
        </mark>
      )
    }

    return <span key={i}>{chunk}</span>
  })
}
