from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.survey import Survey, SurveyStatus, SurveyStage
from app.models.team import Team
from app.models.question import Question, QuestionType
from app.models.answer import Answer
from app.models.vote import Vote
from app.services.qr_service import generate_qr_code, generate_invite_code
from app.utils.websocket_manager import websocket_manager, run_async_in_thread
from typing import List, Dict, Optional


class SurveyService:
    @staticmethod
    def create_survey(db: Session, title: str, frontend_url: str) -> Survey:
        """
        Create new survey with invite code and QR code
        """
        invite_code = generate_invite_code()
        
        # Check if code already exists
        while db.query(Survey).filter(Survey.invite_code == invite_code).first():
            invite_code = generate_invite_code()
        
        invite_url = f"{frontend_url}/survey/{invite_code}"
        qr_code_data = generate_qr_code(invite_url)
        
        survey = Survey(
            title=title,
            invite_code=invite_code,
            qr_code_data=qr_code_data,
            status=SurveyStatus.DRAFT,
            current_stage=SurveyStage.QUESTION
        )
        
        db.add(survey)
        db.commit()
        db.refresh(survey)
        
        # Create default questions
        question = Question(
            survey_id=survey.id,
            type=QuestionType.QUESTION,
            content="Какие направления развития и использования средств целевого капитала вы предлагаете?",
            order=1,
            is_active=True
        )
        db.add(question)
        
        voting_question = Question(
            survey_id=survey.id,
            type=QuestionType.VOTING,
            content="Голосование за предложенные варианты",
            order=2,
            is_active=False
        )
        db.add(voting_question)
        
        results_question = Question(
            survey_id=survey.id,
            type=QuestionType.RESULTS,
            content="Результаты опроса",
            order=3,
            is_active=False
        )
        db.add(results_question)
        
        db.commit()
        
        return survey
    
    @staticmethod
    def get_survey_by_id(db: Session, survey_id: int) -> Optional[Survey]:
        """
        Get survey by ID
        """
        return db.query(Survey).filter(Survey.id == survey_id).first()
    
    @staticmethod
    def get_survey_by_invite_code(db: Session, invite_code: str) -> Optional[Survey]:
        """
        Get survey by invite code
        """
        return db.query(Survey).filter(Survey.invite_code == invite_code).first()
    
    @staticmethod
    def start_survey(db: Session, survey_id: int) -> Survey:
        """
        Start survey (change status to ACTIVE)
        """
        survey = SurveyService.get_survey_by_id(db, survey_id)
        if not survey:
            raise ValueError("Survey not found")
        
        survey.status = SurveyStatus.ACTIVE
        db.commit()
        db.refresh(survey)
        
        # Send WebSocket updates
        run_async_in_thread(SurveyService._notify_survey_started(survey_id, survey.invite_code))
        
        return survey
    
    @staticmethod
    async def _notify_survey_started(survey_id: int, invite_code: str):
        """
        Notify WebSocket clients about survey start
        """
        try:
            from app.database import SessionLocal
            db = SessionLocal()
            try:
                status = SurveyService.get_survey_status(db, survey_id)
                # Notify admins
                await websocket_manager.send_to_admins(survey_id, {
                    "type": "survey_status",
                    "data": status
                })
                # Notify teams by invite code
                await websocket_manager.send_to_survey(invite_code, {
                    "type": "survey_info",
                    "data": {
                        "id": survey_id,
                        "status": status["status"],
                        "current_stage": status["current_stage"]
                    }
                })
            finally:
                db.close()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error notifying survey started: {e}")
    
    @staticmethod
    def next_stage(db: Session, survey_id: int) -> Survey:
        """
        Move survey to next stage
        """
        survey = SurveyService.get_survey_by_id(db, survey_id)
        if not survey:
            raise ValueError("Survey not found")
        
        stages = [SurveyStage.QUESTION, SurveyStage.VOTING, SurveyStage.RESULTS]
        current_index = stages.index(survey.current_stage)
        
        if current_index < len(stages) - 1:
            survey.current_stage = stages[current_index + 1]
            
            # Update active question
            for question in survey.questions:
                question.is_active = False
            
            next_question = db.query(Question).filter(
                and_(
                    Question.survey_id == survey_id,
                    Question.type == QuestionType(survey.current_stage.value)
                )
            ).first()
            
            if next_question:
                next_question.is_active = True
            
            db.commit()
            db.refresh(survey)
            
            # Send WebSocket updates
            run_async_in_thread(SurveyService._notify_stage_changed(survey_id, survey.invite_code))
        
        return survey
    
    @staticmethod
    async def _notify_stage_changed(survey_id: int, invite_code: str):
        """
        Notify WebSocket clients about stage change
        """
        try:
            from app.database import SessionLocal
            db = SessionLocal()
            try:
                status = SurveyService.get_survey_status(db, survey_id)
                # Notify admins
                await websocket_manager.send_to_admins(survey_id, {
                    "type": "survey_status",
                    "data": status
                })
                # Notify teams by invite code
                await websocket_manager.send_to_survey(invite_code, {
                    "type": "survey_info",
                    "data": {
                        "id": survey_id,
                        "status": status["status"],
                        "current_stage": status["current_stage"]
                    }
                })
                # Notify all teams individually via team connections
                await SurveyService._notify_all_teams_stage_changed(db, survey_id)
            finally:
                db.close()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error notifying stage changed: {e}")
    
    @staticmethod
    async def _notify_all_teams_stage_changed(db: Session, survey_id: int):
        """
        Notify all teams about stage change via team WebSocket connections
        """
        try:
            # Import here to avoid circular import
            from app.services.team_service import TeamService
            
            teams = db.query(Team).filter(Team.survey_id == survey_id).all()
            for team in teams:
                try:
                    team_status = TeamService.get_team_status(db, team.id)
                    await websocket_manager.send_to_team(team.id, {
                        "type": "team_status",
                        "data": team_status
                    })
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).error(f"Error notifying team {team.id}: {e}")
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error notifying teams: {e}")
    
    @staticmethod
    def get_survey_status(db: Session, survey_id: int) -> Dict:
        """
        Get survey status with teams information
        """
        survey = SurveyService.get_survey_by_id(db, survey_id)
        if not survey:
            raise ValueError("Survey not found")
        
        teams = db.query(Team).filter(Team.survey_id == survey_id).all()
        
        teams_status = []
        for team in teams:
            status = team.question_status or {}
            teams_status.append({
                "id": team.id,
                "name": team.name,
                "joined_at": team.joined_at.isoformat() if team.joined_at else None,
                "question_status": status.get("question", "pending"),
                "voting_status": status.get("voting", "pending")
            })
        
        return {
            "survey_id": survey.id,
            "title": survey.title,
            "status": survey.status.value,
            "current_stage": survey.current_stage.value,
            "teams": teams_status,
            "teams_count": len(teams_status)
        }
    
    @staticmethod
    async def notify_team_registered(survey_id: int):
        """
        Notify admins about new team registration
        """
        try:
            from app.database import SessionLocal
            db = SessionLocal()
            try:
                status = SurveyService.get_survey_status(db, survey_id)
                await websocket_manager.send_to_admins(survey_id, {
                    "type": "survey_status",
                    "data": status
                })
            finally:
                db.close()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Error notifying team registered: {e}")
    
    @staticmethod
    def get_survey_results(db: Session, survey_id: int) -> Dict:
        """
        Get survey results with statistics
        """
        survey = SurveyService.get_survey_by_id(db, survey_id)
        if not survey:
            raise ValueError("Survey not found")
        
        # Get all answers for question stage
        question = db.query(Question).filter(
            and_(
                Question.survey_id == survey_id,
                Question.type == QuestionType.QUESTION
            )
        ).first()
        
        if not question:
            return {"answers": [], "votes": [], "statistics": {}}
        
        answers = db.query(Answer).filter(Answer.question_id == question.id).all()
        
        # Get votes
        votes = db.query(Vote).join(Answer).filter(Answer.question_id == question.id).all()
        
        # Calculate statistics
        answer_votes = {}
        for vote in votes:
            answer_id = vote.answer_id
            if answer_id not in answer_votes:
                answer_votes[answer_id] = []
            answer_votes[answer_id].append(vote.team_id)
        
        total_votes = len(votes)
        
        statistics = []
        for answer in answers:
            vote_count = len(answer_votes.get(answer.id, []))
            percentage = (vote_count / total_votes * 100) if total_votes > 0 else 0
            
            statistics.append({
                "answer_id": answer.id,
                "content": answer.content,
                "team_name": answer.team.name,
                "votes": vote_count,
                "percentage": round(percentage, 2),
                "voted_teams": [db.query(Team).filter(Team.id == tid).first().name for tid in answer_votes.get(answer.id, [])]
            })
        
        # Team votes breakdown
        team_votes = {}
        for vote in votes:
            team_id = vote.team_id
            if team_id not in team_votes:
                team_votes[team_id] = []
            team_votes[team_id].append(vote.answer_id)
        
        teams_voting = []
        for team_id, answer_ids in team_votes.items():
            team = db.query(Team).filter(Team.id == team_id).first()
            if team:
                teams_voting.append({
                    "team_id": team_id,
                    "team_name": team.name,
                    "voted_for": [db.query(Answer).filter(Answer.id == aid).first().content for aid in answer_ids]
                })
        
        return {
            "answers": [{"id": a.id, "content": a.content, "team_name": a.team.name} for a in answers],
            "statistics": statistics,
            "teams_voting": teams_voting,
            "total_votes": total_votes
        }

