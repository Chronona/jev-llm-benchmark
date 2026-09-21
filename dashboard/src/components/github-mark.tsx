import { siGithub } from "simple-icons"

// simple-icons 配布の公式 GitHub マーク（24x24）。
// 手書きパスの崩れを避けるためパッケージの path を使用する。
export function GithubMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      height={size}
      width={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="block shrink-0"
    >
      <path d={siGithub.path} />
    </svg>
  )
}
