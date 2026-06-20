FROM python:3.14-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ARG BENTO4_URL="https://www.bok.net/Bento4/binaries/Bento4-SDK-1-6-0-641.x86_64-unknown-linux.zip"

RUN curl -fsSL "$BENTO4_URL" -o /tmp/bento4.zip \
    && unzip -q /tmp/bento4.zip -d /opt \
    && mv /opt/Bento4-SDK-* /opt/bento4 \
    && rm /tmp/bento4.zip
ENV BENTO4_BIN=/opt/bento4/bin

ENV PATH="/opt/bento4/bin:${PATH}"

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY scripts ./scripts

COPY worker.py .

RUN chmod +x scripts/*.sh

ENTRYPOINT ["python", "worker.py"]
