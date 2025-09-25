"""Aggregations powering the analytics dashboard."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict

from beanie.odm.operators.find import In

from app.models import Review, Submission


class AnalyticsService:
    async def build_dashboard_stats(self, user_id: str) -> Dict[str, Any]:
        return await self._compute_fresh(user_id)

    async def _compute_fresh(self, user_id: str) -> Dict[str, Any]:
        reviews = await Review.find(Review.user_id == user_id).to_list()
        if not reviews:
            return {
                "avgScore": None,
                "throughput": {"daily": []},
                "topLanguages": [],
                "commonIssues": [],
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

        payload = {
            "avgScore": round(avg_score, 2),
            "throughput": {"daily": [{"date": k, "count": v} for k, v in sorted(throughput.items())]},
            "topLanguages": sorted(top_languages, key=top_languages.get, reverse=True)[:5],
            "commonIssues": [
                {"category": category, "count": count}
                for category, count in sorted(issues.items(), key=lambda item: item[1], reverse=True)
            ],
            "lastUpdated": datetime.utcnow(),
            "cached": False,
        }

        return payload
