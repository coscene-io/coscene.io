# 刻行时空官网升级计划

刻行时空官网已接入成果的独立代码仓：[`coscene-io/website-upgrade`](https://github.com/coscene-io/website-upgrade)。首次归档日期为 2026-10-06。

本仓保留当前官网首页、加速训练与交付保障页面的代码及运行素材。正在开发的「关于刻行」独立页面、历史研究入口和未接入方案不在本次归档范围。建立代码仓和提交归档不等同于部署官网。

## 本地运行

使用 Node.js 24 与 npm。在仓库根目录执行：

```bash
npm ci
npm run dev
```

打开 Vite 在终端输出的本地地址。检查与正式构建：

```bash
npm run lint
npm run build
npm run preview
```

`npm run build` 先从同一份内容 JSON 生成静态任务记录，再编译页面并复制运行所需素材至 `dist/`。正式页面使用站点根路径，预览时应通过本地服务器访问。

## 页面入口

| 路径 | 内容 |
| --- | --- |
| `/` | 官网首页 |
| `/training/robot-data/` | 加速训练：真机数据、第一人称公开样例与数据基础设施 |
| `/training/robot-data/sources/` | 模型与素材说明 |
| `/quality/delivery/` | 交付保障 |
| `/quality/delivery/records/` | 无需 JavaScript 的 15 份任务记录 |

## 代码与素材

- `src/`：已接入页面及其共享组件、交互和样式。部分文件保留原有 `study` 名称，仍是正式页面的运行依赖。
- `public/assets/`：当前页面实际使用的媒体、模型、字体及对应来源记录。
- `scripts/`：静态记录生成、运行素材复制和模型资产清单等构建工具。
- `docs/ARCHIVE.md`：归档范围与历史接入记录说明。
- `DESIGN.md`：本次保留的页面设计约定。

第三方模型、字体和公开样例的来源及使用边界见素材目录中的 `SOURCES.md`、`SOURCES.json`、`LICENSE.txt` 和相关说明文件，以及页面 `/training/robot-data/sources/`。构建同时生成 `dist/third-party-licenses.md`，记录打包软件依赖的许可。
