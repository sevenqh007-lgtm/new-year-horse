# 📱 微信公众号部署指南

## 快速部署步骤

### 1. 本地测试

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 测试功能

### 2. 构建生产版本

```bash
npm run build
```

构建完成后，`dist` 目录包含所有静态文件。

### 3. 部署方案

#### 方案A：Cloudflare Pages（推荐，免费）

1. 将项目上传到GitHub
2. 登录 [Cloudflare Pages](https://pages.cloudflare.com/)
3. 连接GitHub仓库
4. 配置构建设置：
   - 构建命令：`npm run build`
   - 输出目录：`dist`
5. 部署完成后获得免费HTTPS域名

#### 方案B：Vercel（免费）

1. 安装Vercel CLI
```bash
npm i -g vercel
```

2. 在项目目录运行
```bash
vercel
```

3. 按提示完成部署

#### 方案C：自建服务器

将`dist`目录上传到服务器，配置Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. 配置微信公众号

#### 获取公众号ID
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"设置与开发" -> "基本配置"
3. 记录账号ID

#### 替换关注链接
在以下文件中找到 `__biz=你的公众号ID==` 并替换为实际ID：

- `src/utils/followCheck.js`
- `src/views/Generator.vue`

替换示例：
```javascript
// 原始
window.location.href = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=你的公众号ID==&scene=126#wechat_redirect`

// 替换后
window.location.href = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzAwNzUyMjQ4Nw==&scene=126#wechat_redirect`
```

#### 配置JS接口安全域名
1. 进入"设置与开发" -> "公众号设置" -> "功能设置"
2. 在"JS接口安全域名"中添加你的域名
3. 验证域名（下载文件上传到服务器根目录）

#### 设置自动回复
1. 进入"内容管理" -> "自动回复" -> "被关注回复"
2. 添加回复内容：
```
🐴 马年大吉！

感谢您的关注！

点击下方链接，免费制作马年专属拜年图：
[📸 马年拜年神器]

🧧 祝您马年：
✨ 马到成功，一马当先
✨ 龙马精神，万事如意
✨ 金马呈祥，财源广进

🎆 点击领取更多马年祝福！
```

#### 设置自定义菜单
1. 进入"内容管理" -> "自定义菜单"
2. 配置菜单：

```
主菜单：
├── 🎁 马年祝福 (点击跳转：https://your-domain.com/)
├── 📸 拜年图 (点击跳转：https://your-domain.com/generator)
└── 🎆 放烟花 (点击跳转：https://your-domain.com/firework)
```

### 5. 后端验证（可选）

使用Cloudflare Workers实现免费后端：

```javascript
// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  if (url.pathname === '/api/check-follow') {
    const userId = url.searchParams.get('userId')
    // 这里应该查询数据库或调用微信API验证关注状态
    // 演示版本返回随机结果
    const isFollowed = Math.random() > 0.5

    return new Response(JSON.stringify({ isFollowed }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('Not Found', { status: 404 })
}
```

### 6. 测试流程

1. 在微信中访问你的H5链接
2. 验证强制关注弹窗是否正常显示
3. 点击关注后验证是否跳转到公众号
4. 关注后返回，验证是否自动解锁
5. 测试所有功能是否正常

### 7. 数据统计建议

使用免费方案追踪数据：

#### 方案1：百度统计（免费）
1. 注册 [百度统计](https://tongji.baidu.com/)
2. 添加网站
3. 将统计代码添加到 `index.html`

#### 方案2：Google Analytics（免费）
1. 注册 [Google Analytics](https://analytics.google.com/)
2. 添加追踪代码到 `index.html`

### 8. 优化建议

#### 性能优化
- 开启Gzip压缩
- 使用CDN加速
- 图片懒加载
- 代码分割

#### SEO优化
- 添加meta标签
- 生成sitemap.xml
- 配置robots.txt

#### 微信优化
- 配置分享缩略图
- 设置分享标题和描述
- 使用微信JSSDK增强体验

### 9. 常见问题

#### Q: 如何获取公众号ID？
A: 登录微信公众平台 -> 设置与开发 -> 基本配置 -> 账号ID

#### Q: 免费方案够用吗？
A: Cloudflare Pages每天100,000次请求足够中小型活动使用

#### Q: 如何验证用户关注状态？
A: 需要后端调用微信API或使用微信OAuth，演示版本使用localStorage模拟

#### Q: 能否替换为其他动物年？
A: 可以，只需替换文本和emoji（如：蛇年用🐍）

#### Q: 如何自定义模板？
A: 编辑 `src/views/Generator.vue` 中的 `templates` 数组

## 🎯 运营建议

### 裂变机制
1. 分享增加生成次数
2. 邀请好友送无限使用
3. 拼团解锁高级模板

### 活动时间
- 春节前一周开始预热
- 除夕至初七高峰期
- 正月十五收官

### 推广渠道
1. 朋友圈广告
2. 公众号推文
3. 社群转发
4. KOL合作

---

📞 技术支持：遇到问题请查看README.md或提交Issue
