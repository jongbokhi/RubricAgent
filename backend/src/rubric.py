from dotenv import load_dotenv

load_dotenv()
import asyncio

from .state import State
from .nodes import *
from .chains import *

from langgraph.graph import END, StateGraph, START
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.runnables import RunnableConfig

workflow = StateGraph(State)

workflow.add_node("input_parser", InputParserNode())
workflow.add_node("rubric_generator", RubricNode())
workflow.add_node("evaluation_generator", EvaluationNode())
workflow.add_node("feedback_generator", FeedbackNode())
workflow.add_node("report_generator", ReportNode())

workflow.add_edge(START, "input_parser")
workflow.add_edge("input_parser", "rubric_generator")

workflow.add_conditional_edges(
    source="rubric_generator",
    path=EvaluationRouterNode(),
    path_map={"evaluation_generator": "evaluation_generator", "END": END},
)

workflow.add_edge("evaluation_generator", "feedback_generator")
workflow.add_edge("feedback_generator", "report_generator")

workflow.add_edge("report_generator", END)


memory_saver = MemorySaver()
app = workflow.compile(checkpointer=memory_saver)



async def response(teacher_input: str, thread_id: str) -> State:

    config = RunnableConfig(
        recursion_limit=10,
        configurable={"thread_id": thread_id},
    )

    inputs = {"teacher_input": teacher_input}
    
    results = app.invoke(inputs, config=config)

    return results


# async def generate_rubric(teacher_input: str, thread_id: str):
#     return await response(teacher_input, thread_id)
