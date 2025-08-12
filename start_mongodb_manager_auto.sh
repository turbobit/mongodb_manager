#!/bin/bash

# MongoDB Manager 자동 재시작 스크립트
# screen을 사용하여 백그라운드에서 계속 실행하고 종료 시 자동 재시작

# 기존 screen 세션이 있다면 종료
screen -S mongodb_manager_auto -X quit 2>/dev/null

# 자동 재시작 함수
restart_app() {
    while true; do
        echo "$(date): MongoDB Manager 시작 중..."
        
        # npm start 실행
        npm run start
        
        # 종료 코드 확인
        exit_code=$?
        echo "$(date): MongoDB Manager 종료됨 (종료 코드: $exit_code)"
        
        # 5초 대기 후 재시작
        echo "$(date): 5초 후 재시작합니다..."
        sleep 5
    done
}

# 새로운 screen 세션 생성 및 자동 재시작 함수 실행
screen -dmS mongodb_manager_auto bash -c "restart_app; exec bash"

echo "MongoDB Manager가 자동 재시작 모드로 시작되었습니다."
echo "세션명: mongodb_manager_auto"
echo ""
echo "사용법:"
echo "  - 세션 확인: screen -ls"
echo "  - 세션 접속: screen -r mongodb_manager_auto"
echo "  - 세션 종료: screen -S mongodb_manager_auto -X quit"
echo "  - 세션에서 나가기 (세션 유지): Ctrl+A, D"
echo "  - 로그 확인: screen -r mongodb_manager_auto" 