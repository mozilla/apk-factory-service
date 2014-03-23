test:
	@./node_modules/.bin/mocha \
		-r should \
		-R spec

bench:
	@node benchmark/bench

lint-changed:
	@jshint `git status --porcelain | sed -e "s/^...//g"`

lint:
	@jshint lib test

.PHONY: test bench lint lint-changed