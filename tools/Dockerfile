FROM nginx:alpine
COPY frontend/public/woodpilot-mobile/ /usr/share/nginx/html/
COPY frontend/public/agencement-configurator/panel-nesting.js /usr/share/nginx/html/agencement-configurator/panel-nesting.js
COPY deploy/tools/nginx.conf /etc/nginx/conf.d/default.conf
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
