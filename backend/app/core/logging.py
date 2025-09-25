"""Logging configuration for the application."""
from __future__ import annotations

import logging
from logging.config import dictConfig

import structlog


def setup_logging(log_level: str = "INFO") -> None:
    timestamper = structlog.processors.TimeStamper(fmt="iso")

    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "structlog": {
                    "()": structlog.stdlib.ProcessorFormatter,
                    "processor": structlog.dev.ConsoleRenderer(colors=False),
                    "foreign_pre_chain": [
                        structlog.stdlib.add_log_level,
                        timestamper,
                    ],
                }
            },
            "handlers": {
                "default": {
                    "level": log_level,
                    "class": "logging.StreamHandler",
                    "formatter": "structlog",
                }
            },
            "loggers": {
                "": {"handlers": ["default"], "level": log_level, "propagate": True},
                "uvicorn": {"handlers": ["default"], "level": log_level, "propagate": False},
                "uvicorn.error": {
                    "handlers": ["default"],
                    "level": log_level,
                    "propagate": False,
                },
                "uvicorn.access": {
                    "handlers": ["default"],
                    "level": log_level,
                    "propagate": False,
                },
            },
        }
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            timestamper,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
