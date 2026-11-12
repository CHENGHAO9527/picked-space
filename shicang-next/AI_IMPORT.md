# 新版：让自己的AI整理公开内容

这是本地JSON导入约定，不是自动登录或自动抓取服务。先在自己的浏览器登录，再明确授权有浏览器操作能力的AI读取哪些页面。登录、验证码与本人身份验证由你完成；不要让AI读取浏览器Cookie/Token存储，不把Cookie放进JSON或聊天。

## 可交给AI的任务

> 请只读取我授权的B站实际关注名单、已确认公开的收藏夹、稍后再看和公开视频。不要从收藏视频作者推断我的关注。私密夹、无法确认公开的内容不导入；读取失败不判成停更。按下面结构输出UTF-8 JSON，BV、标题、作者和时长用实际页面数据；未知日期留空，不编造。最后说明哪些范围已读、哪些未读。

## 文件结构

```json
{
  "schemaVersion": 1,
  "updatedAt": "",
  "followedCreators": [],
  "videos": []
}
```

`followedCreators`每项为`{"id":"实际UID","name":"实际UP名称","lastUploadAt":""}`，仅列实际关注。最新投稿时间未知就省略/留空，不从所见旧视频推断。

`videos`每项必须有：

- `id`：真实完整BV号；也可提供完整HTTPS B站视频`url`。
- `platform`：固定`bilibili`。
- `title`、`author`：已核实的标题和UP名称。
- `creatorId`：实际数字UID，未知可空字符串。
- `duration`：实际秒数，未知为0，不估算。
- `publishedAt`：实际发布日期的ISO字符串，未知为空；不是收藏时间。
- `sources`：至少一项，`following`、`favorites`、`watchlater`、`ranking`或`custom`。一条视频可有多个已确认来源。
- `collections`：已确认公开的收藏夹名称数组，不含私密夹。
- `visibility`：`public`。明确私密的条目会被过滤；生成文件前仍须人工核对范围。
- 可选`cover`：B站hdslb.com官方HTTPS封面地址，未知为空。

先生成文件，再由本人检查来源与未完成范围，随后运行：

```sh
npm run import:legacy -- /完整路径/我的公开内容.json
```

在新版目录执行；从仓库根目录执行时使用`npm --prefix shicang-next run import:legacy -- /完整路径/我的公开内容.json`。设`.env.local`中的`USE_MOCK=false`后重启。已有快照需明确加`--replace`，旧文件先备份。本地状态和笔记不会清空。

导入脚本白名单化字段、按BV合并来源；配置的排除夹、明确私密、抖音、非法BV和无来源条目不会保存。缺发布日期不进入积尘。导入文件、备份、数据库均位于被忽略的`.local/`，不得随公开模板上传。

需要更个性化的页面时，把本目录源代码、你的实际使用问题与这份约定交给AI继续改；网页本身不会自动调用AI。
