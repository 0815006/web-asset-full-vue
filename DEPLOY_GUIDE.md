# 前端项目内网部署方案 (Offline Deployment Guide)

本方案旨在指导您如何在完全离线的内网环境中，部署 `web-asset-full-vue` 前端项目。

## 1. 环境准备
在开始部署前，请确保您准备了两类机器：

1.  **打包机 (可访问外网)**:
    - 安装了 Node.js (推荐 `v16.x`) 和 npm。
2.  **部署服务器 (内网)**:
    - 安装了 Nginx Web 服务器。

## 2. 部署步骤

### 步骤 1：依赖本地化 (在打包机上操作)
由于内网环境无法访问 CDN，我们需要将所有外部依赖下载到本地。

1.  **下载 OnlyOffice SDK**:
    - 在浏览器中访问 `http://<您的OnlyOffice服务器IP>:9000/web-apps/apps/api/documents/api.js`。
    - 将页面内容另存为 `api.js` 文件。
2.  **存放本地文件**:
    - 在前端工程的 `public/` 目录下，创建一个 `js` 文件夹。
    - 将下载的 `api.js` 文件放入 `public/js/` 目录。
3.  **修改 `index.html`**:
    - 打开 `public/index.html` 文件。
    - 找到 `VUE_APP_ONLYOFFICE_API` 的 script 标签，将其 `src` 修改为本地路径：
      ```html
      <!-- 修改前 -->
      <script type="text/javascript" src="<%= VUE_APP_ONLYOFFICE_API %>"></script>
      
      <!-- 修改后 -->
      <script type="text/javascript" src="/js/api.js"></script>
      ```
    - **确认**：确保 `index.html` 中没有其他指向 `http` 或 `https` 的外部链接（如 Element UI 的 CSS 等）。

### 步骤 2：配置环境变量 (在打包机上操作)
1.  **创建 `.env.production` 文件**:
    在前端工程的根目录下，创建一个名为 `.env.production` 的文件。
2.  **编辑配置文件**:
    将以下内容复制到文件中，并根据您的**内网**环境修改 IP 地址。
    ```env
    # 这个地址在内网部署时已本地化，可以留空或指向本地路径
    VUE_APP_ONLYOFFICE_API=/js/api.js

    # 重要：这里必须是 OnlyOffice Docker 容器可以访问到的后端服务 IP
    VUE_APP_BACKEND_API_BASE=http://<您的Java后端服务器内网IP>:8081
    ```

### 步骤 3：打包前端应用 (在打包机上操作)
1.  **安装依赖**:
    在项目根目录下打开终端，执行 `npm install`。
2.  **执行打包**:
    ```bash
    npm run build
    ```
    命令执行成功后，会生成一个 `dist` 文件夹，其中包含了所有编译和打包后的静态资源（HTML, CSS, JS）。

### 步骤 4：部署到 Nginx (在内网服务器上操作)
1.  **上传 `dist` 目录**:
    将打包机上生成的 `dist` 文件夹，完整地上传到您的内网 Nginx 服务器上（例如，上传到 `/var/www/` 目录下）。
2.  **配置 Nginx**:
    打开 Nginx 的配置文件（通常是 `nginx.conf` 或在 `sites-available/` 下的某个文件），添加一个新的 `server` 块：
    ```nginx
    server {
        listen 9001;  # 前端访问端口
        server_name <您的前端服务器内网IP>;

        # 前端静态文件根目录，指向 dist 文件夹
        root /var/www/dist;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # API 代理，将前端的所有 /api 请求转发到后端服务
        location /api {
            proxy_pass http://<您的Java后端服务器内网IP>:8081;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
    ```
3.  **重载 Nginx**:
    保存配置后，执行以下命令使配置生效。
    ```bash
    sudo nginx -t  # 检查配置语法是否正确
    sudo nginx -s reload  # 重载配置
    ```

## 3. 验证
- 在内网的任意一台电脑上，打开浏览器，访问 `http://<您的前端服务器内网IP>:9001`。
- 如果能看到资产全景平台的登录页面，并且所有功能（包括文件预览）都能正常使用，则表示部署成功。
