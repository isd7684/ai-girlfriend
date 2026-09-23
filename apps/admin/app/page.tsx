"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Separator } from "@repo/ui/separator";

export default function Home() {
  const [name, setName] = useState("小晴");
  const [greeting, setGreeting] = useState("今天有什么想和我分享的吗？");
  const [preview, setPreview] = useState("填写角色信息，生成草稿预览。");
  const canPreview = name.trim().length > 0 && greeting.trim().length > 0;

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-20">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold tracking-widest text-primary">
            AI COMPANION / ADMIN
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            角色工作台
          </h1>
          <p className="max-w-xl text-muted-foreground">
            打磨角色的第一句问候，在发布前找到合适的表达。
          </p>
          <Button asChild variant="outline" size="sm">
            <a href="#character-draft">编辑角色草稿</a>
          </Button>
        </header>
        <Separator />
        <div className="grid items-start gap-6 md:grid-cols-2">
          <Card id="character-draft" className="scroll-mt-8">
            <CardHeader>
              <CardTitle>角色草稿</CardTitle>
              <CardDescription>
                仅用于本页演示，刷新后恢复默认，不会保存或发布。
              </CardDescription>
            </CardHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                // 生成本页角色预览。
                if (canPreview)
                  setPreview(`${name.trim()}：${greeting.trim()}`);
              }}
              onReset={() => {
                setName("小晴");
                setGreeting("今天有什么想和我分享的吗？");
                setPreview("已重置。填写角色信息，生成草稿预览。");
              }}
            >
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="character-name">角色名称</Label>
                  <Input
                    id="character-name"
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={30}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="character-greeting">开场问候</Label>
                  <Input
                    id="character-greeting"
                    name="greeting"
                    value={greeting}
                    onChange={(event) => setGreeting(event.target.value)}
                    maxLength={120}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-3 pt-6">
                <Button type="submit" disabled={!canPreview}>
                  预览草稿
                </Button>
                <Button type="reset" variant="outline">
                  重置
                </Button>
              </CardFooter>
            </form>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>对话预览</CardTitle>
              <CardDescription>确认角色称呼与开场语气</CardDescription>
            </CardHeader>
            <CardContent>
              <p
                role="status"
                className="break-words rounded-lg bg-muted p-5 leading-relaxed"
              >
                {preview}
              </p>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              此草稿未发布，用户端不会收到变更。
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
