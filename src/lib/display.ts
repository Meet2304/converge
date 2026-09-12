/** PII: nicknames anonymized for signed-out viewers. */
export function displayLabel(opts: {
  signedInViewer: boolean
  nickname: string
  index?: number
}) {
  if (opts.signedInViewer) return opts.nickname
  return `Hacker ${(opts.index ?? 0) + 1}`
}

export const displayLabelAlias = displayLabel
export const DEFAULT_AVATAR = "/avatars/default.svg"
