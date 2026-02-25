import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type RepositoryData = {
  fullName: string
  description: string
  stars: number
  forks: number
  language: string
  healthScore: number
}

type CommitActivityPoint = {
  week: string
  commits: number
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

const formatWeekLabel = (timestampInSeconds: number): string => {
  const date = new Date(timestampInSeconds * 1000)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)

  return `${month}/${year}`
}

function App() {
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [repositoryData, setRepositoryData] = useState<RepositoryData | null>(null)
  const [commitActivity, setCommitActivity] = useState<CommitActivityPoint[]>([])
  const [commitActivityMessage, setCommitActivityMessage] = useState('')

  const parsedRepository = useMemo(
    () => parseGitHubRepositoryUrl(repositoryUrl),
    [repositoryUrl],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setRepositoryData(null)
    setCommitActivity([])
    setCommitActivityMessage('')

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
        forks_count: number
        language: string | null
        created_at: string
      }

      const repositoryAgeInYears = Math.max(
        (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365),
        0.1,
      )
      const healthScore = Number(
        ((data.stargazers_count + data.forks_count) / repositoryAgeInYears).toFixed(2),
      )

      setRepositoryData({
        fullName: data.full_name,
        description: data.description ?? 'Sem descrição.',
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language ?? 'Não informada',
        healthScore,
      })

      try {
        const commitActivityResponse = await fetch(
          `https://api.github.com/repos/${parsedRepository.owner}/${parsedRepository.repo}/stats/commit_activity`,
        )

        if (commitActivityResponse.status === 202) {
          setCommitActivityMessage(
            'Atividade de commits ainda está sendo processada pelo GitHub. Tente novamente em instantes.',
          )
          return
        }

        if (!commitActivityResponse.ok) {
          setCommitActivityMessage('Não foi possível carregar a atividade de commits para este repositório.')
          return
        }

        const commitActivityData = (await commitActivityResponse.json()) as Array<{
          week: number
          total: number
        }>

        const formattedCommitActivity: CommitActivityPoint[] = commitActivityData.map((weekData) => ({
          week: formatWeekLabel(weekData.week),
          commits: weekData.total,
        }))

        setCommitActivity(formattedCommitActivity)
      } catch {
        setCommitActivityMessage('Erro de rede ao carregar a atividade de commits.')
      }
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
              <span className="font-medium">Forks:</span> {repositoryData.forks}
            </p>
            <p>
              <span className="font-medium">Linguagem:</span> {repositoryData.language}
            </p>
            <p>
              <span className="font-medium">Health Score:</span> {repositoryData.healthScore}
            </p>
          </article>
        ) : null}

        {repositoryData ? (
          <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Atividade de Commits (últimas 52 semanas)</h2>

            {commitActivityMessage ? (
              <p className="mt-3 text-sm text-slate-600">{commitActivityMessage}</p>
            ) : null}

            {!commitActivityMessage && commitActivity.length > 0 ? (
              <div className="mt-3 h-64 w-full text-slate-900">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={commitActivity} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" minTickGap={24} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="commits"
                      stroke="currentColor"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default App
