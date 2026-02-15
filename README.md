# FC-CMS-WEB 管理端

基于 Vue 3 + Vite + Element Plus 开发的内容管理系统前端。

## 技术栈

- **Vue 3** (Composition API)
- **Vite** - 构建工具
- **Element Plus** - UI 组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Axios** - 异步请求

## 核心功能

- **文章管理**：Markdown 编辑、分类/标签设置、置顶功能。
- **评论管理**：审核评论、批量回复、批量删除。
- **分类/标签**：灵活的内容组织。
- **多租户切换**：支持不同租户下的内容管理。
- **响应式布局**：适配桌面与移动端。

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 环境配置
1. 复制 `.env.example` 为 `.env`。
2. 修改 `VITE_API_BASE_URL` 指向后端接口地址（默认为 `/api`，需配合 Vite Proxy 或 Nginx 使用）。

### 3. 开发环境运行
```bash
npm run dev
```

### 4. 构建部署
```bash
npm run build
```
构建产物将生成在 `dist` 目录下。

## 项目结构
- `src/api/`: API 请求封装。
- `src/views/`: 页面组件。
- `src/components/`: 公共组件。
- `src/layout/`: 页面布局。
- `src/store/`: Pinia 状态。
- `src/utils/`: 工具类（如 Axios 拦截器）。

## 许可证

本项目采用 [CC BY-NC 4.0 (知识共享-署名-非商业性使用 4.0 国际)](https://creativecommons.org/licenses/by-nc/4.0/deed.zh) 许可协议。

- **署名**：您必须给出适当的署名，提供指向本许可协议的链接，同时标明是否（对源码）作了修改。
- **非商业性使用**：您不得将本软件或其衍生作品用于商业目的。

本项目代码逻辑及原创内容采用上述协议发布，项目所引用的第三方库之版权归其原作者所有，并遵循其各自的开源协议。