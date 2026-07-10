# 질문 나눔 카드

모임에서 서로를 알아가는 대화를 돕는 질문 카드 뽑기 웹사이트.
한 화면(폰/노트북)을 같이 보며 카드를 뽑고, 뒤집어 질문을 확인하고, 스피너로 답할 사람을 뽑습니다.

**▶ 바로 사용: https://userb2.github.io/question-cards/** (이전 UI: [classic](https://userb2.github.io/question-cards/classic/))

## 기능

- **테마 9종 × 유형 5종 × 깊이 3단계** 필터 (모두 다중 선택, AND 결합)
- **카드 덱 UI**: 더미 탭 → 뒷면 확인 → 탭하면 3D 플립으로 질문 공개 → 스와이프로 버리기
- **뽑은 카드 제외** 토글: 뽑은 카드는 풀에서 제외 (localStorage로 다음 모임에도 유지)
- **롤콜 + 스피너**: 참석자를 등록하면 스핀으로 답할 사람 선정 (공정 모드: 전원이 한 번씩 걸릴 때까지 중복 없음)

## 질문 관리

질문은 전부 `questions.json` 한 파일에 있습니다. 항목을 추가/수정/삭제한 뒤 push하면 끝.

```json
{ "id": 1, "text": "질문 내용", "theme": "취향 저격", "type": "일반 질문", "depth": 1, "source": "창작" }
```

검증: `node test/validate-questions.cjs` · 로직 테스트: `node --test test/`

## 로컬 실행

```bash
python -m http.server 8123   # 이후 http://localhost:8123 접속
```
