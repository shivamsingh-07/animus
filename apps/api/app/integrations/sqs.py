from __future__ import annotations

import json
import logging
from typing import Any

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

from ..config import Config

logger = logging.getLogger(__name__)


def _sqs_client():
    kwargs: dict[str, Any] = {"region_name": Config.AWS_REGION}
    if Config.AWS_ENDPOINT_URL:  # LocalStack / ElasticMQ
        kwargs["endpoint_url"] = Config.AWS_ENDPOINT_URL
    return boto3.client("sqs", **kwargs)


def enqueue_transcode(movie_id: str, raw_s3_key: str) -> bool:
    """Push a transcode job onto the queue for the worker to pick up.

    The body is a JSON array of jobs — ``[{"movie_id", "raw_s3_key"}]`` — matching
    the transcoder's message format. Best-effort: returns False (and logs) when
    the queue isn't configured or SQS rejects the send, so a failed enqueue never
    breaks the upload flow — the movie is already 'uploaded' and can be requeued.
    """
    if not Config.SQS_TRANSCODE_QUEUE_URL:
        logger.warning("SQS_TRANSCODE_QUEUE_URL unset; skipping transcode enqueue for %s", movie_id)
        return False

    body = json.dumps([{"movie_id": movie_id, "raw_s3_key": raw_s3_key}])
    try:
        _sqs_client().send_message(QueueUrl=Config.SQS_TRANSCODE_QUEUE_URL, MessageBody=body)
    except (NoCredentialsError, BotoCoreError, ClientError) as exc:
        logger.error("could not enqueue transcode job for %s: %s", movie_id, exc)
        return False

    logger.info("enqueued transcode job for %s (raw=%s)", movie_id, raw_s3_key)
    return True
