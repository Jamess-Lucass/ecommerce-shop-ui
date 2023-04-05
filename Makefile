.PHONY: install
install:
	pnpm install --dir src

.PHONY: dev
dev:
	dotenv -- sh -c 'cd src; pnpm dev'

.PHONY: compose
compose:
ifdef SERVICE
	docker compose up -d $(SERVICE)
else
	docker compose up -d
endif

.PHONY: compose-build
compose-build:
ifdef SERVICE
	docker compose up -d $(SERVICE) --build
else
	docker compose up -d --build
endif