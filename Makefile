test:
	node test/*

.PHONY: test

bm:
	for f in `find benchmark -name "linear.js" -o -name "forked.js"`; do node $$f ; done
