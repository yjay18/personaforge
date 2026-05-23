"""GET /api/personas — return metadata for all available personas."""

from fastapi import APIRouter

from ..services.personas import list_personas

router = APIRouter()


@router.get("")
def get_personas():
    return {"personas": list_personas()}
