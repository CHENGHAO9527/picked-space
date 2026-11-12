# 做成你自己的拾藏

1. 从仓库根目录按README安装新版：`npm ci --prefix shicang-next`，再`npm run dev`。默认演示馆可先体验，不需要作者账号。
2. 选择内容来源：本人配置服务端Cookie同步，或让自己的AI只读已授权的公开页面，按[新版导入约定](shicang-next/AI_IMPORT.md)生成JSON，再在本机导入。
3. 在新版`.env.local`设`USE_MOCK=false`，重启。原始关注名单、收藏、观看与笔记都属于你自己的本地副本，不发送给作者。
4. 先真实用几次，再把具体问题交给AI：片单要偏什么、哪些分区不看、什么情况下应该保留旧藏。让AI先读`shicang-next/AGENTS.md`再改代码。
5. 准备分享时，运行根目录`npm run package:template`，核对ZIP没有`.env.local`、`.local`、个人JSON、数据库或日志。不要直接上传自己的完整目录。

新版与旧版的本地存储不同，不会自动搬走浏览器旧数据。旧快照可按[AI_IMPORT.md](AI_IMPORT.md)导入，但不要上传到GitHub。跨来源重复按BV合并；旧观看位置/笔记不会凭空迁移。

本项目仍是本地单用户工具，没有统一托管账号系统、自动登录、自动读取浏览器Cookie或自动付费AI调用。接口、登录和清晰度受B站实际可用资源约束。
