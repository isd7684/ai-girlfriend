"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Spinner } from '@repo/ui/spinner'
import { UserAvatar } from '@/components/user-avatar'
import { useAdminDefaultAvatarPage } from './hooks/use-admin-default-avatar-page'

export default function DefaultAvatarPageRoute() {
  const {
    latestAvatarKey,
    latestAvatarUpdatedAtMs,
    history,
    isLoading,
    feedback,
    setFeedback,
    isUploading,
    isSettingCurrentKey,
    uploadDefaultAvatar,
    setCurrentDefaultAvatar,
  } = useAdminDefaultAvatarPage()

  async function handleDefaultAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setFeedback(null)

    try {
      await uploadDefaultAvatar(file)
    } finally {
      event.target.value = ''
    }
  }

  const latestAvatar = {
    name: 'Default avatar',
    avatarKey: latestAvatarKey,
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <Card>
        <CardHeader>
          <CardTitle>默认头像</CardTitle>
          <CardDescription>上传新的默认头像并查看历史版本。新建用户会自动继承当前最新默认头像 key。</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <CardTitle>当前默认头像</CardTitle>
            <CardDescription>这里展示当前生效的默认头像与最近一次更新时间。</CardDescription>
          </div>
          <div className="flex items-start gap-4">
            <UserAvatar user={latestAvatar} size="lg" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Latest key: {latestAvatarKey ?? 'Not configured yet'}</p>
              <p>Updated at: {latestAvatarUpdatedAtMs ? new Date(latestAvatarUpdatedAtMs).toLocaleString() : 'Not available yet'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-sm space-y-2">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                void handleDefaultAvatarUpload(event)
              }}
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">支持 JPG、PNG、WebP，最大 2MB。</p>
          </div>
          {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>历史默认头像</CardTitle>
          <CardDescription>按上传时间倒序展示历史版本。</CardDescription>
        </CardHeader>
        <CardContent>
          <Spinner loading={isLoading} label="Loading avatar history..." className="rounded-md">
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无历史默认头像。</div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => {
                  return (
                    <div key={item.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={{ name: item.fileName, avatarKey: item.key }} size="md" />
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-foreground">{item.fileName}</p>
                          <p className="break-all text-muted-foreground">{item.key}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground md:text-right">
                        <p>{item.contentType}</p>
                        <p>{item.sizeBytes} bytes</p>
                        <p>{new Date(item.createdAtMs).toLocaleString()}</p>
                        <p>By: {item.createdByUserId ?? 'Unknown'}</p>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => {
                            setFeedback(null)
                            void setCurrentDefaultAvatar(item.key)
                          }}
                          disabled={isSettingCurrentKey === item.key || latestAvatarKey === item.key}
                        >
                          {latestAvatarKey === item.key ? '当前默认头像' : isSettingCurrentKey === item.key ? '切换中...' : '设为当前'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Spinner>
        </CardContent>
      </Card>
    </div>
  )
}
