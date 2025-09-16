export function formatNombreFr(n: number | null | undefined): string {
    if (typeof n !== "number") return "—"
    return n.toLocaleString("fr-FR")
  }

export function formatNombre(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); // espace insécable
}

  