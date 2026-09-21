import { REPO_URL } from "@/components/site-header"

export function SiteFooter() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      © 2026{" "}
      <a
        href="https://github.com/Chronona"
        target="_blank"
        rel="noopener"
        className="text-cyan-300 hover:underline"
      >
        chronona
      </a>{" "}
      ·{" "}
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener"
        className="text-cyan-300 hover:underline"
      >
        GitHubリポジトリ
      </a>{" "}
      · MIT License
    </footer>
  )
}
