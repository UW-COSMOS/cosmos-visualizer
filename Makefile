all: xdd

xdd:
	docker build -t xdd_cosmos_visualizer:latest -f apps/visualizer-xdd/Dockerfile .
	docker run -p 8080:80 xdd_cosmos_visualizer:latest

tagger-xdd:
	docker build -t xdd_cosmos_tagger:latest -f apps/tagger-xdd/Dockerfile .
	docker run -p 8080:80 xdd_cosmos_tagger:latest

validation:
	docker build -t validation:latest -f apps/validation/Dockerfile .
	docker run -p 8081:80 validation:latest
