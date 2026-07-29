# 第二阶段第一批次人工测试说明

## 测试目标

本次只测试区域截图、本地 OCR、文字编辑和 Mock Provider，不测试正式翻译、全局快捷键、收藏或同步。

## 测试步骤

1. 解压 GitHub Actions 生成的 `translator-stage2-batch-a`。
2. 打开 `desktop` 文件夹。
3. 双击 `Translator.Desktop.exe`。
4. 点击 `Select screen region`。
5. 在网页、PDF、PPT 或 Word 中框选一段清晰英文。
6. 检查窗口中的英文是否被识别，并确认文字可以编辑。
7. 点击 `Run mock translation`。
8. 检查状态中是否出现 `[模拟翻译]`、文本类型和 `provider: mock`。
9. 再次截图时按 `Esc`，确认显示取消且程序可继续使用。

建议先使用已验证页面：

```text
https://www.merriam-webster.com/word-of-the-day
```

如果 Chrome 已把页面自动翻译成中文，请先选择页面上仍保持英文的 `Dictionary`、`Thesaurus` 或音标，或者临时查看原始英文页面。

## 预期结果

- 截图时出现跨屏遮罩；
- 框选后返回程序；
- 英文识别结果显示在编辑框；
- 不出现图片文件或剪贴板图片；
- Mock 结果不是正式中文翻译，这是本批次预期；
- 失败或取消后按钮恢复可点击。

## 反馈内容

请记录：

- 使用的是网页、PDF、PPT 还是 Word；
- 单屏或多屏以及 Windows 缩放比例；
- OCR 原文和错误识别位置；
- 是否能正常取消和再次截图；
- 是否出现闪退、黑屏、坐标偏移或按钮无法恢复。
