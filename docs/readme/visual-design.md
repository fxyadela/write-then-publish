# README 功能海报

2026-11-28 按用户要求重新设计。README 的七张主图与功能配图改用围绕现有功能构思的海报，以大标题、纸张与图解讲清使用方式。它们是功能示意；此前真实界面截图继续保留在本目录，网页实现和用户稿件不受影响。

## 视觉与内容

- 黑白、墨绿与浅鼠尾草绿；统一宽幅、粗体标题、白色纸张和连接箭头。
- 中文产品名“写了就发”与英文名“Write Then Publish”在总览中同时突出；各功能图保留英文品牌。
- 经典／沉浸对应在哪里写；图文卡片／公众号长文对应最终文章排版，分别说明。
- 卡片用段落线与山水插图表现内容流动；不增加人物头像、认证、虚构页脚或页码，不改动原产品logo。
- 实况海报区分倍速与原速保留原声；Obsidian海报说明连接并授权后同步，不描绘已连接的真实状态。

| 文件 | 功能重点 |
|---|---|
| posters/hero-v1.png | 一篇图文、多种排版，游客打开即写 |
| posters/classic-writing-v1.png | Markdown正文、实时预览、自动分页 |
| posters/immersive-writing-v1.png | 卡片直接编辑、向下续页、共用正文 |
| posters/article-layouts-v1.png | 3:4图文卡片、公众号长文、复制富文本 |
| posters/image-layout-v1.png | 上传粘贴拖放、图片位置与大小、裁剪和拼图 |
| posters/live-photo-v1.png | 片段、时长、倍速、原速原声、本机合成 |
| posters/obsidian-portable-v1.png | Markdown导入、Obsidian授权同步、ZIP原稿备份 |

七张均为1672×941 PNG，使用内置 image_gen 生成。首图确定系列风格，其余海报以首图为风格参考独立生成；实况海报追加一次局部编辑，精简重复的原声说明。

完整提示词见 [posters/prompts.md](posters/prompts.md)，文件尺寸及哈希见 [posters/manifest.json](posters/manifest.json)。文案依据当前 README、src/app.js 和 index.html 中已有功能逐项核对，未加入自动发布、云端稿件同步或AI写作等能力。

README顶部在线入口、功能／本地运行／能力矩阵导航以及License、Frontend、Live Photo三项徽章继续保留。此前 product-banner.png、auto-layout-workspace.png 等截图原件保持不变。
