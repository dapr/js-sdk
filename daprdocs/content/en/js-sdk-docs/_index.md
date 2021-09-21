---
type: docs
title: "JavaScript SDK"
linkTitle: "JavaScript"
weight: 1000
description: JavaScript SDK packages for developing Dapr applications
no_list: true
---

The Dapr JS SDK will allow you to interface with the Dapr process that abstracts several commonly used functionalities such as Service-to-Service invocation, State Management, PubSub, and more.


<div class="card-deck">
  <div class="card">
    <div class="card-body">
      <h5 class="card-title"><b>Client</b></h5>
      <p class="card-text">Create a JavaScript client and interact with a Dapr sidecar and other Dapr applications.</p>
      <a href="{{< ref js-client >}}" class="stretched-link"></a>
    </div>
  </div>
  <!-- <div class="card">
    <div class="card-body">
      <h5 class="card-title"><b>Actors</b></h5>
      <p class="card-text">Create virtual actors with state, reminders/timers, and methods in JavaScript.</p>
      <a href="{{< ref js-actors >}}" class="stretched-link"></a>
    </div>
  </div> -->
  <div class="card">
    <div class="card-body">
      <h5 class="card-title"><b>Examples</b></h5>
      <p class="card-text">Clone the JavaScript SDK repo and try out some of the examples and get started quickly.</p>
      <a href="https://github.com/dapr/js-sdk/blob/master/documentation/examples.md" class="stretched-link"></a>
    </div>
  </div>
</div>

### Available packages
- [DaprClient]({{< ref "js-client#installing-and-importing-daprs-js-sdk" >}}) is a package that for how your application interacts with the Dapr sidecar, or other Dapr powered applications.

- [DaprServer]({{< ref "js-client#installing-and-importing-daprs-js-sdk" >}}) is a package for how the Dapr sidecar interacts with your application, forwarding event subscriptions, invokes and more.
