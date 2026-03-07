# 🚀 Cloudflare 实践笔记 (cf-notes)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/CHINA-520/cf-notes/graphs/commit-activity)

这里记录了我关于 Cloudflare 的各种配置方案、边缘计算 (Workers) 脚本以及网络优化的实战笔记。

---

## 📂 目录结构

* **/Workers**: 常用边缘计算脚本（如反向代理、自定义 API）。
* **/Pages**: 静态网站部署与自动化构建心得。
* **/Network**: 优选 IP、DNS 配置及 CDN 性能优化技巧。
* **/Security**: WAF 规则、防火墙过滤及防 CC 攻击配置。
* **/Tutorials**: 手把手教学文档。

---

## 🌟 核心内容预览

### 1. Cloudflare Workers 妙用
- [ ] 某某反代脚本：解决某些 API 无法直连的问题。
- [ ] 自动签到工具：利用 Cron Triggers 实现每日任务。

### 2. 网络优化
- 优选 IP 脚本推荐与使用心得。
- 开启 Argo Smart Routing 的实际体验分析。

---

## 🛠️ 如何使用

1. **克隆仓库**
   ```bash
   git clone [https://github.com/CHINA-520/cf-notes.git](https://github.com/CHINA-520/cf-notes.git)
   查找内容
直接进入对应的文件夹查看 .md 文档或 .js 脚本。

📝 TODO List
[ ] 增加关于 Cloudflare Zero Trust 的配置指南。

[ ] 整理常用的 WAF 拦截规则。

[ ] 整合一个自动化部署的 Action 脚本。

🤝 贡献与反馈
欢迎提交 Issue 或 Pull Request 来完善这份笔记！如果你觉得有帮助，请给个 Star ⭐。

📄 开源协议
本项目基于 MIT License 开源。
