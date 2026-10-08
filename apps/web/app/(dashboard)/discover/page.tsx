import Link from "next/link"
import {
  BadgeCheck,
  Bot,
  CirclePlus,
  Compass,
  Flame,
  Heart,
  Search,
  Users,
} from "lucide-react"
import { DashboardShell } from "../_components/dashboard-shell"

const featuredRoles = [
  {
    id: "luna",
    name: "星野 Luna",
    creator: "官方角色",
    description: "温柔、稳定、擅长陪你复盘情绪和延续暧昧聊天。",
    tags: ["温柔陪伴", "恋爱聊天", "情绪价值"],
    heat: "98%",
    chats: "12.8k",
    verified: true,
    tileClassName: "bg-[#e7e7e7]",
    spanClassName: "row-span-5 sm:col-span-2 xl:col-span-2",
  },
  {
    id: "lin-che",
    name: "林澈",
    creator: "用户 @Mira 创建",
    description: "像认识很久的朋友，擅长轻松玩笑、日常分享和深夜聊天。",
    tags: ["松弛感", "朋友感", "日常陪聊"],
    heat: "94%",
    chats: "8.4k",
    verified: false,
    tileClassName: "bg-[#d8d8d8]",
    spanClassName: "row-span-4",
  },
  {
    id: "noah",
    name: "Noah",
    creator: "官方角色",
    description: "高敏感但直接，适合练习表达边界、约会邀约和关系推进。",
    tags: ["边界感", "约会建议", "直球沟通"],
    heat: "91%",
    chats: "6.1k",
    verified: true,
    tileClassName: "bg-[#c9c9c9]",
    spanClassName: "row-span-6",
  },
  {
    id: "xiaoman",
    name: "小满",
    creator: "用户 @An 创建",
    description: "元气但不吵闹，适合碎片时间聊天、分享生活和制造小惊喜。",
    tags: ["元气", "生活分享", "轻甜"],
    heat: "89%",
    chats: "5.7k",
    verified: false,
    tileClassName: "bg-[#eeeeee]",
    spanClassName: "row-span-5",
  },
  {
    id: "lan",
    name: "岚",
    creator: "用户 @River 创建",
    description: "安静、克制、有边界感，适合慢热关系和高质量长对话。",
    tags: ["慢热", "深聊", "边界"],
    heat: "87%",
    chats: "4.9k",
    verified: false,
    tileClassName: "bg-[#d1d1d1]",
    spanClassName: "row-span-4",
  },
  {
    id: "mika",
    name: "Mika",
    creator: "官方角色",
    description: "擅长制造轻松氛围，帮你把尴尬聊天转成自然互动。",
    tags: ["破冰", "幽默", "轻松"],
    heat: "96%",
    chats: "10.2k",
    verified: true,
    tileClassName: "bg-[#bebebe]",
    spanClassName: "row-span-5",
  },
  {
    id: "axu",
    name: "阿序",
    creator: "用户 @Seven 创建",
    description: "理性温柔，适合分析暧昧信号、回复节奏和关系走向。",
    tags: ["关系分析", "理性", "陪伴"],
    heat: "85%",
    chats: "3.8k",
    verified: false,
    tileClassName: "bg-[#f3f3f3]",
    spanClassName: "row-span-4",
  },
  {
    id: "xiaye",
    name: "夏也",
    creator: "官方角色",
    description: "明亮、主动、会鼓励你表达好感，也能帮你把握分寸。",
    tags: ["主动", "表达", "约会"],
    heat: "90%",
    chats: "7.3k",
    verified: true,
    tileClassName: "bg-[#dbdbdb]",
    spanClassName: "row-span-5",
  },
  {
    id: "shen-jibai",
    name: "沈既白",
    creator: "用户 @Blue 创建",
    description: "清醒又会接话，适合暧昧拉扯、冷静复盘和关系推进前的试探。",
    tags: ["暧昧拉扯", "清醒", "试探"],
    heat: "88%",
    chats: "5.1k",
    verified: false,
    tileClassName: "bg-[#b8b8b8]",
    spanClassName: "row-span-5 sm:col-span-2 xl:col-span-1",
  },
  {
    id: "nora",
    name: "Nora",
    creator: "官方角色",
    description: "直觉敏锐、回应柔和，能陪你处理心动、犹豫和不知道怎么开口的时刻。",
    tags: ["心动", "温柔回应", "开口练习"],
    heat: "93%",
    chats: "9.6k",
    verified: true,
    tileClassName: "bg-[#e0e0e0]",
    spanClassName: "row-span-6",
  },
  {
    id: "yuxia",
    name: "予夏",
    creator: "用户 @Mint 创建",
    description: "外向、主动、节奏明快，适合练习约会邀请、自然夸赞和轻松调情。",
    tags: ["主动邀约", "调情", "明快"],
    heat: "86%",
    chats: "4.4k",
    verified: false,
    tileClassName: "bg-[#cfcfcf]",
    spanClassName: "row-span-4",
  },
  {
    id: "kai",
    name: "Kai",
    creator: "官方角色",
    description: "像靠谱的年上朋友，擅长听你讲完整件事，再帮你把回应变得更成熟。",
    tags: ["成熟", "倾听", "回复建议"],
    heat: "95%",
    chats: "11.4k",
    verified: true,
    tileClassName: "bg-[#f0f0f0]",
    spanClassName: "row-span-5",
  },
  {
    id: "mianmian",
    name: "眠眠",
    creator: "用户 @Soft 创建",
    description: "慢声细语、低压陪伴，适合睡前聊天、情绪降噪和被认真接住。",
    tags: ["睡前", "低压", "陪伴"],
    heat: "92%",
    chats: "8.9k",
    verified: false,
    tileClassName: "bg-[#c4c4c4]",
    spanClassName: "row-span-5 sm:col-span-2 xl:col-span-1",
  },
  {
    id: "zhouye",
    name: "周野",
    creator: "用户 @Zero 创建",
    description: "直接、有边界、反应快，适合练习不卑不亢地表达喜欢和拒绝。",
    tags: ["直球", "边界", "表达"],
    heat: "84%",
    chats: "3.5k",
    verified: false,
    tileClassName: "bg-[#e9e9e9]",
    spanClassName: "row-span-4",
  },
]

const categories = [
  { label: "推荐", meta: "精选 42" },
  { label: "官方", meta: "24 个角色" },
  { label: "高热度", meta: "98%+" },
  { label: "温柔陪伴", meta: "36 个角色" },
  { label: "恋爱练习", meta: "28 个角色" },
  { label: "朋友感", meta: "19 个角色" },
  { label: "新角色", meta: "今日 16" },
]

const plazaStats = [
  { label: "角色", value: "128", icon: Users },
  { label: "官方", value: "24", icon: BadgeCheck },
  { label: "新增", value: "16", icon: CirclePlus },
]

export default function DiscoverPage() {
  return (
    <DashboardShell title="发现">
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <section className="bg-white px-5 pt-5 lg:px-8">
          <div className="border-b border-slate-200 pb-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
              <div className="flex min-w-0 gap-4">
                <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 sm:flex">
                  <Compass className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                    <span>AI 角色广场</span>
                    <span className="h-px w-8 bg-slate-200" />
                    <span>Discover</span>
                  </div>
                  <p className="mt-2 max-w-xl text-[15px] font-normal leading-7 text-slate-600">
                    选择一个适合此刻聊天氛围的角色。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <BadgeCheck className="size-3.5" />
                      官方精选
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <Users className="size-3.5" />
                      社区创作
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <CirclePlus className="size-3.5" />
                      持续更新
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-slate-200 pt-3 lg:border-t-0 lg:pt-0">
                {plazaStats.map((item, index) => {
                  const Icon = item.icon

                  return (
                    <div
                      className={index === 0 ? "pr-4" : "border-l border-slate-200 px-4 last:pr-0"}
                      key={item.label}
                    >
                      <div className="mb-2 flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Icon className="size-3.5" />
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">{item.label}</p>
                      <p className="mt-1 text-sm font-medium leading-none text-slate-600">{item.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-5 lg:px-8">
          <div>
            <div className="flex flex-col gap-1.5 lg:h-10 lg:flex-row lg:items-center">
              <label className="flex h-9 min-w-0 items-center gap-2 rounded-xl bg-slate-50/80 px-2.5 ring-1 ring-inset ring-slate-200/70 transition-colors focus-within:bg-white lg:w-72">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500">
                  <Search className="size-3.5" />
                </span>
                <input
                  aria-label="搜索 AI 角色"
                  className="h-8 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                  placeholder="搜索名字、性格或氛围"
                />
              </label>

              <div className="hidden h-5 w-px shrink-0 bg-slate-200 lg:block" />

              <div className="flex h-9 min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                {categories.map((category, index) => (
                  <button
                    className={
                      index === 0
                        ? "relative flex h-8 shrink-0 items-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-950 after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-slate-400"
                        : "flex h-8 shrink-0 items-center rounded-lg px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    }
                    key={category.label}
                    title={category.meta}
                    type="button"
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl bg-white">
            <div className="grid auto-rows-[88px] grid-flow-dense grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {featuredRoles.map((role) => (
                <Link
                  className={`${role.spanClassName} ${role.tileClassName} group relative flex min-h-0 flex-col overflow-hidden p-4 text-slate-950`}
                  href={`/discover/${role.id}`}
                  key={role.name}
                >
                  <div className="flex translate-y-2 items-start justify-between gap-3 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="max-w-full truncate rounded-full border border-white/70 bg-white/55 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                        {role.creator}
                      </span>
                      {role.verified ? (
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/55 text-slate-700">
                          <BadgeCheck className="size-4" />
                        </span>
                      ) : null}
                    </div>
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/55 text-slate-700 hover:bg-white/75"
                    >
                      <Heart className="size-4" />
                    </span>
                  </div>

                  <div className="mt-auto translate-y-3 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                    <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">{role.name}</h2>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap gap-1.5">
                        {role.tags.slice(0, 2).map((tag) => (
                          <span
                            className="rounded-full border border-white/70 bg-white/45 px-2 py-1 text-[11px] font-medium text-slate-700"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/70 bg-white/45 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                        <Flame className="size-3.5" />
                        {role.heat}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-8 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Bot className="size-4 text-violet-600" />
                  创作者入口
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  创建你的 AI 角色，设定人设、边界、聊天风格，并发布到广场让更多人遇见。
                </p>
              </div>
              <button className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50" type="button">
                创建角色
              </button>
            </div>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
