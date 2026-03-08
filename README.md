# 极简手记 (Minimalist Notes)

这是一套基于 **Cloudflare Workers** 和 **KV 存储** 构建的轻量级个人手记系统。它追求极简与美感，采用“宣纸”风格设计，专注于文字记录本身，没有多余的干扰。



## 核心功能
* **宣纸美学**：优雅的排版，支持亮色与深色模式切换。
* **极速书写**：实时预览与字数统计，捕捉灵感。
* **高效管理**：自动按时间倒序排列，支持一键删除。
* **安全可控**：基于口令验证的私有化部署。

## 部署说明

### 1. 环境准备
* 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
* 创建一个 **KV Namespace**，命名为 `NOTES`。

### 2. 配置 Worker
* 在 Cloudflare 中创建一个新的 **Worker**。
* 在 **Settings -> Variables** 中绑定 KV Namespace：
    * Variable name: `NOTES`
    * KV Namespace: 选择刚才创建的 `NOTES`
* 在 **Settings -> Variables** 中添加环境变量（用于登录）：
    * `ADMIN_PASSWORD`: 你的自定义通行口令。

### 3. 上传代码
* 将 `index.js` 代码粘贴到 Worker 的编辑器中。
* 点击“保存并部署”。

## 项目结构


* `index.js`: 核心逻辑代码，包含鉴权、KV 读写与前端 UI 渲染。

## 使用建议
* **保持极简**：该工具旨在记录灵感，适合作为你的个人知识库。
* **数据安全**：Cloudflare KV 运行在边缘节点，非常稳定。建议定期检查数据并根据需要进行线下备份。

## 协议
本项目基于 MIT 协议开源，欢迎自由使用与二次开发。
