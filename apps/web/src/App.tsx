import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type RepositoryData = {
  fullName: string
  description: string
  stars: number
  language: string
}

type ParsedRepo = {
  owner: string
  repo: string
}

const parseGitHubRepositoryUrl = (value: string): ParsedRepo | null => {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(normalized)
  } catch {
    return null
  }

  if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'github.com') {
    return null
  }

  const segments = parsedUrl.pathname
    .split('/')
    .filter(Boolean)
    .slice(0, 2)

  if (segments.length < 2) {
    return null
  }

  const [owner, rawRepo] = segments
  const repo = rawRepo.endsWith('.git') ? rawRepo.slice(0, -4) : rawRepo

  if (!owner || !repo) {
    return null
  }

  return { owner, repo }
}

function App() {
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [repositoryData, setRepositoryData] = useState<RepositoryData | null>(null)

  const parsedRepository = useMemo(
    () => parseGitHubRepositoryUrl(repositoryUrl),
    [repositoryUrl],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setRepositoryData(null)

    if (!parsedRepository) {
      setErrorMessage('Informe uma URL válida de repositório público do GitHub.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `https://api.github.com/repos/${parsedRepository.owner}/${parsedRepository.repo}`,
      )

      if (response.status === 404) {
        setErrorMessage('Repositório não encontrado ou indisponível publicamente.')
        return
      }

      if (response.status === 403) {
        setErrorMessage('Limite de requisições do GitHub atingido. Tente novamente em alguns minutos.')
        return
      }

      if (!response.ok) {
        setErrorMessage('Não foi possível consultar o repositório agora.')
        return
      }

      const data = (await response.json()) as {
        full_name: string
        description: string | null
        stargazers_count: number
        language: string | null
      }

      setRepositoryData({
        fullName: data.full_name,
        description: data.description ?? 'Sem descrição.',
        stars: data.stargazers_count,
        language: data.language ?? 'Não informada',
      })
    } catch {
      setErrorMessage('Erro de rede ao consultar o GitHub. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900">GitPulse</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Informe a URL de um repositório público do GitHub para consultar seus dados.
          </p>
        </header>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="repository-url">
            URL do repositório
          </label>

          <input
            id="repository-url"
            type="url"
            value={repositoryUrl}
            onChange={(event) => {
              setRepositoryUrl(event.target.value)
              if (errorMessage) {
                setErrorMessage('')
              }
            }}
            placeholder="https://github.com/owner/repo"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
            autoComplete="off"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Consultando...' : 'Enviar'}
          </button>
        </form>

        {errorMessage ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {repositoryData ? (
          <article className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            <p className="font-semibold">Repositório encontrado com sucesso.</p>
            <p className="mt-2">
              <span className="font-medium">Nome:</span> {repositoryData.fullName}
            </p>
            <p>
              <span className="font-medium">Descrição:</span> {repositoryData.description}
            </p>
            <p>
              <span className="font-medium">Stars:</span> {repositoryData.stars}
            </p>
            <p>
              <span className="font-medium">Linguagem:</span> {repositoryData.language}
            </p>
          </article>
        ) : null}
      </section>
    </main>
  )
}

export default App
