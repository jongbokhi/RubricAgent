from langchain_core.documents import Document
from .state import State
from abc import ABC, abstractmethod
from .chains import (
    create_input_parser,
    create_rubric_chain,
    create_evaluation_chain,
    create_feedback_chain,
    create_report_chain,
    create_evaluation_router_chain,
)


class BaseNode(ABC):
    def __init__(self, **kwargs):
        self.name = "BaseNode"
        self.verbose = False

        self.verbose = kwargs.get("verbose", False)

    @abstractmethod
    def execute(self, state: State) -> State:
        pass

    def logging(self, method_name, **kwargs):
        if self.verbose:
            print(f"[{self.name}] {method_name}")
            for key, value in kwargs.items():
                print(f"{key}: {value}")

    def __call__(self, state: State):
        return self.execute(state)


class InputParserNode(BaseNode):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = "InputParserNode"
        self.parser_chain = create_input_parser()

    def execute(self, state: State) -> State:
        teacher_input = state.teacher_input
        parsed_input = self.parser_chain.invoke({"teacher_input": teacher_input})
        return {"teacher_input": parsed_input}


class RubricNode(BaseNode):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = "RubricNode"
        self.rubric_chain = create_rubric_chain()

    def execute(self, state: State) -> State:
        topic = state.teacher_input.topic
        objective = state.teacher_input.objective
        grade_Level = state.teacher_input.grade_level

        print("==== [Generating Rubric] ====")
        print(f"Topic: {topic}")
        print(f"Objective: {objective}")
        print(f"Grade Level: {grade_Level}")

        generated_rubric = self.rubric_chain.invoke(
            {"topic": topic, "objective": objective, "grade_level": grade_Level}
        )

        return {"rubric": generated_rubric}


class EvaluationRouterNode(BaseNode):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = "EvaluationRouterNode"
        self.evaluation_router_chain = create_evaluation_router_chain()

    def execute(self, state: State) -> str:
        teacher_input = state.teacher_input
        route_result = self.evaluation_router_chain.invoke(
            {"teacher_input": teacher_input}
        )
        if route_result.binary_score == "yes":
            return "evaluation_generator"
        else:
            return "END"


class EvaluationNode(BaseNode):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = "EvaluationNode"
        self.evaluation_chain = create_evaluation_chain()

    def execute(self, state: State) -> State:
        rubric = state.rubric
        name = state.teacher_input.name
        grade_level = state.teacher_input.grade_level
        student_submission = state.teacher_input.student_submission

        print("==== [Evaluating Submission] ====")
        generated_evaluation = self.evaluation_chain.invoke(
            {
                "rubric": rubric,
                "name": name,
                "grade_level": grade_level,
                "student_submission": student_submission,
            }
        )

        return {"evaluation": generated_evaluation}


class FeedbackNode(BaseNode):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = "FeedbackNode"
        self.feedback_chain = create_feedback_chain()

    def execute(self, state: State) -> State:
        rubric = state.rubric
        evaluation = state.evaluation

        print("==== [Generating Feedback] ====")
        generated_feedback = self.feedback_chain.invoke(
            {"rubric": rubric, "evaluation": evaluation}
        )
        return {"feedback": generated_feedback}


class ReportNode(BaseNode):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = "ReportNode"
        self.report_chain = create_report_chain()

    def execute(self, state: State) -> State:
        name = state.teacher_input.name
        grade_level = state.teacher_input.grade_level
        rubric = state.rubric
        evaluation = state.evaluation
        feedback = state.feedback

        print("==== [Generating Report] ====")
        generated_report = self.report_chain.invoke(
            {
                "name": name,
                "grade_level": grade_level,
                "rubric": rubric,
                "evaluation": evaluation,
                "feedback": feedback,
            }
        )
        return {"report": generated_report}
