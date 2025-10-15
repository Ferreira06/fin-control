# file: cron/Dockerfile

# Usamos uma imagem base leve
FROM alpine:latest

# Instala o cron e o curl (ferramenta para chamadas de rede)
RUN apk add --no-cache cron curl

# Copia nosso arquivo de agendamento para o diretório do cron
COPY crontab /etc/crontabs/root

# Dá a permissão correta para o arquivo
RUN chmod 0644 /etc/crontabs/root

# Comando para iniciar o daemon do cron em primeiro plano
CMD ["crond", "-f"]