# 랜덤 카메라 게임

## 핸드폰에서 실행하는 방법

### 방법 1: 로컬 서버 사용 (추천)

1. 이 폴더에서 터미널을 열고 아래 명령어 실행:

```bash
# Python이 설치되어 있다면
python -m http.server 8000

# 또는 Node.js가 설치되어 있다면
npx http-server -p 8000
```

2. 컴퓨터의 IP 주소 확인:
   - Windows: `ipconfig` 실행 후 IPv4 주소 확인
   - Mac/Linux: `ifconfig` 또는 `ip addr` 실행

3. 핸드폰에서 브라우저를 열고 접속:
   - 주소: `http://[컴퓨터IP주소]:8000`
   - 예: `http://192.168.0.10:8000`

4. 카메라 권한 허용하고 게임 시작!

**참고**: 컴퓨터와 핸드폰이 같은 Wi-Fi에 연결되어 있어야 합니다.

### 방법 2: GitHub Pages로 배포 (영구적)

1. GitHub 저장소 생성
2. 파일 업로드
3. Settings > Pages에서 배포
4. 생성된 URL로 접속

### 방법 3: Netlify Drop 사용 (가장 쉬움)

1. https://app.netlify.com/drop 접속
2. 이 폴더를 드래그 앤 드롭
3. 생성된 URL을 핸드폰에서 접속
