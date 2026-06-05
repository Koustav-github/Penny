from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_database
from auth import get_current_user
from services.ai_reports import build_snapshot, generate_report, DISCLAIMER
import models
import schemas

router = APIRouter(prefix="/reports", tags=["reports"])


def _to_out(report: models.Report) -> schemas.ReportOut:
    return schemas.ReportOut(
        id=report.id,
        created_at=report.created_at,
        report_type=report.report_type,
        period=report.period,
        model=report.model,
        sections=[schemas.ReportSection(**s) for s in report.sections],
        disclaimer=DISCLAIMER,
    )


@router.get("", response_model=list[schemas.ReportOut])
def list_reports(db: Session = Depends(get_database), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.Report)
        .filter(models.Report.user_id == user.id)
        .order_by(models.Report.created_at.desc(), models.Report.id.desc())
        .all()
    )
    return [_to_out(r) for r in rows]


@router.post("/generate", response_model=schemas.ReportOut, status_code=status.HTTP_201_CREATED)
def generate(
    payload: schemas.ReportGenerateIn,
    db: Session = Depends(get_database),
    user: models.User = Depends(get_current_user),
):
    if user.ai_consent_at is None:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="AI consent required before generating reports.",
        )

    snapshot = build_snapshot(db, user)
    result, model_id = generate_report(snapshot, payload.report_type.value)

    report = models.Report(
        user_id=user.id,
        report_type=payload.report_type.value,
        period=payload.period,
        model=model_id,
        sections=[s.model_dump() for s in result.sections],
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return _to_out(report)
