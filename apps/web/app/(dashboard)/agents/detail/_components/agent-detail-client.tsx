"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import type {
  AgentCareFrequency,
  AgentCarePlan,
  AgentCareScene,
  AgentCareTone,
  MyAgentCompanionDetailResponse,
  UpsertAgentCarePlanRequest,
  UpdateMyAgentCompanionRequest,
} from "@repo/contracts"
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  BookOpenText,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  Mic2,
  Moon,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  Wand2,
  type LucideIcon,
} from "lucide-react"

import { DashboardShell } from "../../../_components/dashboard-shell"
import {
  generateAgentCareEvent,
  getAgentCareEvents,
  getAgentCarePlan,
  getMyAgentCompanionDetail,
  updateAgentCarePlan,
  updateMyAgentCompanion,
  uploadMyAgentCompanionImage,
} from "@/auth/api"
import { AgentAvatar } from "@/components/agent-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const promptSections = [
  { key: "description", label: "角色说明", icon: Sparkles },
  { key: "storyBackground", label: "人物故事背景", icon: BookOpenText },
  { key: "personalityPrompt", label: "性格与互动方式", icon: Bot },
  { key: "tonePrompt", label: "语气风格", icon: Mic2 },
  { key: "guardrailsPrompt", label: "边界规则", icon: ShieldCheck },
] as const

const completionChecks = [
  { label: "基础信息", field: "name" },
  { label: "一句话设定", field: "headline" },
  { label: "人物故事背景", field: "storyBackground" },
  { label: "默认开场", field: "openingMessage" },
] as const

const careSceneOptions: Array<{
  value: AgentCareScene
  label: string
  description: string
  icon: LucideIcon
}> = [
  { value: "morning", label: "早安", description: "开始一天时轻轻问候", icon: Sun },
  { value: "night", label: "晚安", description: "睡前陪伴和情绪收束", icon: Moon },
  { value: "long_absence", label: "久未聊天", description: "一段时间没互动时出现", icon: Bell },
  { value: "stress_support", label: "压力陪伴", description: "用户可能忙碌或疲惫时关心", icon: Heart },
  { value: "relationship_warmup", label: "关系升温", description: "让互动自然变得更亲近", icon: Sparkles },
  { value: "anniversary", label: "纪念日", description: "特殊节点的轻量提醒", icon: CalendarDays },
]

const careFrequencyLabels: Record<AgentCareFrequency, string> = {
  daily: "每天",
  weekly: "每周",
  custom: "自定义",
}

const careToneLabels: Record<AgentCareTone, string> = {
  light: "轻一点",
  gentle: "温柔一点",
  intimate: "亲密一点",
}

const defaultCareForm: UpsertAgentCarePlanRequest = {
  enabled: false,
  frequency: "daily",
  preferredTime: "21:30",
  scenes: ["long_absence", "night"],
  tone: "gentle",
  customPrompt: "",
}

const agentImageMaxBytes = 2 * 1024 * 1024
const agentImageMinWidth = 720
const agentImageMinHeight = 1080
const agentImageAspectRatio = 2 / 3
const agentImageAspectRatioTolerance = 0.045
const supportedAgentImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])

type BrowserImageDimensions = {
  width: number
  height: number
}

function normalizeAgentDetail(detail: MyAgentCompanionDetailResponse): UpdateMyAgentCompanionRequest {
  return {
    name: detail.name,
    headline: detail.headline ?? "",
    description: detail.description ?? "",
    storyBackground: detail.storyBackground ?? "",
    personalityPrompt: detail.personalityPrompt ?? "",
    tonePrompt: detail.tonePrompt ?? "",
    guardrailsPrompt: detail.guardrailsPrompt ?? "",
    openingMessage: detail.openingMessage ?? "",
    imageKey: detail.imageKey,
    visibility: detail.visibility ?? "private",
    status: detail.status === "published" ? "published" : "draft",
  }
}

function normalizeCarePlan(plan: AgentCarePlan): UpsertAgentCarePlanRequest {
  return {
    enabled: plan.enabled,
    frequency: plan.frequency,
    preferredTime: plan.preferredTime ?? "21:30",
    scenes: plan.scenes,
    tone: plan.tone,
    customPrompt: plan.customPrompt ?? "",
  }
}

function buildPreviewPrompt(form: UpdateMyAgentCompanionRequest) {
  return [
    `你现在扮演 AI 电子伴侣「${form.name || "未命名角色"}」。`,
    "",
    "## 一句话设定",
    form.headline,
    "",
    "## 角色说明",
    form.description,
    "",
    "## 人物故事背景",
    form.storyBackground,
    "",
    "## 性格与互动方式",
    form.personalityPrompt,
    "",
    "## 语气风格",
    form.tonePrompt,
    "",
    "## 边界与安全规则",
    form.guardrailsPrompt,
    "",
    "## 默认开场",
    form.openingMessage,
  ].join("\n")
}

function readBrowserImageDimensions(file: File): Promise<BrowserImageDimensions> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(imageUrl)
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      reject(new Error("无法读取图片尺寸，请重新选择 JPG、PNG 或 WebP 图片。"))
    }

    image.src = imageUrl
  })
}

function getAgentImageBasicValidationMessage(file: File) {
  if (!supportedAgentImageTypes.has(file.type)) {
    return "头像图片仅支持 JPG、PNG 或 WebP。"
  }

  if (file.size <= 0) {
    return "图片文件为空，请重新选择。"
  }

  if (file.size > agentImageMaxBytes) {
    return "图片不能超过 2MB，请压缩后重新上传。"
  }

  return null
}

function getAgentImageDimensionValidationMessage(dimensions: BrowserImageDimensions) {
  if (dimensions.width < agentImageMinWidth || dimensions.height < agentImageMinHeight) {
    return `图片清晰度不足，至少需要 ${agentImageMinWidth} x ${agentImageMinHeight}px，当前为 ${dimensions.width} x ${dimensions.height}px。`
  }

  const currentRatio = dimensions.width / dimensions.height

  if (Math.abs(currentRatio - agentImageAspectRatio) > agentImageAspectRatioTolerance) {
    return `请上传接近 2:3 的竖版图片，当前尺寸为 ${dimensions.width} x ${dimensions.height}px。`
  }

  return null
}

function formatDateTime(value: number | null) {
  if (!value) {
    return "暂无"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function AgentDetailClient() {
  const searchParams = useSearchParams()
  const agentId = searchParams.get("agentId")?.trim() ?? ""
  const agentQuery = useQuery({
    queryKey: ["my-agent-detail", agentId],
    queryFn: () => getMyAgentCompanionDetail(agentId),
    enabled: Boolean(agentId),
  })
  const carePlanQuery = useQuery({
    queryKey: ["agent-care-plan", agentId],
    queryFn: () => getAgentCarePlan(agentId),
    enabled: Boolean(agentId),
  })
  const careEventsQuery = useQuery({
    queryKey: ["agent-care-events", agentId],
    queryFn: () => getAgentCareEvents(agentId),
    enabled: Boolean(agentId),
  })
  const [form, setForm] = useState<UpdateMyAgentCompanionRequest | null>(null)
  const [careForm, setCareForm] = useState<UpsertAgentCarePlanRequest>(defaultCareForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingCarePlan, setIsSavingCarePlan] = useState(false)
  const [isGeneratingCareEvent, setIsGeneratingCareEvent] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [careErrorMessage, setCareErrorMessage] = useState("")
  const [careSuccessMessage, setCareSuccessMessage] = useState("")
  const [detailSnapshot, setDetailSnapshot] = useState<MyAgentCompanionDetailResponse | null>(null)
  const [carePlanSnapshot, setCarePlanSnapshot] = useState<AgentCarePlan | null>(null)
  const previewPrompt = useMemo(() => (form ? buildPreviewPrompt(form) : ""), [form])
  const completedCount = form
    ? completionChecks.filter((item) => String(form[item.field]).trim()).length
    : 0

  useEffect(() => {
    if (!agentQuery.data) {
      return
    }

    setForm(normalizeAgentDetail(agentQuery.data))
    setDetailSnapshot(agentQuery.data)
    setErrorMessage("")
  }, [agentQuery.data])

  useEffect(() => {
    if (!carePlanQuery.data?.plan) {
      return
    }

    setCareForm(normalizeCarePlan(carePlanQuery.data.plan))
    setCarePlanSnapshot(carePlanQuery.data.plan)
    setCareErrorMessage("")
  }, [carePlanQuery.data])

  useEffect(() => {
    if (!carePlanQuery.isError) {
      return
    }

    setCareErrorMessage("主动关怀计划加载失败，请确认 API 已部署并完成最新 D1 迁移。")
  }, [carePlanQuery.isError])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  function updateField<K extends keyof UpdateMyAgentCompanionRequest>(
    key: K,
    value: UpdateMyAgentCompanionRequest[K],
  ) {
    setForm((current) => (current ? { ...current, [key]: value } : current))
    setErrorMessage("")
    setSuccessMessage("")
  }

  function updateCareField<K extends keyof UpsertAgentCarePlanRequest>(
    key: K,
    value: UpsertAgentCarePlanRequest[K],
  ) {
    setCareForm((current) => ({ ...current, [key]: value }))
    setCareErrorMessage("")
    setCareSuccessMessage("")
  }

  function toggleCareScene(scene: AgentCareScene) {
    setCareForm((current) => {
      const exists = current.scenes.includes(scene)
      const scenes = exists
        ? current.scenes.filter((item) => item !== scene)
        : [...current.scenes, scene]

      return {
        ...current,
        scenes: scenes.length > 0 ? scenes : [scene],
      }
    })
    setCareErrorMessage("")
    setCareSuccessMessage("")
  }

  async function handleImageChange(file: File | null) {
    if (!file) {
      return
    }

    setIsUploadingImage(true)
    setErrorMessage("")
    setSuccessMessage("")
    let nextPreviewUrl = ""

    try {
      const basicValidationMessage = getAgentImageBasicValidationMessage(file)

      if (basicValidationMessage) {
        setErrorMessage(basicValidationMessage)
        return
      }

      const dimensions = await readBrowserImageDimensions(file)
      const validationMessage = getAgentImageDimensionValidationMessage(dimensions)

      if (validationMessage) {
        setErrorMessage(validationMessage)
        return
      }

      nextPreviewUrl = URL.createObjectURL(file)
      const uploaded = await uploadMyAgentCompanionImage(file)
      updateField("imageKey", uploaded.key)
      setImagePreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current)
        }

        return nextPreviewUrl
      })
      setSuccessMessage("头像已上传，保存后会更新到 Agent 资料。")
    } catch (error) {
      if (nextPreviewUrl) {
        URL.revokeObjectURL(nextPreviewUrl)
      }

      setErrorMessage(error instanceof Error ? error.message : "上传头像失败，请重新选择图片。")
    } finally {
      setIsUploadingImage(false)
    }
  }

  async function handleSave() {
    if (!form || !agentId) {
      return
    }

    const requiredFields = [
      form.name,
      form.headline,
      form.description,
      form.storyBackground,
      form.personalityPrompt,
      form.tonePrompt,
      form.guardrailsPrompt,
      form.openingMessage,
    ]

    if (requiredFields.some((value) => !value.trim())) {
      setErrorMessage("请先补齐角色名称、人设、故事背景、语气、边界和默认开场。")
      setSuccessMessage("")
      return
    }

    setIsSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const updatedAgent = await updateMyAgentCompanion(agentId, form)
      setForm(normalizeAgentDetail(updatedAgent))
      setDetailSnapshot(updatedAgent)
      setSuccessMessage("Agent 资料已保存。")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存 Agent 失败，请稍后重试。")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveCarePlan() {
    if (!agentId) {
      return
    }

    if (careForm.scenes.length === 0) {
      setCareErrorMessage("请至少选择一个主动关怀场景。")
      setCareSuccessMessage("")
      return
    }

    setIsSavingCarePlan(true)
    setCareErrorMessage("")
    setCareSuccessMessage("")

    try {
      const response = await updateAgentCarePlan(agentId, careForm)
      setCareForm(normalizeCarePlan(response.plan))
      setCarePlanSnapshot(response.plan)
      setCareSuccessMessage("主动关怀计划已保存。")
      void carePlanQuery.refetch()
    } catch (error) {
      setCareErrorMessage(error instanceof Error ? error.message : "保存主动关怀失败，请稍后重试。")
    } finally {
      setIsSavingCarePlan(false)
    }
  }

  async function handleGenerateCareEvent(scene?: AgentCareScene) {
    if (!agentId) {
      return
    }

    setIsGeneratingCareEvent(true)
    setCareErrorMessage("")
    setCareSuccessMessage("")

    try {
      const response = await generateAgentCareEvent(agentId, scene ? { scene } : {})
      setCareSuccessMessage(`已生成一条主动关怀：${response.event.message}`)
      void careEventsQuery.refetch()
    } catch (error) {
      setCareErrorMessage(error instanceof Error ? error.message : "生成主动关怀失败，请稍后重试。")
    } finally {
      setIsGeneratingCareEvent(false)
    }
  }

  if (!agentId) {
    return (
      <DashboardShell title="Agent 详情">
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50/70 px-5">
          <div className="w-full max-w-md border-y border-slate-200 bg-white px-5 py-6 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Sparkles className="size-5" />
            </div>
            <h1 className="mt-4 text-base font-semibold text-slate-950">缺少 Agent ID</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              请从首页聊天列表或我的伴侣页面进入 Agent 详情。
            </p>
            <Button asChild className="mt-5 rounded-full" variant="outline">
              <Link href="/">
                <ArrowLeft className="size-4" />
                返回聊天
              </Link>
            </Button>
          </div>
        </main>
      </DashboardShell>
    )
  }

  if (agentQuery.isError) {
    return (
      <DashboardShell title="Agent 详情">
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50/70 px-5">
          <div className="w-full max-w-md border-y border-slate-200 bg-white px-5 py-6 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Sparkles className="size-5" />
            </div>
            <h1 className="mt-4 text-base font-semibold text-slate-950">Agent 详情加载失败</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              请确认这个 Agent 属于当前账号，并且 API 已完成最新部署。
            </p>
            <Button asChild className="mt-5 rounded-full" variant="outline">
              <Link href="/">
                <ArrowLeft className="size-4" />
                返回聊天
              </Link>
            </Button>
          </div>
        </main>
      </DashboardShell>
    )
  }

  if (agentQuery.isLoading || !form) {
    return (
      <DashboardShell title="Agent 详情">
        <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70 px-5 py-5 lg:px-8">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
            <div className="h-[36rem] animate-pulse rounded-2xl bg-white" />
            <div className="h-80 animate-pulse rounded-2xl bg-white" />
          </div>
        </main>
      </DashboardShell>
    )
  }

  const detail = detailSnapshot ?? agentQuery.data
  const carePlan = carePlanSnapshot ?? carePlanQuery.data?.plan ?? null
  const careEvents = careEventsQuery.data?.items ?? []

  return (
    <DashboardShell title="Agent 详情">
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <section className="bg-white px-5 pt-5 lg:px-8">
          <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                  <span>Agent Profile</span>
                  <span className="h-px w-8 bg-slate-200" />
                  <span>{agentId.slice(0, 8)}</span>
                </div>
                <h1 className="mt-2 truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {form.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  查看并维护这个 Agent 的基础资料、角色提示词、默认开场和头像形象。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild className="rounded-full" variant="outline">
                  <Link href="/">
                    <ArrowLeft className="size-4" />
                    返回聊天
                  </Link>
                </Button>
                <Button
                  className="rounded-full"
                  disabled={isSaving || isUploadingImage}
                  onClick={handleSave}
                  type="button"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  保存修改
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 px-5 py-5 lg:px-8 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="grid gap-5">
            <section className="grid gap-1 overflow-hidden rounded-2xl md:grid-cols-[minmax(17rem,24rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)]">
              <article className="relative flex aspect-[2/3] min-h-0 flex-col overflow-hidden bg-[#d6d8dc] p-4">
                {imagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={form.name}
                    className="absolute inset-0 size-full object-cover"
                    src={imagePreviewUrl}
                  />
                ) : (
                  <AgentAvatar
                    className="absolute inset-0 size-full rounded-none border-0 bg-[#d6d8dc]"
                    fallbackClassName="bg-[#d6d8dc] text-4xl text-slate-500"
                    imageKey={form.imageKey}
                    name={form.name}
                  />
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.62),transparent_17rem),linear-gradient(180deg,transparent_46%,rgba(255,255,255,0.52)_100%)]" />

                <div className="relative flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/70 bg-white/55 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    角色头像
                  </span>
                  <span className="rounded-full border border-white/70 bg-white/55 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    {form.imageKey ? "已设置" : "未设置"}
                  </span>
                </div>

                <label className="relative m-auto flex size-32 cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-white/70 bg-white/35 text-slate-600 transition-colors hover:bg-white/55">
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isUploadingImage}
                    onChange={(event) => {
                      void handleImageChange(event.currentTarget.files?.[0] ?? null)
                      event.currentTarget.value = ""
                    }}
                    type="file"
                  />
                  {isUploadingImage ? (
                    <Loader2 className="size-10 animate-spin" />
                  ) : (
                    <ImagePlus className="size-10" />
                  )}
                  <span className="mt-2 text-[11px] font-medium">
                    {isUploadingImage ? "上传中" : "上传头像"}
                  </span>
                </label>

                <div className="relative border-t border-white/70 pt-4">
                  <p className="truncate text-lg font-semibold tracking-tight text-slate-900">{form.name}</p>
                  <p className="mt-1 line-clamp-2 max-w-lg text-sm leading-6 text-slate-600">
                    {form.headline}
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-slate-500">
                    2:3 竖版，至少 720 x 1080px，最大 2MB
                  </p>
                </div>
              </article>

              <div className="grid auto-rows-[82px] grid-flow-dense grid-cols-1 gap-1 md:grid-cols-2">
                <article className="row-span-3 flex min-h-0 flex-col bg-white p-4 md:col-span-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Bot className="size-4 text-slate-500" />
                      基础信息
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">Profile</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      aria-label="角色名称"
                      onChange={(event) => updateField("name", event.currentTarget.value)}
                      placeholder="角色名称"
                      value={form.name}
                    />
                    <Input
                      aria-label="一句话设定"
                      onChange={(event) => updateField("headline", event.currentTarget.value)}
                      placeholder="一句话设定"
                      value={form.headline}
                    />
                  </div>
                </article>

                {promptSections.map((section) => {
                  const Icon = section.icon

                  return (
                    <article
                      className="row-span-4 flex min-h-0 flex-col bg-white p-4 md:col-span-2"
                      key={section.key}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Icon className="size-4 text-slate-500" />
                          {section.label}
                        </p>
                        <span className="text-[11px] font-medium text-slate-500">Prompt</span>
                      </div>
                      <Textarea
                        aria-label={section.label}
                        className="min-h-0 flex-1 resize-none rounded-xl bg-slate-50/70 text-sm leading-6"
                        onChange={(event) => updateField(section.key, event.currentTarget.value)}
                        value={form[section.key]}
                      />
                    </article>
                  )
                })}

                <article className="row-span-3 flex min-h-0 flex-col bg-white p-4 md:col-span-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <MessageCircle className="size-4 text-slate-500" />
                      默认开场
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">Opening</span>
                  </div>
                  <Textarea
                    aria-label="默认开场"
                    className="min-h-0 flex-1 resize-none rounded-xl bg-slate-50/70 text-sm leading-6"
                    onChange={(event) => updateField("openingMessage", event.currentTarget.value)}
                    value={form.openingMessage}
                  />
                </article>
              </div>
            </section>
          </div>

          <aside className="grid content-start gap-5">
            <section className="rounded-2xl bg-white p-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                {imagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`${form.name} avatar`}
                    className="size-14 shrink-0 rounded-2xl border border-slate-200 object-cover"
                    src={imagePreviewUrl}
                  />
                ) : (
                  <AgentAvatar
                    className="size-14 rounded-2xl"
                    imageKey={form.imageKey}
                    name={form.name}
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{form.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{form.headline}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 border-y border-slate-200 py-3">
                {[
                  { label: "完成度", value: `${completedCount}/4`, icon: CheckCircle2 },
                  { label: "创建", value: formatDateTime(detail?.createdAtMs ?? null), icon: Clock3 },
                  { label: "更新", value: formatDateTime(detail?.updatedAtMs ?? null), icon: BadgeCheck },
                ].map((item, index) => {
                  const Icon = item.icon

                  return (
                    <div
                      className={cn("min-w-0", index === 0 ? "pr-3" : "border-l border-slate-200 px-3")}
                      key={item.label}
                    >
                      <Icon className="mb-2 size-3.5 text-slate-400" />
                      <p className="text-[10px] font-medium text-slate-400">{item.label}</p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-700">{item.value}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">状态</span>
                  <Select
                    onValueChange={(value) => updateField("status", value as UpdateMyAgentCompanionRequest["status"])}
                    value={form.status}
                  >
                    <SelectTrigger className="h-9 w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="shadow-none">
                      <SelectItem value="draft">保存草稿</SelectItem>
                      <SelectItem value="published">可聊天</SelectItem>
                    </SelectContent>
                  </Select>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">可见性</span>
                  <Select
                    onValueChange={(value) => updateField("visibility", value as UpdateMyAgentCompanionRequest["visibility"])}
                    value={form.visibility}
                  >
                    <SelectTrigger className="h-9 w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="shadow-none">
                      <SelectItem value="private">仅自己可见</SelectItem>
                      <SelectItem value="public">允许后续发布到广场</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>

              {errorMessage ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {errorMessage}
                </p>
              ) : null}
              {successMessage ? (
                <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {successMessage}
                </p>
              ) : null}

              <Button
                className="mt-4 h-9 w-full rounded-full"
                disabled={isSaving || isUploadingImage}
                onClick={handleSave}
                type="button"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    保存中
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    保存 Agent
                  </>
                )}
              </Button>
            </section>

            <section className="rounded-2xl bg-white p-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Bell className="size-4 text-slate-500" />
                    主动关怀
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    让 Agent 在合适的场景里主动出现，先生成站内聊天消息。
                  </p>
                </div>
                <button
                  aria-label="切换主动关怀"
                  className={cn(
                    "relative h-6 w-11 rounded-full border transition-colors",
                    careForm.enabled ? "border-slate-900 bg-slate-900" : "border-slate-200 bg-slate-100",
                  )}
                  onClick={() => updateCareField("enabled", !careForm.enabled)}
                  type="button"
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
                      careForm.enabled ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-slate-500">频率</span>
                    <Select
                      onValueChange={(value) => updateCareField("frequency", value as AgentCareFrequency)}
                      value={careForm.frequency}
                    >
                      <SelectTrigger className="h-9 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="shadow-none">
                        <SelectItem value="daily">每天</SelectItem>
                        <SelectItem value="weekly">每周</SelectItem>
                        <SelectItem value="custom">自定义</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-slate-500">时间</span>
                    <Input
                      className="h-9 rounded-xl"
                      onChange={(event) => updateCareField("preferredTime", event.currentTarget.value)}
                      placeholder="21:30"
                      value={careForm.preferredTime ?? ""}
                    />
                  </label>
                </div>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">语气强度</span>
                  <Select
                    onValueChange={(value) => updateCareField("tone", value as AgentCareTone)}
                    value={careForm.tone}
                  >
                    <SelectTrigger className="h-9 w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="shadow-none">
                      <SelectItem value="light">轻一点</SelectItem>
                      <SelectItem value="gentle">温柔一点</SelectItem>
                      <SelectItem value="intimate">亲密一点</SelectItem>
                    </SelectContent>
                  </Select>
                </label>

                <div className="grid gap-2">
                  <span className="text-xs font-medium text-slate-500">关怀场景</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {careSceneOptions.map((scene) => {
                      const Icon = scene.icon
                      const selected = careForm.scenes.includes(scene.value)

                      return (
                        <button
                          className={cn(
                            "min-h-16 border px-2.5 py-2 text-left transition-colors",
                            selected
                              ? "border-slate-900 bg-slate-950 text-white"
                              : "border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-white",
                          )}
                          key={scene.value}
                          onClick={() => toggleCareScene(scene.value)}
                          type="button"
                        >
                          <span className="flex items-center gap-1.5 text-xs font-semibold">
                            <Icon className="size-3.5" />
                            {scene.label}
                          </span>
                          <span className={cn("mt-1 line-clamp-2 block text-[11px] leading-4", selected ? "text-white/70" : "text-slate-400")}>
                            {scene.description}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-500">自定义关怀提示</span>
                  <Textarea
                    className="min-h-20 resize-none rounded-xl bg-slate-50/70 text-sm leading-6"
                    onChange={(event) => updateCareField("customPrompt", event.currentTarget.value)}
                    placeholder="例如：最近辛苦了，记得先照顾好自己。"
                    value={careForm.customPrompt ?? ""}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2 border-y border-slate-200 py-3">
                  <div>
                    <p className="text-[10px] font-medium text-slate-400">当前状态</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {careForm.enabled ? "已开启" : "未开启"} · {careFrequencyLabels[careForm.frequency]}
                    </p>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <p className="text-[10px] font-medium text-slate-400">下次计划</p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {formatDateTime(carePlan?.nextRunAtMs ?? null)}
                    </p>
                  </div>
                </div>

                {careErrorMessage ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {careErrorMessage}
                  </p>
                ) : null}
                {careSuccessMessage ? (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-700">
                    {careSuccessMessage}
                  </p>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="h-9 rounded-full"
                    disabled={isSavingCarePlan}
                    onClick={handleSaveCarePlan}
                    type="button"
                    variant="outline"
                  >
                    {isSavingCarePlan ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    保存
                  </Button>
                  <Button
                    className="h-9 rounded-full"
                    disabled={isGeneratingCareEvent}
                    onClick={() => {
                      void handleGenerateCareEvent(careForm.scenes[0])
                    }}
                    type="button"
                  >
                    {isGeneratingCareEvent ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
                    生成
                  </Button>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-700">最近关怀</p>
                  <span className="text-[11px] font-medium text-slate-400">
                    {careToneLabels[careForm.tone]}
                  </span>
                </div>
                {careEventsQuery.isLoading ? (
                  <div className="h-16 animate-pulse rounded-xl bg-slate-50" />
                ) : careEvents.length === 0 ? (
                  <p className="rounded-xl bg-slate-50/80 px-3 py-3 text-xs leading-5 text-slate-500">
                    暂无主动关怀记录。可以先点击生成，预览它进入聊天历史后的效果。
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {careEvents.slice(0, 3).map((event) => (
                      <div className="border-l border-slate-200 bg-slate-50/70 px-3 py-2" key={event.id}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-medium text-slate-400">
                            {careSceneOptions.find((scene) => scene.value === event.scene)?.label ?? event.scene}
                          </span>
                          <span className="text-[11px] text-slate-400">{formatDateTime(event.generatedAtMs)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{event.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Wand2 className="size-4 text-slate-500" />
                  默认提示词
                </p>
                <span className="text-[11px] font-medium text-slate-400">Generated</span>
              </div>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50/80 p-3 text-xs leading-5 text-slate-600">
                {previewPrompt}
              </pre>
            </section>
          </aside>
        </section>
      </main>
    </DashboardShell>
  )
}
