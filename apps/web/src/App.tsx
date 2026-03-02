import { useEffect, useMemo, useState } from 'react'
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
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import {
  SiC,
  SiCplusplus,
  SiCss3,
  SiDart,
  SiElixir,
  SiGo,
  SiHaskell,
  SiHtml5,
  SiJavascript,
  SiKotlin,
  SiLua,
  SiPhp,
  SiPython,
  SiR,
  SiRuby,
  SiRust,
  SiScala,
  SiSwift,
  SiTypescript,
} from 'react-icons/si'
import { TbActivity, TbArrowLeft, TbBrandCSharp, TbCode, TbGitFork, TbStarFilled } from 'react-icons/tb'
import type { IconType } from 'react-icons'

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

type SuggestedRepository = {
  fullName: string
  description: string
  language: string
  stars: number
  url: string
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

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value)
}

const getLanguageIcon = (language: string): IconType => {
  const normalizedLanguage = language.toLowerCase()

  const languageIcons: Record<string, IconType> = {
    typescript: SiTypescript,
    javascript: SiJavascript,
    python: SiPython,
    java: TbCode,
    kotlin: SiKotlin,
    go: SiGo,
    rust: SiRust,
    c: SiC,
    'c++': SiCplusplus,
    'c#': TbBrandCSharp,
    php: SiPhp,
    ruby: SiRuby,
    swift: SiSwift,
    dart: SiDart,
    shell: TbCode,
    html: SiHtml5,
    css: SiCss3,
    scala: SiScala,
    r: SiR,
    'objective-c': TbCode,
    lua: SiLua,
    elixir: SiElixir,
    haskell: SiHaskell,
  }

  return languageIcons[normalizedLanguage] ?? TbCode
}

const getDashboardPath = (repository: ParsedRepo): string => {
  return `/dashboard/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}`
}

function HomePage() {
  const navigate = useNavigate()
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [suggestedRepositories, setSuggestedRepositories] = useState<SuggestedRepository[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(true)
  const [suggestionsMessage, setSuggestionsMessage] = useState('')

  const parsedRepository = useMemo(
    () => parseGitHubRepositoryUrl(repositoryUrl),
    [repositoryUrl],
  )

  useEffect(() => {
    const loadSuggestedRepositories = async () => {
      setSuggestionsLoading(true)
      setSuggestionsMessage('')

      try {
        const response = await fetch(
          'https://api.github.com/search/repositories?q=stars:%3E10000+archived:false&sort=stars&order=desc&per_page=5',
        )

        if (response.status === 403) {
          setSuggestionsMessage('Limite de requisições do GitHub atingido para sugestões. Tente novamente em instantes.')
          return
        }

        if (!response.ok) {
          setSuggestionsMessage('Não foi possível carregar sugestões de repositórios agora.')
          return
        }

        const data = (await response.json()) as {
          items: Array<{
            full_name: string
            description: string | null
            language: string | null
            stargazers_count: number
            html_url: string
          }>
        }

        const formattedSuggestions: SuggestedRepository[] = data.items.map((item) => ({
          fullName: item.full_name,
          description: item.description ?? 'Sem descrição.',
          language: item.language ?? 'Não informada',
          stars: item.stargazers_count,
          url: item.html_url,
        }))

        setSuggestedRepositories(formattedSuggestions)
      } catch {
        setSuggestionsMessage('Erro de rede ao carregar sugestões de repositórios.')
      } finally {
        setSuggestionsLoading(false)
      }
    }

    void loadSuggestedRepositories()
  }, [])

  const goToDashboard = (repository: ParsedRepo) => {
    navigate(getDashboardPath(repository))
  }

  const handleSuggestedRepositoryClick = (suggestion: SuggestedRepository) => {
    setRepositoryUrl(suggestion.url)

    const parsedSuggestion = parseGitHubRepositoryUrl(suggestion.url)
    if (!parsedSuggestion) {
      setErrorMessage('Não foi possível interpretar a URL do repositório sugerido.')
      return
    }

    setErrorMessage('')
    goToDashboard(parsedSuggestion)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!parsedRepository) {
      setErrorMessage('Informe uma URL válida de repositório público do GitHub.')
      return
    }

    setErrorMessage('')
    goToDashboard(parsedRepository)
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
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Enviar
          </button>
        </form>

        {errorMessage ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Sugestões de repositórios</h2>

          {suggestionsLoading ? <p className="mt-3 text-sm text-slate-600">Carregando sugestões...</p> : null}

          {!suggestionsLoading && suggestionsMessage ? (
            <p className="mt-3 text-sm text-slate-600">{suggestionsMessage}</p>
          ) : null}

          {!suggestionsLoading && !suggestionsMessage && suggestedRepositories.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {suggestedRepositories.map((suggestion) => {
                const LanguageIcon = getLanguageIcon(suggestion.language)

                return (
                  <li key={suggestion.url}>
                    <button
                      type="button"
                      onClick={() => {
                        handleSuggestedRepositoryClick(suggestion)
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      <p className="text-sm font-semibold text-slate-900">{suggestion.fullName}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{suggestion.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                        <span className="flex items-center gap-1">
                          <LanguageIcon size={16} aria-hidden="true" />
                          <span>{suggestion.language}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <TbStarFilled size={16} aria-hidden="true" />
                          <span>{formatNumber(suggestion.stars)}</span>
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </section>
      </section>
    </main>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const { owner: ownerParam, repo: repoParam } = useParams<{ owner: string; repo: string }>()
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [repositoryData, setRepositoryData] = useState<RepositoryData | null>(null)
  const [commitActivity, setCommitActivity] = useState<CommitActivityPoint[]>([])
  const [commitActivityMessage, setCommitActivityMessage] = useState('')

  useEffect(() => {
    const owner = ownerParam ? decodeURIComponent(ownerParam) : ''
    const repo = repoParam ? decodeURIComponent(repoParam) : ''

    if (!owner || !repo) {
      setErrorMessage('Repositório inválido para carregar o dashboard.')
      setLoading(false)
      return
    }

    const loadRepositoryData = async () => {
      setLoading(true)
      setErrorMessage('')
      setRepositoryData(null)
      setCommitActivity([])
      setCommitActivityMessage('')

      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`)

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
            `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`,
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

    void loadRepositoryData()
  }, [ownerParam, repoParam])

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <section className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <button
          type="button"
          onClick={() => {
            navigate('/')
          }}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <TbArrowLeft size={18} aria-hidden="true" />
          <span>Voltar</span>
        </button>

        <header className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard do Repositório</h1>
          <p className="mt-1 text-sm text-slate-600">Visão detalhada dos principais indicadores e atividade recente.</p>
        </header>

        {loading ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">Consultando dados do repositório...</p> : null}

        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {!loading && !errorMessage && repositoryData ? (
          <>
            <article className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-slate-900">
              <div className="rounded-lg border border-emerald-200 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Repositório encontrado
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">{repositoryData.fullName}</h2>
                <p className="mt-2 text-sm text-slate-700">{repositoryData.description}</p>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Stars</p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <TbStarFilled size={20} aria-hidden="true" className="text-slate-700" />
                    <span>{formatNumber(repositoryData.stars)}</span>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Forks</p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <TbGitFork size={20} aria-hidden="true" className="text-slate-700" />
                    <span>{formatNumber(repositoryData.forks)}</span>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Linguagem</p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    {(() => {
                      const LanguageIcon = getLanguageIcon(repositoryData.language)
                      return <LanguageIcon size={20} aria-hidden="true" className="text-slate-700" />
                    })()}
                    <span>{repositoryData.language}</span>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Health Score</p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <TbActivity size={20} aria-hidden="true" className="text-slate-700" />
                    <span>{repositoryData.healthScore}</span>
                  </p>
                </div>
              </div>
            </article>

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
                      <Tooltip
                        formatter={(value) => [`${formatNumber(Number(value))} commits`, 'Total']}
                        labelFormatter={(label) => `Semana: ${label}`}
                      />
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
          </>
        ) : null}
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard/:owner/:repo" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
