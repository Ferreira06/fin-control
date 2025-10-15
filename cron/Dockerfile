# ferreira06/fin-control/fin-control-85c5c241b0f67e226dbfee4f40c649715b7aa3f8/cron/Dockerfile

# Usamos uma imagem base leve
FROM alpine:latest

# Instala o dcron (o cron do Alpine) e o curl
RUN apk add --no-cache dcron curl

# Copia nosso arquivo de agendamento para o diretório do cron
COPY crontab /etc/crontabs/root

# Dá a permissão correta para o arquivo
RUN chmod 0644 /etc/crontabs/root

# Comando para iniciar o daemon do cron em primeiro plano
CMD ["crond", "-f", "-d", "8"]