.PHONY: test build

test:
	npm -C /Users/ekanderson/curric_hs_plan/app run lint
	npm -C /Users/ekanderson/curric_hs_plan/app test
	npm -C /Users/ekanderson/curric_hs_plan/app run test:e2e
	npm -C /Users/ekanderson/curric_hs_plan/app run build

build:
	npm -C /Users/ekanderson/curric_hs_plan/app run build
