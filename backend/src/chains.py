from pydantic import BaseModel, Field
from typing import Optional, Literal

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI


class InputParser(BaseModel):
    grade_level: int = Field(..., description="School grade level")
    topic: str = Field(
        ...,
        description="Detailed tasks (e.g., essay writing, graph interpretation, etc.)",
    )
    objective: str = Field(
        ...,
        description="Assessment purpose (e.g., essay writing, graph interpretation, etc.)",
    )
    name: Optional[str] = Field(..., description="Student name")
    student_submission: Optional[str] = Field(..., description="Submitted assignment")


def create_input_parser():
    llm = ChatOpenAI(model="gpt-4.1-mini", temperature=0)
    structured_llm_parser = llm.with_structured_output(InputParser)

    system = "You are a helpful assistant that parses the input from the teacher and returns a structured output."
    parser_prompt = ChatPromptTemplate.from_messages(
        [("system", system), ("human", "{teacher_input}")]
    )

    parser_chain = parser_prompt | structured_llm_parser

    return parser_chain


def create_rubric_chain(model_name="gpt-4.1-mini", model_type="openai"):
    """Create a chain that generates rubrics.

    Parameters
    ----------
    model_name : str
        Identifier of the language model to use. Defaults to ``"gpt-4.1-mini"``.
    model_type : str, optional
        Provider of the model, either ``"openai"`` or ``"gemini"``. Defaults to
        ``"openai"``.

    Returns
    -------
    Runnable
        LangChain runnable that produces a rubric in markdown format.
    """

    # LLM 준비
    if model_type == "gemini":
        llm = ChatGoogleGenerativeAI(model=model_name, temperature=0)
    else:
        llm = ChatOpenAI(model=model_name, temperature=0)

    system = """You are an expert in educational assessment and rubric design in Korean.  
    Your role is to design rubrics for evaluating assignments in elementary, middle, and high schools.  

    Rules:
    1. You must reflect the provided topic, objective and grade level.  
    2. The rubric must consist of 3 ~ 6 criteria.  
    3. Avoid vague or speculative expressions such as “worked hard” or “tried their best.”  
    4. Provide simple evidence_anchors (observation points) to guide teachers on what to look for in student work.  
    5. Do not make assumptions about student background or personal information.  
    6. Use language that is age-appropriate for the student's grade level, and free of bias or discriminatory expressions.
    7. Keep the rubric in Korean and make it in a table format for better readability.
    """

    rubric_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            (
                "human",
                "Generate a detailed rubric in markdown format for the following information:\n"
                "topic: {topic}\n"
                "objective: {objective}\n"
                "grade Level: {grade_level}\n"
                "Provide criteria, levels, and sample answers.",
            ),
        ]
    )

    # define Rubric chain
    rubric_generator = rubric_prompt | llm | StrOutputParser()
    return rubric_generator


### Evaluation Router Chain ###
class RouteQuery(BaseModel):
    """Router for routing a student's evaluation."""

    binary_score: Literal["yes", "no"] = Field(
        ...,
        description="Given a teacher's input, determine if it needs to be evaluated  or not. Return 'yes' if it needs to be evaluated, otherwise return 'no'",
    )


def create_evaluation_router_chain():
    # Initialize LLM
    llm = ChatOpenAI(model="gpt-4.1-mini", temperature=0)
    structured_llm_router = llm.with_structured_output(RouteQuery)

    # Set System Prompt
    system = """Your task is to decide whether a student's evaluation is required.  
            - If the teacher input contains a student submission, answer "yes".  
            - If there is no student submission, answer "no".  
            - If there is a student submission but the teacher does not request an evaluation, answer "no".
            """

    # Create Prompt Template
    route_prompt = ChatPromptTemplate.from_messages(
        [("system", system), ("human", "Here is the teacher's input: {teacher_input}")]
    )

    # Create Question Router Chain
    question_router = route_prompt | structured_llm_router

    return question_router


def create_evaluation_chain(model_name="gpt-4.1-mini", model_type="openai"):
    """Create a chain that generates rubrics.

    Parameters
    ----------
    model_name : str
        Identifier of the language model to use. Defaults to ``"gpt-4.1-mini"``.
    model_type : str, optional
        Provider of the model, either ``"openai"`` or ``"gemini"``. Defaults to
        ``"openai"``.

    Returns
    -------
    Runnable
        LangChain runnable that produces a evaluation in markdown format.
    """

    # LLM 준비
    if model_type == "gemini":
        llm = ChatGoogleGenerativeAI(model=model_name, temperature=0)
    else:
        llm = ChatOpenAI(model=model_name, temperature=0)

    # PromptTemplate
    system = """You are an expert in educational assessment and rubric design in Korean.
    You are given a rubric and a student's submission.
    You need to evaluate the student's submission based on the provided rubric.
    You need to evaluate each item in the rubric.
    You shouldn't use any other information than the rubric and the student's submission.
    Keep the evaluation in Korean and make it in a table format for better readability.
    """

    rubric_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            (
                "human",
                "Generate a evaluation in markdown format for the following information:\n"
                "rubric: {rubric}\n"
                "name: {name}\n"
                "grade level: {grade_level}\n"
                "student submission: {student_submission}\n"
                "Provide criteria, levels, and sample answers.",
            ),
        ]
    )

    # define Rubric chain
    rubric_generator = rubric_prompt | llm | StrOutputParser()
    return rubric_generator


def create_feedback_chain(model_name="gpt-4.1-mini", model_type="openai"):
    """Create a chain that generates feedback.

    Parameters
    ----------
    model_name : str
        Identifier of the language model to use. Defaults to ``"gpt-4.1-mini"``.
    model_type : str, optional
        Provider of the model, either ``"openai"`` or ``"gemini"``. Defaults to
        ``"openai"``.

    Returns
    -------
    Runnable
        LangChain runnable that produces a feedback in markdown format.
    """

    # LLM 준비
    if model_type == "gemini":
        llm = ChatGoogleGenerativeAI(model=model_name, temperature=0)
    else:
        llm = ChatOpenAI(model=model_name, temperature=0)

    # PromptTemplate
    system = """You are an expert in educational feedback in Korean.
    You are given a student's submission, rubric and an evaluation.
    You need to generate a feedback for the student's submission based on the provided rubric and evaluation.
    You shouldn't use any other information than the rubric, evaluation and the student's submission.
    Keep the feedback in Korean and make it in a table format for better readability.
    """

    feedback_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            (
                "human",
                "Generate a feedback in markdown format for the following information:\n"
                "rubric: {rubric}\n"
                "evaluation: {evaluation}\n",
            ),
        ]
    )

    feedback_generator = feedback_prompt | llm | StrOutputParser()
    return feedback_generator


def create_report_chain(model_name="gpt-4.1-mini", model_type="openai"):
    """Create a chain that generates a report.

    Parameters
     ----------
     model_name : str
         Identifier of the language model to use. Defaults to ``"gpt-4.1-mini"``.
     model_type : str, optional
         Provider of the model, either ``"openai"`` or ``"gemini"``. Defaults to
         ``"openai"``.

     Returns
     -------
     Runnable
         LangChain runnable that produces a report in markdown format.
    """

    # LLM 준비
    if model_type == "gemini":
        llm = ChatGoogleGenerativeAI(model=model_name, temperature=0)
    else:
        llm = ChatOpenAI(model=model_name, temperature=0)

    # PromptTemplate
    system = """You are an expert in educational reporting in Korean.
        You are given a rubric, an evaluation, and feedback.
        Your task is to generate a comprehensive report for the student's submission.

        Rules:
        1. Use only the provided rubric, evaluation, and feedback. Do not invent or assume additional information.
        2. The report must be written in Korean.
        3. Present the report in a clear table format for readability.
        - Include one row per rubric criterion, showing: [Criterion Name | Level & Score | Evidence | Feedback Summary].
        - Add a final row/section for [Total Score & Overall Feedback].
        4. After the table, provide two short summaries:
        - For the teacher: concise, objective analysis of performance.
        - For the student: encouraging and specific guidance (Glow, Grow, Next Steps).
        5. Keep language age-appropriate and free from bias or speculation.

    """

    report_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            (
                "human",
                "Generate a report in markdown format for the following information:\n"
                "name: {name}\n"
                "grade level: {grade_level}\n"
                "rubric: {rubric}\n"
                "evaluation: {evaluation}\n"
                "feedback: {feedback}\n",
            ),
        ]
    )

    report_chain = report_prompt | llm | StrOutputParser()
    return report_chain
