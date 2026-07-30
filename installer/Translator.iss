#define MyAppName "Translator"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "Wq5881898"

[Setup]
AppId={{4C38E346-74E1-4A45-94D3-5881898A20E2}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\Programs\Translator
DefaultGroupName=Translator
DisableProgramGroupPage=yes
OutputDir=..\installer-output
OutputBaseFilename=Translator-Setup
Compression=lzma2/max
SolidCompression=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\desktop\Translator.Desktop.exe
WizardStyle=modern

[Files]
Source: "..\staging\desktop\*"; DestDir: "{app}\desktop"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\staging\bridge-host\*"; DestDir: "{app}\bridge-host"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\staging\extension\*"; DestDir: "{app}\extension"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\staging\BATCH_E_TEST_GUIDE_ZH.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "..\staging\STAGE2_DESIGN_ZH.md"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "INSTALL_AFTER_SETUP_ZH.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\Translator"; Filename: "{app}\desktop\Translator.Desktop.exe"; WorkingDir: "{app}\desktop"
Name: "{autodesktop}\Translator"; Filename: "{app}\desktop\Translator.Desktop.exe"; WorkingDir: "{app}\desktop"
Name: "{autoprograms}\Translator 浏览器插件文件夹"; Filename: "{app}\extension"
Name: "{autoprograms}\Translator 安装说明"; Filename: "{app}\INSTALL_AFTER_SETUP_ZH.txt"

[Registry]
Root: HKCU64; Subkey: "Software\Google\Chrome\NativeMessagingHosts\com.wq5881898.translator.stage2"; ValueType: string; ValueName: ""; ValueData: "{localappdata}\Translator\bridge\com.wq5881898.translator.stage2.json"; Flags: uninsdeletekey
Root: HKCU32; Subkey: "Software\Google\Chrome\NativeMessagingHosts\com.wq5881898.translator.stage2"; ValueType: string; ValueName: ""; ValueData: "{localappdata}\Translator\bridge\com.wq5881898.translator.stage2.json"; Flags: uninsdeletekey

[Run]
Filename: "{app}\desktop\Translator.Desktop.exe"; Description: "启动 Translator"; Flags: nowait postinstall skipifsilent
Filename: "{app}\extension"; Description: "打开浏览器插件文件夹"; Flags: shellexec postinstall unchecked skipifsilent
Filename: "{app}\INSTALL_AFTER_SETUP_ZH.txt"; Description: "查看浏览器插件安装说明"; Flags: shellexec postinstall unchecked skipifsilent

[UninstallDelete]
Type: files; Name: "{localappdata}\Translator\bridge\com.wq5881898.translator.stage2.json"
Type: dirifempty; Name: "{localappdata}\Translator\bridge"

[Code]
procedure WriteNativeMessagingManifest;
var
  ManifestDirectory: String;
  ManifestPath: String;
  HostPath: String;
  EscapedHostPath: String;
  Manifest: String;
begin
  ManifestDirectory := ExpandConstant('{localappdata}\Translator\bridge');
  ManifestPath := ManifestDirectory + '\com.wq5881898.translator.stage2.json';
  HostPath := ExpandConstant('{app}\bridge-host\Translator.BridgeHost.exe');
  EscapedHostPath := HostPath;
  StringChangeEx(EscapedHostPath, '\', '\\', True);
  ForceDirectories(ManifestDirectory);
  Manifest :=
    '{' + #13#10 +
    '  "name": "com.wq5881898.translator.stage2",' + #13#10 +
    '  "description": "Translator Stage 2 browser bridge",' + #13#10 +
    '  "path": "' + EscapedHostPath + '",' + #13#10 +
    '  "type": "stdio",' + #13#10 +
    '  "allowed_origins": [' + #13#10 +
    '    "chrome-extension://djbkcmlpogpnafgifiocehmkkghnhjjb/"' + #13#10 +
    '  ]' + #13#10 +
    '}' + #13#10;
  if not SaveStringToFile(ManifestPath, Manifest, False) then
    RaiseException('无法创建 Chrome Bridge 配置文件：' + ManifestPath);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
    WriteNativeMessagingManifest;
end;

