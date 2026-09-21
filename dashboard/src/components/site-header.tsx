import { Button } from "@/components/ui/button"
import { GithubMark } from "@/components/github-mark"

export const REPO_URL = "https://github.com/Chronona/jev-llm-benchmark"

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">
            Jev vs LLM レイテンシ比較ダッシュボード
          </h1>
          <p className="text-sm text-muted-foreground">
            TypeSafe Jev（System One）とOpenAI互換LLM（ローカルLLM含む）の回答速度を比較
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          aria-label="GitHubリポジトリ"
        >
          <a href={REPO_URL} target="_blank" rel="noopener">
            <GithubMark size={20} />
          </a>
        </Button>
      </div>
    </header>
  )
}
