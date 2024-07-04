install:
	npm i

clean-install:
	npm ci

uninstall:
	rm -rf ./node_modules

lint:
	npm run lint

test:
	npm run test

coverage:
	npm run coverage

format:
	npm run prettier

format-check:
	npm run prettier_check

build:
	npm run build

start:
	npm run start

ci:
	make format-check
	make lint
	make test
	make build

dev:
	npm run dev

.PHONY: coverage