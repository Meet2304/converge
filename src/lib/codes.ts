import { customAlphabet } from "nanoid"

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const makeShareCode = customAlphabet(alphabet, 6)
export const makeInviteCode = customAlphabet(alphabet, 8)

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "org"
  )
}
