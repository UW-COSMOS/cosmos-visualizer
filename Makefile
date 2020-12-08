all:
	bin/run-frontend --production visualizer

xdd:
	docker build -t xdd_cosmos_visualizer:latest -f frontend-shared/Dockerfile.xdd frontend-shared
	docker run -p 8080:80 xdd_cosmos_visualizer:latest

tagger-xdd:
	docker build -t cosmos_tagger_xdd:latest -f apps/tagger-xdd/Dockerfile .
	docker run -p 8080:80 cosmos_tagger_xdd:latest
