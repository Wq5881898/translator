# Translator Stage 2 · Batch B

本目录包含第二阶段 Windows 桌面端，以及与 Chrome 扩展通信的本地桥接程序。

## 本批次范围

- 保留第一批次的多显示器区域截图和本地中英文 OCR；
- OCR 文字可在桌面端编辑；
- 桌面端通过命名管道连接 Native Messaging Host；
- Native Messaging Host 与 Chrome 扩展交换版本化 JSON 消息；
- 扩展在离屏页面调用 Chrome 本地 Translator API；
- 中文结果返回桌面端，截图不离开内存；
- 提供当前用户级桥接安装脚本，不需要管理员权限。

本批次暂不包含全局快捷键、收藏库同步、朗读、Azure Provider 和正式安装器。

## 项目

- `Translator.Core`：OCR、翻译、文本和桥接协议。
- `Translator.Desktop`：截图、OCR、编辑、翻译与结果界面。
- `Translator.BridgeHost`：Chrome Native Messaging 与桌面命名管道中继。
- `Translator.TechnicalValidation`：不依赖测试框架的可执行技术检查。
- `bridge`：Native Messaging 清单模板及安装脚本。

## 构建和验证

```powershell
dotnet restore desktop\Translator.Stage2.slnx --configfile NuGet.Config
dotnet build desktop\Translator.Stage2.slnx --no-restore --configuration Release
dotnet run --project desktop\Translator.TechnicalValidation --no-build --configuration Release
```

完整安装与联调步骤见 `docs/stage-2/BATCH_B_TEST_GUIDE_ZH.md`。

## 隐私边界

`ScreenRegionCapture` 只返回内存流。截图仅传给本地 OCR，识别结束后立即释放；进入命名管道、浏览器桥接和翻译 Provider 的只有用户可编辑的识别文字。截图不会写入磁盘、剪贴板、日志或上传网络。

## 固定扩展 ID

测试包使用清单公钥固定扩展 ID 为 `djbkcmlpogpnafgifiocehmkkghnhjjb`。桥接安装脚本和 Native Messaging 清单仅允许该扩展来源，避免每次解压路径变化导致 ID 和注册信息失效。
