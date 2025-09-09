import requests
import json


def test_rubric_api():
    url = "http://localhost:8000/rubric"

    # teacher_input을 문자열로 포맷팅
    teacher_input = """topic: 지구 문제에 우리는 어떻게 대쳐하는가?(환경문제)
objective: 환경 논제 글쓰기
grade_level: 초등학교 6학년
name: 이철수
student_submission: 요즘 뉴스나 학교에서 환경문제에 대해 많이 배우고 있습니다. 지구에는 여러 가지 문제가 생기고 있는데, 그 중에서도 지구 온난화, 쓰레기 문제, 공기 오염이 심각합니다. 이런 문제를 그냥 두면, 우리가 살기 힘든 지구가 될 수 있습니다. 그래서 우리는 작은 일부터 실천해야 합니다. 예를 들어, 분리수거를 잘하기, 물을 아껴 쓰기, 전기를 아껴 쓰기, 일회용품을 덜 쓰기 같은 일이 있습니다. 우리 가족은 장을 볼 때 에코백을 가져가고, 집에서는 텀블러를 사용합니다. 또 저는 친구들과 함께 학교에서 쓰레기 줍기 활동에도 참여했습니다. 이런 작은 실천들이 모이면 지구를 살리는 데 도움이 된다고 생각합니다. 지구는 우리 모두가 함께 살아가는 소중한 집입니다. 앞으로도 환경을 생각하며 행동하는 사람이 되고 싶습니다."""

    payload = {"teacher_input": teacher_input, "thread_id": "1234567890"}

    headers = {"Content-Type": "application/json"}

    try:
        print("루브릭 생성 API 테스트 시작...")
        print("=" * 50)
        print("전송할 데이터:")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        print("=" * 50)

        response = requests.post(url, json=payload, headers=headers)

        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print("=" * 50)
        print("Response Body:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    except requests.exceptions.RequestException as e:
        print(f"API 요청 중 오류 발생: {e}")
    except json.JSONDecodeError as e:
        print(f"JSON 파싱 오류: {e}")
        print(f"Raw response: {response.text}")


if __name__ == "__main__":
    test_rubric_api()
