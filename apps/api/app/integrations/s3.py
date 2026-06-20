from __future__ import annotations

import logging
import re
import secrets
import string
from typing import Any, Optional

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

from ..config import Config
from ..core.errors import ApiError

logger = logging.getLogger(__name__)

_KEY_ALPHABET = string.ascii_lowercase + string.digits


def _short_id(length: int = 12) -> str:
    return "".join(secrets.choice(_KEY_ALPHABET) for _ in range(length))


def _sanitize(name: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", (name or "").strip().lower()).strip("-._")
    return cleaned or "video"


def new_raw_key(filename: str) -> str:
    return f"{_short_id()}-{_sanitize(filename)}"


def _s3_client():
    """Build an S3 client. Forces SigV4 (required by modern AWS regions, and a
    custom endpoint would otherwise fall back to SigV2) and, when a custom
    endpoint is set (e.g. LocalStack), targets it with path-style addressing so
    the bucket sits in the path rather than a vhost subdomain that won't resolve."""
    addressing = {"addressing_style": "path"} if Config.AWS_ENDPOINT_URL else {}
    kwargs: dict[str, Any] = {
        "region_name": Config.AWS_REGION,
        "config": BotoConfig(signature_version="s3v4", s3=addressing),
    }
    if Config.AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = Config.AWS_ENDPOINT_URL
    return boto3.client("s3", **kwargs)


def presign_put(key: str) -> dict[str, Any]:
    """Create a presigned S3 PUT URL for an existing object key.

    Content-Type is intentionally not bound to the signature so the browser can
    upload before the file (and its type) is known, per the admin flow.
    """
    if not Config.S3_RAW_BUCKET:
        raise ApiError("S3 is not configured. Set S3_RAW_BUCKET.", 503)

    client = _s3_client()
    try:
        url = client.generate_presigned_url(
            "put_object",
            Params={"Bucket": Config.S3_RAW_BUCKET, "Key": key},
            ExpiresIn=Config.S3_PRESIGN_EXPIRY,
        )
    except (NoCredentialsError, BotoCoreError, ClientError):
        raise ApiError(
            "Could not create an upload URL. Check the API's AWS credentials and permissions.",
            503,
        )

    return {
        "upload_url": url,
        "raw_s3_key": key,
        "bucket": Config.S3_RAW_BUCKET,
        "expires_in": Config.S3_PRESIGN_EXPIRY,
    }


def create_presigned_put(filename: str) -> dict[str, Any]:
    """Presign a PUT to a freshly generated raw object key."""
    return presign_put(new_raw_key(filename))


def _delete_object(client, bucket: str, key: str) -> None:
    try:
        client.delete_object(Bucket=bucket, Key=key)
    except (BotoCoreError, ClientError) as exc:
        logger.warning("S3 cleanup: could not delete s3://%s/%s: %s", bucket, key, exc)


def _delete_prefix(client, bucket: str, prefix: str) -> None:
    prefix = prefix.rstrip("/") + "/"
    try:
        paginator = client.get_paginator("list_objects_v2")
        batch: list[dict] = []
        for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
            for obj in page.get("Contents", []):
                batch.append({"Key": obj["Key"]})
                if len(batch) == 1000:
                    client.delete_objects(Bucket=bucket, Delete={"Objects": batch})
                    batch = []
        if batch:
            client.delete_objects(Bucket=bucket, Delete={"Objects": batch})
    except (BotoCoreError, ClientError) as exc:
        logger.warning("S3 cleanup: could not delete prefix s3://%s/%s: %s", bucket, prefix, exc)


def delete_movie_assets(raw_s3_key: Optional[str], dash_s3_key: Optional[str]) -> None:
    """Best-effort removal of a movie's S3 objects: the raw upload (single key)
    and the packaged DASH output (a key prefix). Logs failures and never raises,
    so a slow or unavailable S3 can't block the catalog delete."""
    if not raw_s3_key and not dash_s3_key:
        return
    client = _s3_client()
    if raw_s3_key:
        _delete_object(client, Config.S3_RAW_BUCKET, raw_s3_key)
    if dash_s3_key:
        _delete_prefix(client, Config.S3_DASH_BUCKET, dash_s3_key)
