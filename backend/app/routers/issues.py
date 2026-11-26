from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.issue import Issue
from app.models.detection import Detection
import datetime

router = APIRouter()

class IssueCreate(BaseModel):
    detection_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    priority: str = "medium"

class IssueStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class IssueAssign(BaseModel):
    assigned_to: str
    department_id: Optional[int] = None

class IssueComment(BaseModel):
    comment: str
    user: str = "Official"

@router.get("/")
async def list_issues(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Issue)
    if status and status != "all":
        query = query.filter(Issue.status == status)
    if priority:
        query = query.filter(Issue.priority == priority)
    issues = query.order_by(Issue.created_at.desc()).offset(skip).limit(limit).all()
    return [serialize_issue(i) for i in issues]

@router.post("/")
async def create_issue(issue_data: IssueCreate, db: Session = Depends(get_db)):
    issue = Issue(**issue_data.dict())
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return serialize_issue(issue)

@router.get("/stats")
async def issue_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Issue.id)).scalar()
    by_status = db.query(Issue.status, func.count(Issue.id)).group_by(Issue.status).all()
    return {"total": total, "by_status": {s: c for s, c in by_status}}

@router.get("/{issue_id}")
async def get_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return serialize_issue(issue)

@router.patch("/{issue_id}/status")
async def update_status(issue_id: int, update: IssueStatusUpdate, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.status = update.status
    if update.notes:
        issue.resolution_notes = update.notes
    if update.status == "resolved":
        issue.resolved_at = datetime.datetime.utcnow()
    if issue.detection_id:
        det = db.query(Detection).filter(Detection.id == issue.detection_id).first()
        if det:
            det.status = update.status
    db.commit()
    return serialize_issue(issue)

@router.post("/{issue_id}/assign")
async def assign_issue(issue_id: int, assignment: IssueAssign, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.assigned_to = assignment.assigned_to
    if assignment.department_id:
        issue.department_id = assignment.department_id
    if issue.status == "new":
        issue.status = "assigned"
    db.commit()
    return serialize_issue(issue)

@router.post("/{issue_id}/comments")
async def add_comment(issue_id: int, comment_data: IssueComment, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    comments = issue.comments or []
    comments.append({
        "user": comment_data.user,
        "comment": comment_data.comment,
        "timestamp": str(datetime.datetime.utcnow())
    })
    issue.comments = comments
    db.commit()
    return {"message": "Comment added", "comments": issue.comments}

def serialize_issue(i: Issue) -> dict:
    return {
        "id": i.id, "detection_id": i.detection_id, "title": i.title,
        "description": i.description, "status": i.status, "priority": i.priority,
        "assigned_to": i.assigned_to, "department_id": i.department_id,
        "resolution_notes": i.resolution_notes, "comments": i.comments or [],
        "created_at": str(i.created_at), "updated_at": str(i.updated_at) if i.updated_at else None,
        "resolved_at": str(i.resolved_at) if i.resolved_at else None
    }
