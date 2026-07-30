# Translator 第二阶段设计方案

文档版本：1.1  
最后更新：2026-07-29  
维护基线：`Wq5881898/translator`

## 1. 阶段边界

第二阶段是独立运行的 Windows 桌面程序，不破坏第一阶段浏览器插件的独立性。两者通过受控的 Chrome Native Messaging 桥接协作：

```text
屏幕框选
  → 内存截图
  → 桌面端本地 OCR
  → 用户校对英文
  → Named Pipe
  → Chrome Native Host
  → 第一阶段扩展
  → Chrome 本地 Translator API
  → 中文结果返回桌面端
```

截图永远只进入桌面端本地 OCR。Native Messaging、翻译 Provider、云端备用服务和日志均不得接收截图。

## 2. 第一批次最终 OCR 方案

### 2.1 Provider 结构

- `IOcrProvider` 是稳定接口；
- `PackagedEnglishOcrProvider` 是默认实现；
- `WindowsOcrProvider` 仅在打包引擎异常时备用；
- OCR 结果包含文本、Provider、耗时和平均置信度；
- 截图通过 `MemoryStream` 传递，用完立即释放，不保存到磁盘或剪贴板。

### 2.2 随包模型

测试包包含 Apache-2.0 的 Tesseract `tessdata_fast`：

- `eng.traineddata`：英文识别和英文字母校正；
- `chi_sim.traineddata`：识别简体中文边界，避免中文笔画被强行猜成英文。

用户不需要安装 Windows 语言包、注册账号、配置 Key 或联网。模型来源与 SHA-256 记录在 `THIRD_PARTY_NOTICES.md`。

### 2.3 双引擎识别

每次截图在本地执行：

1. 英文模型识别一次，取得较准确的英文字母；
2. 英文加简体中文模型识别一次，确定中文和英文边界；
3. 若画面没有中文，优先使用英文结果；
4. 若画面包含中文，对齐两组 token，使用双语结果限制边界、英文结果校正字母；
5. 最终编辑框只保留可翻译的英文、相关数字和英文标点。

例如：

```text
GitHub CI 通过。  → GitHub CI
已处理 4m 58s    → 空结果并提示没有可靠英文
```

### 2.4 质量判定与清理

轻量校验包括：

- OCR 平均置信度；
- 拉丁字母数量；
- 是否至少包含英文单词，而不只是数字、时间或单位字母；
- 异常孤立单字母比例；
- 基本元音比例；
- 图标产生的前导纯符号和无元音短小写伪单词；
- 技术缩写中常见的 `I/l` 混淆校正。

不可靠结果必须清空编辑框，并在当前窗口下方说明原因和恢复方法，不能把伪英文交给翻译 Provider。

### 2.5 已处理问题

| 问题 | 根因 | 最终处理 |
|---|---|---|
| 所有截图返回空结果 | WPF 逻辑坐标与物理像素混用 | Per-Monitor V2、`PointToScreen` 和物理像素截图 |
| 中文后再次截英文失败 | 系统 OCR 跟随中文用户语言 | 随包英文模型优先 |
| 英文出现异常空格和大小写 | 中文 OCR 强行识别英文 | Tesseract 英文模型 |
| 图标变成 `fll` | 图形线条被当作字符 | 前导图形噪声清理和短伪单词拒绝 |
| 中文变成 `iat`、`EXME` | 英文模型无法理解中文边界 | 随包中文模型和双引擎对齐 |
| `CI` 变成 `Cl` | 大写 I 与小写 l 字形接近 | 技术缩写上下文校正 |

### 2.6 回归样本

自动及人工回归覆盖：

- 内存生成英文图片；
- 内存生成中文图片；
- Merriam-Webster 当日单词页面长段落；
- 中英文混合句子；
- 中文状态加时间；
- 图标加英文文件名；
- 取消截图和连续多次截图；
- Windows 缩放及物理像素坐标。

## 3. 第二批次设计

第二批次完成真实翻译闭环：

- 桌面端通过固定名称的本地 Named Pipe 与 Native Host 通信；
- 扩展 Service Worker 使用持久 `runtime.connectNative()` 连接 Host；
- Host 只转发版本化 JSON 文本消息；
- 扩展调用 Chrome Translator API 执行 `en → zh`；
- 中文结果、Provider、请求 ID 和错误返回桌面端；
- 单次请求限制 5000 字符并设置超时；
- 浏览器、扩展、Host、模型或语言包不可用时显示可恢复错误。

第二批次仍不实现全局快捷键、收藏共享、发音、Azure、正式安装器或开机启动。

## 4. 隐私与安全

- 桌面端发送的唯一用户内容是校对后的英文；
- 协议没有截图字段；
- Native Host 校验协议版本、消息类型、请求 ID 和长度；
- Chrome Host 清单只允许精确扩展 ID，不使用通配符；
- Windows 注册使用当前用户 `HKCU`，无需管理员权限；
- 不记录 OCR 全文、译文、截图或收藏；
- 所有错误信息写入界面或 `stderr`，Native Host 的 `stdout` 只允许协议帧。

## 5. 维护规则

1. OCR、桥接和翻译 Provider 保持接口隔离；
2. 新模型必须记录来源、许可证、哈希和体积；
3. 新的识别修正必须有回归测试，避免针对单张截图硬编码完整文本；
4. 错误必须显示在用户当前操作窗口；
5. 每个批次保持独立分支、测试报告和可下载产物；
6. 第一阶段插件继续可以脱离桌面程序独立运行。

## 6. 第二批次桥接安装与诊断补充

Chrome 在 Windows 上从以下注册表键的“默认值”读取 Native Messaging 清单路径：

```text
HKCU\Software\Google\Chrome\NativeMessagingHosts\com.wq5881898.translator.stage2
```

PowerShell Registry Provider 中，名为 `(default)` 的属性并不等于注册表默认值。安装脚本必须使用 `Set-Item -Value` 写入真正的默认值，并在退出前通过 `GetValue("")` 回读验证。发布 CI 还要解析生成的 JSON 清单，检查 Host 绝对路径和精确扩展来源。

桌面端开始翻译前先执行最长约 4 秒的桥接健康检查：

- 桥接未注册、扩展未加载或 Chrome 未启动时，立即显示具体恢复步骤；
- 健康检查通过后才发送正文；
- 首次语言包准备和真实翻译有独立超时；
- 任一层断开都必须在当前桌面窗口结束等待并显示错误，不能无限保持“正在发送”。

本规则来自第二批首次人工测试暴露的问题：模拟 Host 回包测试虽然通过，但未验证 Windows 注册表默认值，也没有验证真实 Chrome 中是否加载了固定 ID 扩展。

## 7. 第三批次全局快捷截图流程

第三批次将原来分开的“框选”和“翻译”操作合并为一个用户流程：

```text
全局 Ctrl+Shift+X
→ 防止重复任务
→ 隐藏结果窗口
→ 多显示器框选
→ 内存截图与本地 OCR
→ 可靠性判断
→ 桥接健康检查
→ Chrome 本地翻译
→ 恢复并激活结果窗口
```

### 7.1 快捷键

- Windows `RegisterHotKey` 注册 `Ctrl+Shift+X`；
- 使用 `MOD_NOREPEAT` 避免按键长按产生重复截图；
- 只在当前进程生命周期有效，退出时必须注销；
- 注册失败时不终止程序，在状态区提示快捷键冲突，并保留按钮入口；
- 捕获或翻译进行中再次触发时只显示“任务正在运行”，不能并发启动截图。

### 7.2 简洁界面

主界面只保留：

- `Select screen region`；
- `Translate again`；
- `Copy Chinese`；
- 可编辑英文、只读中文和单一状态区。

技术细节默认不展开。错误必须说明“发生了什么”和“如何恢复”，不能只显示异常类型或长期停留在加载状态。

### 7.3 自动流程异常边界

- 用户取消框选：恢复窗口，不保存、不 OCR；
- OCR 不可靠：清空结果，不调用翻译 Provider；
- Chrome、扩展或 Host 不可用：健康检查约 4 秒内结束；
- 首次语言包或翻译超时：结束忙碌状态，允许原文不丢失地重试；
- 剪贴板不可用：不影响翻译结果，只在状态区提示复制失败；
- 任一异常都必须重新启用按钮和全局快捷键处理。

### 7.4 OCR 英文撇号规范化

英文网页和 PDF 常使用 Unicode 弯引号。OCR 清理层在过滤非英文字符前，先将
`’`、`‘`、`ʼ` 和全角撇号统一为 ASCII `'`，避免 `week’s` 被拆成 `week s`。

若 OCR 引擎已经把撇号识别为空格，清理层会把独立的 `s` 与前一个英文词合并为
所有格形式。该规则只在 OCR 清理流程内使用，不修改用户在英文编辑框内手动输入
的文本。回归样本必须至少覆盖 `week’s`、`Russia’s`、`America’s`、`it's` 和
`don't`。

## 8. Batch E 共享收藏库

桌面端和浏览器插件以 `%LOCALAPPDATA%\Translator\favorites.json` 作为共同数据源。
Native Host 只处理 `favorites.read`、`favorites.write` 和 `favorites.patch`
本地协议消息，不接收
截图，也不上传收藏。写入时先生成临时文件，再原子替换正式文件。

收藏结构与第一阶段保持兼容：`id`、`kind`、`originalText`、
`translatedText`、`firstFavoritedAt` 和可选 `phonetic`。插件启动时把原有
`chrome.storage.local` 收藏与共享文件按稳定 ID 合并，从而自动迁移旧数据。
Native Host 暂不可用时，插件仍保存到浏览器本地，并记录待同步状态。

桌面主界面只显示爱心按钮和 `Favorites` 入口。收藏列表在独立窗口中按需打开，
支持单选或 Ctrl/Shift 多选批量删除、CSV 导入和 CSV 导出。批量删除把所有选中
ID 放进同一次 `favorites.patch`，避免逐条写入产生中间状态。CSV 列名继续与
第一阶段一致：
`Type, English, Phonetic, Chinese translation, First saved`。

### 8.1 收藏一致性与刷新

收藏修改通过 `favorites.patch` 增量协议提交，只携带新增/更新项目和删除 ID，
不再整表覆盖。共享文件写入由跨进程信号量串行化，并继续使用临时文件原子替换。

插件在收藏面板打开、浏览器侧边栏重新获得焦点或从隐藏恢复时读取一次共享库。
其余时间不轮询，因此不会影响划词翻译或常驻性能。桌面收藏窗口每次打开及完成
导入、删除后重新读取共享库。

桌面程序启动时根据自身所在测试包自动定位相邻的 `bridge-host`，在当前用户
`HKCU` 下创建或更新 Chrome Native Messaging 注册项，并把清单写入
`%LOCALAPPDATA%\Translator\bridge`。该过程不需要管理员权限，也不再依赖用户
手动运行 PowerShell。

### 8.2 离线优先与自动恢复状态机

插件保存 `migrationCompleted` 和 `dirty` 两个本地同步标记：

- `migrationCompleted=false`：尚未把原浏览器收藏迁移到共享库；
- `dirty=true`：Bridge 不可用期间浏览器收藏发生过增删或导入；
- `migrationCompleted=true, dirty=false`：共享库是当前权威数据源。

侧边栏启动后立即尝试连接，并按 `0/1/3/6/10` 秒延迟最多尝试五次，总窗口约
20 秒。全部失败后立即停止，不设置定时轮询，也不影响翻译和浏览器本地收藏。
Bridge 恢复后，由以下离散事件触发单次重连：侧边栏重新聚焦、页面从隐藏恢复、
打开收藏面板、收藏增删或导入，以及用户点击 `Sync now`。
自动事件之间有 30 秒冷却时间；打开收藏面板和 `Sync now` 属于用户明确操作，可
跳过冷却时间。冷却只比较时间戳，不创建后台计时器。

首次迁移或 `dirty=true` 时，将浏览器收藏与共享收藏按稳定 ID 去重合并，再通过
一次 `favorites.patch` 写回；成功后设置 `migrationCompleted=true`、
`dirty=false`。已经完成迁移且没有离线修改时，直接以共享库为准，从而保留桌面端
删除操作，不会被浏览器旧快照重新添加。同步失败只把状态切换为
`Browser storage · sync paused`；成功则显示 `Shared with the Windows app`。
并发触发共享同一个进行中的同步任务，避免重复 Native Messaging 请求。

Windows 程序不会持续唤醒 Chrome。其职责是启动时自动恢复 Native Host 注册；
插件在下一次上述用户事件中发现 Bridge 已可用并自动完成合并。这种事件触发方案
保证只使用浏览器插件时没有无限重试或常驻资源消耗。

### 8.3 主界面操作布局

英文和中文文本框的标题行右上角各放置独立复制按钮。英文按钮复制 OCR 后可编辑
文本，中文按钮复制翻译结果。设置入口使用带工具提示的齿轮图标，避免长文本按钮
占用操作区宽度。

`Favorites` 按钮显示共享收藏总数，并在窗口激活、收藏增删和关闭收藏列表后更新。

