using Translator.Core;

var input = Console.OpenStandardInput();
var output = Console.OpenStandardOutput();
while (await NativeMessageFraming.ReadAsync(input, CancellationToken.None) is { } request)
{
    var response = request.MessageType == "bridge.health"
        ? BridgeEnvelope.Create("bridge.health.result", request.RequestId,
            new { available = true, host = "translator-stage2-bridge", protocolVersion = BridgeEnvelope.CurrentVersion })
        : BridgeEnvelope.Create("bridge.error", request.RequestId,
            new { code = "unsupported_message", message = $"Unsupported bridge message: {request.MessageType}" });
    await NativeMessageFraming.WriteAsync(output, response, CancellationToken.None);
}
