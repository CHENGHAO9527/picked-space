# 新版公开项目约定

本目录是当前默认的Next.js/TypeScript/Tailwind/SQLite私人放映厅。产品行为以README.md为准，视觉以app/globals.css及components/Shicang.tsx为准。旧根目录实现仅作兼容保留，不把旧版“无来源标签”等约束强加到新版。

修改Next相关代码前，读取当前安装包node_modules/next/dist/docs/中对应指南，当前版本可能不同于训练知识。Node>=24.5；npm ci安装，npm run dev本机4180，npm run build/npm start生产预览。

lib/rules.ts是片单、积尘、BV校验真源；lib/import-policy.ts统一导入和收藏夹权限过滤；lib/library.ts隔离演示/真实命名空间与快照合并；lib/db.ts必须保持延迟初始化；lib/bili.ts为Cookie仅服务端、白名单、缓存与限速；lib/playback.mjs修改CDN/重定向/试看校验时必须重跑对应测试。

.env.local和.local/所有内容仅本机保存，不提交、打印凭证，不发布个人库、笔记、缓存、排除策略或截图。公开演示来自榜单，日期/状态明确模拟。实际关注不得从收藏作者推断；未知日期不猜；未知收藏夹权限不读；本人验证不自动处理。

积尘依据视频发布时间超过90天、在收藏/稍后再看且本地未看；预算只限制自动选片，手动收入可以超过。放归与分级只影响本地，不操作B站关注/收藏。不把本地规则称为AI评分，不承诺全部高清可播或Cookie同步全部实测。

完成修改运行npm test、npm run typecheck、npm run build。UI修改还需实际浏览器检查；静态检查与构建不能冒充实际交互或全片连播验收。发布时使用根目录打包脚本，检查文件白名单，不上传整个个人目录。不修改其他Agent专属配置。
