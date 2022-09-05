# Release

This document describes the release process for the `@dapr/dapr` package. Releases are done by maintainers and this is a reference documentation for the process. 

## Overview

Releases are tracked using [GitHub milestones](https://github.com/dapr/js-sdk/milestones). Milestones typically span over 4-8 weeks and issues are triaged and assigned to milestones regularly. Once a milestone is complete, the release process begins.

## Release Process

1. Create a pull request to bump the package version in `package.json` and `package-lock.json` to the next version. Example, [chore: bump version to v2.3.1](https://github.com/dapr/js-sdk/pull/332).
1. Go to [Releases](https://github.com/dapr/js-sdk/releases) and click "Draft a new release".
1. Create a new tag with version `vX.Y.Z` and target the main branch.
1. Release title should be in the form of `Release vX.Y.Z`.
1. Click on "Generate release notes" and categorize it into Features, Fixes, Chores, Documentation, and Tests. Example, [Release v2.3.1](https://github.com/dapr/js-sdk/releases/tag/v2.3.1). 
1. Each entry should be in accordance with the [conventional commit guidelines](https://docs.dapr.io/contributing/js-contributing/#format).
1. Verify that there are no breaking changes in minor or patch releases. If there are breaking changes, the version should be bumped to the next major version.
1. Breaking changes should be listed in a separate section called "Breaking Changes". The related issues must be labeled with `breaking-change`.
1. Publish the release when it's ready. 

The new release will trigger our [build](https://github.com/dapr/js-sdk/blob/main/.github/workflows/build.yml) pipeline, which will publish the package to NPM.