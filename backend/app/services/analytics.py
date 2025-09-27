"""Aggregations powering the analytics dashboard."""
from __future__ import annotations

from datetime import datetime, timedelta
from statistics import mean
from typing import Any, Dict, List

from beanie.operators import In

from app.models import Review, Submission, SubmissionStatus


class AnalyticsService:
    async def build_dashboard_stats(self, user_id: str) -> Dict[str, Any]:
        return await self._compute_fresh(user_id)

    async def _compute_fresh(self, user_id: str) -> Dict[str, Any]:
        reviews = await Review.find(Review.user_id == user_id).sort(-Review.created_at).to_list()
        if not reviews:
            return {
                "avgScore": None,
                "throughput": {"daily": []},
                "topLanguages": [],
                "commonIssues": [],
                "pending": 0,
                "completed": 0,
                "failed": 0,
                "turnaroundHours": None,
                "lastUpdated": datetime.utcnow(),
            }

        avg_score = sum(r.score or 0 for r in reviews if r.score is not None) / max(
            1, len([r for r in reviews if r.score is not None])
        )

        past_week = datetime.utcnow() - timedelta(days=6)
        submissions = await Submission.find(
            (Submission.user_id == user_id) & (Submission.created_at >= past_week)
        ).to_list()
        throughput = {}
        for submission in submissions:
            key = submission.created_at.strftime("%Y-%m-%d")
            throughput[key] = throughput.get(key, 0) + 1

        top_languages = {}
        for submission in submissions:
            top_languages[submission.language] = top_languages.get(submission.language, 0) + 1

        issues = {}
        for review in reviews:
            for issue in review.issues:
                issues[issue.category] = issues.get(issue.category, 0) + 1

        pending_count = await Submission.find(
            (Submission.user_id == user_id)
            & In(Submission.status, [SubmissionStatus.PENDING, SubmissionStatus.PROCESSING])
        ).count()
        completed_count = await Submission.find(
            (Submission.user_id == user_id)
            & In(Submission.status, [SubmissionStatus.COMPLETED, SubmissionStatus.CACHED])
        ).count()
        failed_count = await Submission.find(
            (Submission.user_id == user_id) & (Submission.status == SubmissionStatus.FAILED)
        ).count()

        turnaround_samples: List[float] = []
        for review in reviews:
            submission = await Submission.get(review.submission_id)
            if submission:
                delta = review.created_at - submission.created_at
                turnaround_samples.append(delta.total_seconds() / 3600)

        payload = {
            "avgScore": round(avg_score, 2),
            "throughput": {"daily": [{"date": k, "count": v} for k, v in sorted(throughput.items())]},
            "topLanguages": sorted(top_languages, key=top_languages.get, reverse=True)[:5],
            "commonIssues": [
                {"category": category, "count": count}
                for category, count in sorted(issues.items(), key=lambda item: item[1], reverse=True)
            ],
            "pending": pending_count,
            "completed": completed_count,
            "failed": failed_count,
            "turnaroundHours": round(mean(turnaround_samples), 2) if turnaround_samples else None,
            "lastUpdated": datetime.utcnow(),
            "cached": False,
        }

        return payload
