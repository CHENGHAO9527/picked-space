# AI导入约定

## 授权范围

让用户本人登录B站，并明确此次允许读取哪些来源：真实关注名单、关注博主近期公开视频、公开收藏夹、稍后再看、可选全站榜单。不要把模板作者或其他人的授权视为当前用户授权。只读，不修改关注或收藏，不导出Cookie、Token、密码或浏览器凭证文件。

遇到登录或验证码，由用户本人完成。读取失败不能判作无投稿或停更。不要将首屏当全量；记录实际读取的页数、数量、时间和未完成范围。

## JSON结构

```json
{
  "schemaVersion": 1,
  "title": "我的频道",
  "owner": "我",
  "followedCreators": [{"id":"真实UID字符串","name":"真实关注名"}],
  "provenance": {
    "method": "本人授权AI读取B站页面",
    "scope": "填写实际读取范围、日期、数量和未完成部分",
    "complete": false
  },
  "videos": [{
    "title": "真实标题",
    "url": "https://www.bilibili.com/video/BV实际编号",
    "author": "真实作者",
    "creatorId": "真实UID字符串",
    "cover": "https://实际封面地址",
    "duration": null,
    "publishedAt": "",
    "visibility": "public",
    "sources": ["following"],
    "collections": [],
    "tags": []
  }]
}
```

示例中的占位符需要替换，不能原样导入。duration填秒或mm:ss，未知填null。封面使用真实HTTPS地址；发布日期未知留空，不猜测。

sources可组合following、favorites、watchlater、ranking。同一视频按BV合并，多来源保留。followedCreators必须来自实际关注名单，不能从收藏作者推断；零条收录的关注也保留。联合创作可用contributors保存参与者UID，不把参与者冒充主投稿作者。

仅确认公开视频才写visibility:public，跳过私密、失效和充电专属内容。私密收藏夹整夹跳过；个人policy.json只属于本人，不随模板分享。

榜单可加ranking:{name,rank,capturedAt}，只填实际榜单名称、名次和快照日期，不把热门视为AI质量评审。

## 停更证据

关注条目可附lastUploadAt（YYYY-MM-DD）、activityCheckedAt和activityEvidence（最新作品原链接），必须实际按最新发布核对。recentVideoAfter只表示确有近期作品的日期下界。没有日期保持未知；无公开作品或账号不可用只有可见页面明确说明时才设置profileStatus。

## 导入、备份与后续定制

先在网站检查JSON，再确认合并。首批个人导入可替换主动加载的示例；以后按BV及UID增量合并。导出备份保留内容、笔记、观看标记和规范化settings，续播位置当前不随备份迁移。

settings的兴趣和额外要求只是用户给自己的AI的定制说明，不自动执行或影响推荐。读取legacy-v0.7-FORK_GUIDE.md及用户的“我的拾藏需求.md”，再按授权实施。不要创建多人服务或自行发布网站。
