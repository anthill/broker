ECHO_SUCCESS=@echo " \033[1;32m✔\033[0m  "

all: startcontainer

startcontainer:
	@mkdir docker/.tmp
	@cp -r src docker/.tmp/
	@cp server.js docker/.tmp/
	@cp config.json docker/.tmp/
	@cp package.json docker/.tmp/
	@cd docker && docker build -t ants/broker:v1 .
	@rm -rf docker/.tmp
	@docker run -d -p 4000:4000 ants/broker:v1
	$(ECHO_SUCCESS) "Succesfully launched broker api container."




