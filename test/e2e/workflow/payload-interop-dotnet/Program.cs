/*
Copyright 2026 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

using System.Text.Json;
using System.Text;
using Dapr.BinaryStore;
using Dapr.Workflow;
using Dapr.Workflow.Payloads;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

Console.InputEncoding = new UTF8Encoding(false);
Console.OutputEncoding = new UTF8Encoding(false);
var mode = args[0];
var builder = Host.CreateApplicationBuilder();
builder.Logging.ClearProviders();
builder.Configuration["DAPR_GRPC_ENDPOINT"] = args[1];
builder.Services.AddDaprWorkflowBuilder(
    configureRuntime: runtime =>
    {
        runtime.RegisterWorkflow<DotnetReferenceWorkflow>();
        runtime.RegisterWorkflow<DotnetAutomaticWorkflow>();
        runtime.RegisterWorkflow<DotnetPassthroughWorkflow>();
        runtime.RegisterActivity<DotnetReferenceActivity>();
    },
    configureClient: (_, client) => client.UseGrpcEndpoint(args[1]))
    .WithBinaryStorePayloads(options =>
    {
        options.StoreName = "payloads";
        options.WritePreference = mode == "worker" ? PayloadWritePreference.PreferReference : PayloadWritePreference.Preserve;
        options.OffloadThreshold = 1;
    });
// The two applications share storage via the source sidecar's in-memory test component.
if (mode == "worker")
{
    builder.Services.RemoveAll<DaprBinaryStoreClient>();
    builder.Services.AddSingleton(new DaprBinaryStoreClientBuilder().UseGrpcEndpoint(args[2]).Build());
}
using var host = builder.Build();
if (mode == "worker")
{
    await host.StartAsync();
    Console.WriteLine("READY");
    await Console.In.ReadLineAsync();
    await host.StopAsync();
    return;
}

var resolver = host.Services.GetRequiredService<IWorkflowPayloadResolver>();
var input = await Console.In.ReadToEndAsync();
if (mode == "store")
{
    var value = JsonSerializer.Deserialize<JsonElement>(input);
    var reference = await resolver.StoreAsync(value, args[2]);
    Console.WriteLine(reference.ToEnvelope());
}
else
{
    if (!PayloadReference.TryParse(input, out var reference) || reference is null)
        throw new InvalidOperationException("Invalid reference received from JavaScript");
    if (mode == "roundtrip")
        Console.WriteLine(reference.ToEnvelope());
    else if (mode == "resolve")
        Console.WriteLine((await resolver.ResolveAsync<JsonElement>(reference)).GetRawText());
    else if (mode == "schedule")
    {
        var client = host.Services.GetRequiredService<DaprWorkflowClient>();
        await client.ScheduleNewWorkflowAsync(args[2], args[3], reference);
        Console.WriteLine(args[3]);
    }
    else
        throw new InvalidOperationException($"Unknown mode: {mode}");
}

public sealed class DotnetReferenceWorkflow : Workflow<PayloadReference<JsonElement>, PayloadReference<JsonElement>>
{
    public override async Task<PayloadReference<JsonElement>> RunAsync(WorkflowContext context, PayloadReference<JsonElement> input)
    {
        var value = await context.ResolvePayloadAsync(input);
        context.SetCustomStatus(value);
        return await context.CallActivityAsync<PayloadReference<JsonElement>>(nameof(DotnetReferenceActivity), input);
    }
}

public sealed class DotnetAutomaticWorkflow : Workflow<JsonElement, JsonElement>
{
    public override Task<JsonElement> RunAsync(WorkflowContext context, JsonElement input) => Task.FromResult(input);
}

public sealed class DotnetPassthroughWorkflow : Workflow<PayloadReference<JsonElement>, PayloadReference<JsonElement>>
{
    public override Task<PayloadReference<JsonElement>> RunAsync(WorkflowContext context, PayloadReference<JsonElement> input)
        => Task.FromResult(input);
}

public sealed class DotnetReferenceActivity(IWorkflowPayloadResolver resolver)
    : WorkflowActivity<PayloadReference<JsonElement>, PayloadReference<JsonElement>>
{
    public override async Task<PayloadReference<JsonElement>> RunAsync(WorkflowActivityContext context, PayloadReference<JsonElement> input)
    {
        var value = await resolver.ResolveAsync<JsonElement>(input);
        return await resolver.StoreAsync(value, context.InstanceId);
    }
}
