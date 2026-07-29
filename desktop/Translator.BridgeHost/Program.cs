using System.IO.Pipes;
using Translator.Core;

var chromeInput = Console.OpenStandardInput();
var chromeOutput = Console.OpenStandardOutput();

while (true)
{
    using var pipe = new NamedPipeServerStream(
        BridgeEnvelope.PipeName,
        PipeDirection.InOut,
        1,
        PipeTransmissionMode.Byte,
        PipeOptions.Asynchronous);
    using var waitCancellation = new CancellationTokenSource();
    var chromeRead = NativeMessageFraming.ReadAsync(chromeInput, CancellationToken.None);
    var pipeWait = pipe.WaitForConnectionAsync(waitCancellation.Token);
    var completed = await Task.WhenAny(chromeRead, pipeWait);

    if (completed == chromeRead)
    {
        waitCancellation.Cancel();
        var directRequest = await chromeRead;
        if (directRequest is null)
        {
            break;
        }

        var directResponse = directRequest.MessageType == "bridge.health"
            ? BridgeEnvelope.Create(
                "bridge.health.result",
                directRequest.RequestId,
                new
                {
                    available = true,
                    host = "translator-stage2-bridge",
                    protocolVersion = BridgeEnvelope.CurrentVersion,
                })
            : BridgeEnvelope.Create(
                "bridge.error",
                directRequest.RequestId,
                new
                {
                    code = "desktop_not_connected",
                    message = "Open Translator Desktop and try again.",
                });
        await NativeMessageFraming.WriteAsync(chromeOutput, directResponse, CancellationToken.None);
        continue;
    }

    await pipeWait;
    var desktopRequest = await NativeMessageFraming.ReadAsync(pipe, CancellationToken.None);
    if (desktopRequest is null)
    {
        continue;
    }

    await NativeMessageFraming.WriteAsync(chromeOutput, desktopRequest, CancellationToken.None);
    var extensionResponse = await chromeRead;
    if (extensionResponse is null)
    {
        break;
    }

    await NativeMessageFraming.WriteAsync(pipe, extensionResponse, CancellationToken.None);
}
