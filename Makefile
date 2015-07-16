ECHO_SUCCESS=@echo " \033[1;32m✔\033[0m  "

all: startcontainer

startcontainer:
	@mkdir docker/.tmp
	@cp index.html docker/.tmp/
	@cp server.js docker/.tmp/
	@cp package.json docker/.tmp/
	@cd docker && docker build --rm -t ants/broker:v1 .
	@rm -rf docker/.tmp
	@docker run -d -e VIRTUAL_HOST=broker.ants.builders -e VIRTUAL_PORT=7000 -p 7000:7000 ants/broker:v1
	$(ECHO_SUCCESS) "Succesfully launched broker api container."




