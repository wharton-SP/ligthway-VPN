FROM python:3.9-slim

RUN apt-get update && apt-get install -y \
    wireguard-tools \
    iptables \
    iproute2 \
    net-tools \
    qrencode \
    tini \
    && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/usr/bin/tini", "--"]

COPY app/ /app/
COPY scripts/ /scripts/

RUN pip install flask qrcode[pil] && \
    chmod +x /scripts/*.sh

EXPOSE 51820/udp 5000/tcp

CMD ["/scripts/entrypoint.sh"]