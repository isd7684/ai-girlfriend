import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Bot,
  CalendarDays,
  Clock3,
  Flame,
  Heart,
  MessageCircle,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react"

import { DashboardShell } from "../../_components/dashboard-shell"

type RoleProfile = {
  name: string
  creator: string
  verified: boolean
  imageClassName: string
  tone: string
  tags: string[]
  heat: string
  chats: string
  followers: string
}

const roleProfiles: Record<string, RoleProfile> = {
  luna: {
    name: "星野 Luna",
    creator: "官方角色",
    verified: true,
    imageClassName: "bg-[#dedede]",
    tone: "稳定、温柔、会认真接住你的情绪，也擅长把暧昧关系聊得自然一点。",
    tags: ["温柔陪伴", "恋爱聊天", "情绪价值", "慢节奏"],
    heat: "98%",
    chats: "12.8k",
    followers: "8.2k",
  },
  "lin-che": {
    name: "林澈",
    creator: "用户 @Mira 创建",
    verified: false,
    imageClassName: "bg-[#d3d3d3]",
    tone: "像认识很久的朋友，反应轻松，适合日常分享和深夜聊天。",
    tags: ["松弛感", "朋友感", "日常陪聊", "轻松玩笑"],
    heat: "94%",
    chats: "8.4k",
    followers: "5.7k",
  },
  noah: {
    name: "Noah",
    creator: "官方角色",
    verified: true,
    imageClassName: "bg-[#c7c7c7]",
    tone: "高敏感但直接，适合练习表达边界、约会邀约和关系推进。",
    tags: ["边界感", "约会建议", "直球沟通", "清醒"],
    heat: "91%",
    chats: "6.1k",
    followers: "4.6k",
  },
  xiaoman: {
    name: "小满",
    creator: "用户 @An 创建",
    verified: false,
    imageClassName: "bg-[#eeeeee]",
    tone: "元气但不吵闹，适合碎片时间聊天、分享生活和制造小惊喜。",
    tags: ["元气", "生活分享", "轻甜", "惊喜感"],
    heat: "89%",
    chats: "5.7k",
    followers: "3.9k",
  },
  lan: {
    name: "岚",
    creator: "用户 @River 创建",
    verified: false,
    imageClassName: "bg-[#d1d1d1]",
    tone: "安静、克制、有边界感，适合慢热关系和高质量长对话。",
    tags: ["慢热", "深聊", "边界", "克制"],
    heat: "87%",
    chats: "4.9k",
    followers: "3.4k",
  },
  mika: {
    name: "Mika",
    creator: "官方角色",
    verified: true,
    imageClassName: "bg-[#bfbfbf]",
    tone: "擅长制造轻松氛围，帮你把尴尬聊天转成自然互动。",
    tags: ["破冰", "幽默", "轻松", "互动"],
    heat: "96%",
    chats: "10.2k",
    followers: "7.1k",
  },
  axu: {
    name: "阿序",
    creator: "用户 @Seven 创建",
    verified: false,
    imageClassName: "bg-[#f3f3f3]",
    tone: "理性温柔，适合分析暧昧信号、回复节奏和关系走向。",
    tags: ["关系分析", "理性", "陪伴", "节奏"],
    heat: "85%",
    chats: "3.8k",
    followers: "2.8k",
  },
  xiaye: {
    name: "夏也",
    creator: "官方角色",
    verified: true,
    imageClassName: "bg-[#dbdbdb]",
    tone: "明亮、主动、会鼓励你表达好感，也能帮你把握分寸。",
    tags: ["主动", "表达", "约会", "分寸"],
    heat: "90%",
    chats: "7.3k",
    followers: "5.2k",
  },
  "shen-jibai": {
    name: "沈既白",
    creator: "用户 @Blue 创建",
    verified: false,
    imageClassName: "bg-[#b8b8b8]",
    tone: "清醒又会接话，适合暧昧拉扯、冷静复盘和关系推进前的试探。",
    tags: ["暧昧拉扯", "清醒", "试探", "复盘"],
    heat: "88%",
    chats: "5.1k",
    followers: "3.6k",
  },
  nora: {
    name: "Nora",
    creator: "官方角色",
    verified: true,
    imageClassName: "bg-[#e0e0e0]",
    tone: "直觉敏锐、回应柔和，能陪你处理心动、犹豫和不知道怎么开口的时刻。",
    tags: ["心动", "温柔回应", "开口练习", "敏锐"],
    heat: "93%",
    chats: "9.6k",
    followers: "6.5k",
  },
  yuxia: {
    name: "予夏",
    creator: "用户 @Mint 创建",
    verified: false,
    imageClassName: "bg-[#cfcfcf]",
    tone: "外向、主动、节奏明快，适合练习约会邀请、自然夸赞和轻松调情。",
    tags: ["主动邀约", "调情", "明快", "夸赞"],
    heat: "86%",
    chats: "4.4k",
    followers: "3.1k",
  },
  kai: {
    name: "Kai",
    creator: "官方角色",
    verified: true,
    imageClassName: "bg-[#f0f0f0]",
    tone: "像靠谱的年上朋友，擅长听你讲完整件事，再帮你把回应变得更成熟。",
    tags: ["成熟", "倾听", "回复建议", "靠谱"],
    heat: "95%",
    chats: "11.4k",
    followers: "7.8k",
  },
  mianmian: {
    name: "眠眠",
    creator: "用户 @Soft 创建",
    verified: false,
    imageClassName: "bg-[#c4c4c4]",
    tone: "慢声细语、低压陪伴，适合睡前聊天、情绪降噪和被认真接住。",
    tags: ["睡前", "低压", "陪伴", "降噪"],
    heat: "92%",
    chats: "8.9k",
    followers: "6.0k",
  },
  zhouye: {
    name: "周野",
    creator: "用户 @Zero 创建",
    verified: false,
    imageClassName: "bg-[#e9e9e9]",
    tone: "直接、有边界、反应快，适合练习不卑不亢地表达喜欢和拒绝。",
    tags: ["直球", "边界", "表达", "拒绝练习"],
    heat: "84%",
    chats: "3.5k",
    followers: "2.4k",
  },
}

const fallbackProfile = roleProfiles.luna as RoleProfile

const traitMeters = [
  { label: "共情", value: "86%", widthClassName: "w-[86%]" },
  { label: "主动", value: "72%", widthClassName: "w-[72%]" },
  { label: "边界感", value: "78%", widthClassName: "w-[78%]" },
  { label: "幽默感", value: "64%", widthClassName: "w-[64%]" },
]

const interactionModes = [
  {
    title: "自然开场",
    text: "把生硬的第一句话改成轻松入口，适合刚开始认识或重新开启聊天。",
    icon: MessageCircle,
  },
  {
    title: "关系复盘",
    text: "整理对方回应、自己的期待和下一步表达，降低反复猜测的消耗。",
    icon: BookOpen,
  },
  {
    title: "情绪降噪",
    text: "先接住情绪，再帮你把复杂感受拆成可以表达的短句。",
    icon: Sparkles,
  },
]

const profileFacts = [
  { label: "回应节奏", value: "中慢速", icon: SlidersHorizontal },
  { label: "关系距离", value: "亲近但有边界", icon: ShieldCheck },
  { label: "活跃时间", value: "20:00 - 01:00", icon: CalendarDays },
]

const starters = [
  "帮我把这句话改得自然一点，但不要太主动。",
  "我想继续聊下去，给我三个不尴尬的话题。",
  "对方这样回复是什么意思？帮我冷静分析一下。",
  "我想表达好感，但希望保留一点分寸。",
]

const scenes = ["深夜聊天", "关系复盘", "破冰开场", "表达练习", "情绪整理", "约会前准备"]

const samples = [
  { speaker: "role", text: "先别急着把它写得很完整，我们可以把你的真实想法压缩成一句轻一点的话。" },
  { speaker: "you", text: "我想主动一点，但又怕显得太用力。" },
  { speaker: "role", text: "那就不要直接问关系。用一个日常入口，把主动感藏在邀请里，对方会更容易接住。" },
]

type RoleDetailPageProps = {
  params: Promise<{
    roleId: string
  }>
}

export function generateStaticParams() {
  return Object.keys(roleProfiles).map((roleId) => ({ roleId }))
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const { roleId } = await params
  const profile = roleProfiles[roleId] ?? fallbackProfile
  const statItems = [
    { label: "热度", value: profile.heat, icon: Flame },
    { label: "对话", value: profile.chats, icon: MessageCircle },
    { label: "关注", value: profile.followers, icon: Users },
  ]

  return (
    <DashboardShell title={profile.name}>
      <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_32rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <section className="border-b bg-white/90 px-5 py-5 backdrop-blur lg:px-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              href="/discover"
            >
              <ArrowLeft className="size-3.5" />
              返回广场
            </Link>

            <div className="hidden items-center gap-3 text-[11px] font-medium text-slate-400 sm:flex">
              <span className="h-px w-10 bg-slate-200" />
              Role profile
            </div>
          </div>

          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className={`${profile.imageClassName} relative size-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.65),transparent_4rem)]" />
                <span className="absolute bottom-2 right-2 text-3xl font-light leading-none text-white/75">
                  {profile.name.slice(0, 1)}
                </span>
                <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full border border-white/70 bg-white/45 text-slate-500">
                  <Bot className="size-3.5" />
                </span>
                <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                  <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5">
                    <Bot className="size-3.5 text-violet-600" />
                    AI 电子伴侣
                  </span>
                  <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    在线
                  </span>
                  {profile.verified ? (
                    <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-slate-600">
                      <BadgeCheck className="size-3.5" />
                      官方角色
                    </span>
                  ) : null}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
                    {profile.name}
                  </h1>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="size-3.5" />
                    刚刚在线
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5" />
                    AI Social Companion
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {profile.tone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white xl:min-w-96">
              {statItems.map((item, index) => {
                const Icon = item.icon

                return (
                  <div className={index === 2 ? "px-3 py-2.5" : "border-r border-slate-200 px-3 py-2.5"} key={item.label}>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <Icon className="size-3.5 text-slate-500" />
                      {item.label}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{item.value}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
            <div className="flex flex-col gap-3 rounded-xl bg-white px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                  <ShieldCheck className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile note</p>
                    <span className="text-xs font-medium text-muted-foreground">适配当前聊天目标</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-700">
                    适合需要稳定陪伴、自然开场和关系节奏判断的聊天场景。
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-medium text-rose-700">
                  <Heart className="size-3.5" />
                  匹配度 92%
                </span>
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-700">
                  <MessageCircle className="size-3.5" />
                  轻松聊
                </span>
                {profile.tags.slice(0, 2).map((tag) => (
                  <span
                    className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-5 lg:px-8">
          <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5">
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3">
                <div className={`${profile.imageClassName} relative min-h-[520px] overflow-hidden rounded-2xl`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.58),transparent_18rem),linear-gradient(180deg,transparent_55%,rgba(255,255,255,0.48)_100%)]" />
                  <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/70 bg-white/45 px-3 py-1 text-[11px] font-medium text-slate-600">
                        角色形象
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                        在线
                      </span>
                    </div>
                    <button
                      aria-label="收藏角色"
                      className="flex size-9 items-center justify-center rounded-full border border-white/70 bg-white/45 text-slate-600 transition-colors hover:bg-white/65"
                      type="button"
                    >
                      <Heart className="size-4" />
                    </button>
                  </div>

                  <div className="absolute inset-x-6 bottom-6">
                    <div className="flex items-end justify-between gap-4 border-t border-white/70 pt-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Visual preview</p>
                        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">
                          接入真实图片后，这里展示角色形象的完整视觉。
                        </p>
                      </div>
                      <span className="shrink-0 text-6xl font-light leading-none text-white/80">
                        {profile.name.slice(0, 1)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-start gap-3 bg-slate-50/70 px-4 py-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                    <Send className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">准备开始一段对话</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      系统会沿用角色语气、边界和当前互动模式。
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-200 px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                      type="button"
                    >
                      <MessageCircle className="size-4" />
                      开始聊天
                    </button>
                    <button
                      className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      type="button"
                    >
                      查看设定
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <Activity className="size-4 text-violet-600" />
                    互动模式
                  </p>
                  <span className="text-[11px] font-medium text-muted-foreground">3 modes</span>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)_16rem]">
                    <div className="divide-y divide-slate-200 bg-slate-50/70">
                      {interactionModes.map((mode, index) => {
                        const Icon = mode.icon

                        return (
                          <div
                            className={
                              index === 0
                                ? "flex items-center gap-3 bg-white px-3 py-3"
                                : "flex items-center gap-3 px-3 py-3"
                            }
                            key={mode.title}
                          >
                            <span
                              className={
                                index === 0
                                  ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white"
                                  : "flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500"
                              }
                            >
                              <Icon className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-950">{mode.title}</p>
                              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                                Mode 0{index + 1}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                            Active mode
                          </p>
                          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">自然开场</h3>
                        </div>
                        <span className="inline-flex h-7 items-center rounded-full border border-violet-200 bg-violet-50 px-3 text-xs font-medium text-violet-700">
                          推荐
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        把生硬的第一句话改成轻松入口，适合刚开始认识或重新开启聊天。
                      </p>

                      <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
                        {["轻量主动", "保留分寸", "降低尴尬"].map((item, index) => (
                          <div
                            className={index === 2 ? "px-3 py-2.5" : "border-r border-slate-200 px-3 py-2.5"}
                            key={item}
                          >
                            <p className="text-[10px] font-medium text-muted-foreground">Focus</p>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-700">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50/70 p-4 lg:border-l lg:border-t-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reply flow</p>
                      <div className="mt-4 space-y-3">
                        {["接住情绪", "提炼意图", "生成可发送表达"].map((step, index) => (
                          <div className="flex items-start gap-3" key={step}>
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-slate-600">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{step}</p>
                              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                {index === 0
                                  ? "先确认你的真实感受"
                                  : index === 1
                                    ? "判断主动程度和关系距离"
                                    : "输出自然、低压力的版本"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 bg-white px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-medium text-muted-foreground">输出形态</span>
                      <div className="flex flex-wrap gap-2">
                        {["一句话开场", "三种语气", "风险提醒"].map((item) => (
                          <span
                            className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600"
                            key={item}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <SlidersHorizontal className="size-4 text-blue-600" />
                      性格参数
                    </p>
                    <span className="text-[11px] font-medium text-muted-foreground">可调整</span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    {traitMeters.map((trait) => (
                      <div key={trait.label}>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-600">{trait.label}</span>
                          <span className="text-muted-foreground">{trait.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className={`${trait.widthClassName} h-full rounded-full bg-slate-950`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white">
                  <div className="grid divide-y divide-slate-200">
                    {profileFacts.map((item) => {
                      const Icon = item.icon

                      return (
                        <div className="flex items-center gap-3 px-4 py-3.5" key={item.label}>
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-slate-950">{item.value}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  适合场景
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {scenes.map((scene) => (
                    <span
                      className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600"
                      key={scene}
                    >
                      {scene}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,0.72fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Sparkles className="size-4 text-violet-600" />
                  快捷开场
                </p>
                <span className="text-[11px] font-medium text-muted-foreground">Prompt presets</span>
              </div>

              <div className="space-y-3">
                {starters.map((starter) => (
                  <div className="flex items-start gap-3" key={starter}>
                    <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700">
                      <Bot className="size-4" />
                    </span>
                    <button
                      className="group max-w-[86%] text-left"
                      type="button"
                    >
                      <span className="block rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 transition-colors group-hover:bg-white">
                        {starter}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-4 text-sm font-semibold text-slate-950">
                <MessageCircle className="size-4 text-blue-600" />
                对话预览
              </div>

              <div className="space-y-4">
                {samples.map((sample) => {
                  const isUser = sample.speaker === "you"

                  return (
                    <div
                      className={isUser ? "flex items-start justify-end gap-3" : "flex items-start justify-start gap-3"}
                      key={sample.text}
                    >
                      {!isUser ? (
                        <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700">
                          <Bot className="size-4" />
                        </span>
                      ) : null}

                      <div
                        className={
                          isUser
                            ? "max-w-[78%] rounded-2xl rounded-tr-md border border-slate-900 bg-slate-950 px-4 py-3 text-sm leading-6 text-white"
                            : "max-w-[78%] rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                        }
                      >
                        {sample.text}
                      </div>

                      {isUser ? (
                        <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-900 bg-slate-950 text-white">
                          <UserRound className="size-4" />
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
