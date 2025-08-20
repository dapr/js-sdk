.PHONY: proto
proto:
	@command -v buf >/dev/null 2>&1 || { echo "buf is not installed. Install it from https://docs.buf.build/installation"; exit 1; }
	@if [ ! -f .dapr-proto-ref ]; then echo "No .dapr-proto-ref file found. Run 'make proto-update' first."; exit 1; fi
	@find ./src/proto -type f -name '*.js' -delete
	@find ./src/proto -type f -name '*.ts' -delete
	@COMMIT=$$(cat .dapr-proto-ref | tr -d '\n'); \
	buf generate \
		--template buf.gen.yaml \
		--path dapr/proto/common/v1 \
		--path dapr/proto/runtime/v1 \
		"https://github.com/dapr/dapr.git#commit=$$COMMIT"

.PHONY: proto-update
proto-update:
	@echo "Updating Dapr to latest commit..."
	@git ls-remote https://github.com/dapr/dapr.git HEAD | cut -f1 > .dapr-proto-ref
	@echo "Updated .dapr-proto-ref to: $$(cat .dapr-proto-ref)"
	@$(MAKE) proto

PROTO_PATH := internal/proto
.PHONY: proto-check-diff
proto-check-diff:
	@$(MAKE) proto
	@# single‐shell if…then…fi block
	@if ! git diff --quiet -- $(PROTO_PATH); then \
	  echo "::error ::Proto files are out of date. Please run 'make proto' and commit the changes."; \
	  git --no-pager diff -- $(PROTO_PATH); \
	  exit 1; \
	fi
