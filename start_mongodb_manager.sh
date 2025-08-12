#!/bin/bash

# MongoDB Manager 시작 스크립트
# screen을 사용하여 백그라운드에서 계속 실행

# 기존 screen 세션이 있다면 종료
screen -S mongodb_manager -X quit 2>/dev/null

# 새로운 screen 세션 생성 및 npm start 실행
screen -dmS mongodb_manager bash -c "npm run start; exec bash"

echo "MongoDB Manager가 screen 세션 'mongodb_manager'에서 시작되었습니다."
echo ""
echo "사용법:"
echo "  - 세션 확인: screen -ls"
echo "  - 세션 접속: screen -r mongodb_manager"
echo "  - 세션 종료: screen -S mongodb_manager -X quit"
echo "  - 세션에서 나가기 (세션 유지): Ctrl+A, D" 