from pydantic import BaseModel, Field
from typing import Annotated, Any


class State(BaseModel):
    """
    Graph State Schema

    """
    teacher_input: Annotated[Any, Field(description="The input from the teacher")] = ""
    rubric: Annotated[str, Field(description="The rubric for the assignment")] = ""
    evaluation: Annotated[
        str, Field(description="The evaluation of the assignment")
    ] = ""
    feedback: Annotated[str, Field(description="The feedback for the assignment")] = ""
    report: Annotated[
        str, Field(description="The final report including the evaluation and feedback")
    ] = ""
