from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import and_
from app.models.team import Team
from app.models.participant import Participant
from app.models.answer import Answer
from app.models.vote import Vote
from app.models.question import Question, QuestionType
from app.models.survey import Survey
from app.utils.websocket_manager import websocket_manager, run_async_in_thread
from app.services.survey_service import SurveyService
from typing import List, Dict, Optional


class TeamService:
    @staticmethod
    def register_team(
        db: Session,
        survey_id: int,
        team_name: str,
        participants_data: List[Dict]
    ) -> Team:
        """
        Register new team with participants
        """
        survey = db.query(Survey).filter(Survey.id == survey_id).first()
        if not survey:
            raise ValueError("Survey not found")
        
        # Check if team name already exists for this survey
        existing_team = db.query(Team).filter(
            and_(Team.survey_id == survey_id, Team.name == team_name)
        ).first()
        
        if existing_team:
            raise ValueError("Team name already exists")
        
        team = Team(
            survey_id=survey_id,
            name=team_name,
            question_status={"question": "pending", "voting": "pending"}
        )
        
        db.add(team)
        db.flush()
        
        # Add participants
        for participant_data in participants_data:
            participant = Participant(
                team_id=team.id,
                first_name=participant_data["first_name"],
                last_name=participant_data["last_name"],
                contact_info=participant_data["contact_info"],
                profession=participant_data["profession"]
            )
            db.add(participant)
        
        db.commit()
        db.refresh(team)
        
        # Send WebSocket updates
        run_async_in_thread(SurveyService.notify_team_registered(survey_id))
        
        return team
    
    @staticmethod
    def get_team_by_id(db: Session, team_id: int) -> Optional[Team]:
        """
        Get team by ID
        """
        return db.query(Team).filter(Team.id == team_id).first()
    
    @staticmethod
    def submit_answers(
        db: Session,
        team_id: int,
        answers: List[str]
    ) -> List[Answer]:
        """
        Submit team answers for question stage
        """
        team = TeamService.get_team_by_id(db, team_id)
        if not team:
            raise ValueError("Team not found")
        
        survey = db.query(Survey).filter(Survey.id == team.survey_id).first()
        if survey.current_stage.value != "question":
            raise ValueError("Survey is not in question stage")
        
        # Get question
        question = db.query(Question).filter(
            and_(
                Question.survey_id == team.survey_id,
                Question.type == QuestionType.QUESTION,
                Question.is_active == True
            )
        ).first()
        
        if not question:
            raise ValueError("Question not found")
        
        # Delete existing answers
        db.query(Answer).filter(
            and_(Answer.team_id == team_id, Answer.question_id == question.id)
        ).delete()
        
        # Create new answers
        created_answers = []
        for answer_content in answers:
            answer = Answer(
                team_id=team_id,
                question_id=question.id,
                content=answer_content
            )
            db.add(answer)
            created_answers.append(answer)
        
        # Update team status
        if team.question_status is None:
            team.question_status = {}
        team.question_status["question"] = "answered"
        flag_modified(team, "question_status")
        
        db.commit()
        
        # Send WebSocket updates
        run_async_in_thread(TeamService._notify_team_status_changed(team_id))
        run_async_in_thread(SurveyService.notify_team_registered(survey.id))
        
        return created_answers
    
    @staticmethod
    async def _notify_team_status_changed(team_id: int):
        """
        Notify WebSocket clients about team status change
        """
        try:
            from app.database import SessionLocal
            db = SessionLocal()
            try:
                status = TeamService.get_team_status(db, team_id)
                await websocket_manager.send_to_team(team_id, {
                    "type": "team_status",
                    "data": status
                })
            finally:
                db.close()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error notifying team status changed: {e}")
    
    @staticmethod
    def submit_votes(
        db: Session,
        team_id: int,
        answer_ids: List[int]
    ) -> List[Vote]:
        """
        Submit team votes for voting stage
        """
        team = TeamService.get_team_by_id(db, team_id)
        if not team:
            raise ValueError("Team not found")
        
        survey = db.query(Survey).filter(Survey.id == team.survey_id).first()
        if survey.current_stage.value != "voting":
            raise ValueError("Survey is not in voting stage")
        
        # Get voting question
        voting_question = db.query(Question).filter(
            and_(
                Question.survey_id == team.survey_id,
                Question.type == QuestionType.VOTING,
                Question.is_active == True
            )
        ).first()
        
        if not voting_question:
            raise ValueError("Voting question not found")
        
        # Verify all answer_ids belong to the survey
        valid_answers = db.query(Answer).filter(
            and_(
                Answer.id.in_(answer_ids),
                Answer.question_id.in_(
                    db.query(Question.id).filter(
                        and_(
                            Question.survey_id == team.survey_id,
                            Question.type == QuestionType.QUESTION
                        )
                    )
                )
            )
        ).all()
        
        if len(valid_answers) != len(answer_ids):
            raise ValueError("Some answer IDs are invalid")
        
        # Delete existing votes
        db.query(Vote).filter(Vote.team_id == team_id).delete()
        
        # Create new votes
        created_votes = []
        for answer_id in answer_ids:
            vote = Vote(
                team_id=team_id,
                answer_id=answer_id
            )
            db.add(vote)
            created_votes.append(vote)
        
        # Update team status
        if team.question_status is None:
            team.question_status = {}
        team.question_status["voting"] = "answered"
        flag_modified(team, "question_status")
        
        db.commit()
        
        # Send WebSocket updates
        run_async_in_thread(TeamService._notify_team_status_changed(team_id))
        run_async_in_thread(SurveyService.notify_team_registered(survey.id))
        
        return created_votes
    
    @staticmethod
    def get_team_status(db: Session, team_id: int) -> Dict:
        """
        Get team status and current stage
        """
        team = TeamService.get_team_by_id(db, team_id)
        if not team:
            raise ValueError("Team not found")
        
        survey = db.query(Survey).filter(Survey.id == team.survey_id).first()
        
        status = team.question_status or {}
        
        return {
            "team_id": team.id,
            "team_name": team.name,
            "survey_id": team.survey_id,
            "survey_title": survey.title if survey else None,
            "survey_status": survey.status.value if survey else None,
            "current_stage": survey.current_stage.value if survey else None,
            "question_status": status.get("question", "pending"),
            "voting_status": status.get("voting", "pending")
        }
    
    @staticmethod
    def get_available_answers(db: Session, survey_id: int) -> List[Dict]:
        """
        Get all answers from all teams for voting
        """
        question = db.query(Question).filter(
            and_(
                Question.survey_id == survey_id,
                Question.type == QuestionType.QUESTION
            )
        ).first()
        
        if not question:
            return []
        
        answers = db.query(Answer).filter(Answer.question_id == question.id).all()
        
        return [
            {
                "id": answer.id,
                "content": answer.content,
                "team_name": answer.team.name
            }
            for answer in answers
        ]

