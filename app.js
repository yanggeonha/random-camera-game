// 게임 상태
let gameState = {
    targetPersonCount: 0,
    currentShot: 0,
    totalShots: 10,
    successCount: 0,
    capturedPhotos: [],
    isGameRunning: false,
    countdown: 5,
    faceDetectionReady: false
};

// DOM 요소
const selectScreen = document.getElementById('select-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const randomBox = document.getElementById('random-box');
const countdownEl = document.getElementById('countdown');
const currentShotEl = document.getElementById('current-shot');
const statusEl = document.getElementById('status');

let stream = null;
let timerInterval = null;

// 인원 선택
function selectPersonCount(count) {
    gameState.targetPersonCount = count;
    selectScreen.classList.remove('active');
    gameScreen.classList.add('active');
    initCamera();
}

// 카메라 초기화
async function initCamera() {
    try {
        statusEl.textContent = '카메라 시작 중...';

        // 카메라 스트림 시작
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        video.srcObject = stream;

        // 비디오 로드 대기
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        // 캔버스 크기 설정
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;

        statusEl.textContent = '얼굴 인식 모델 로딩 중...';

        // face-api.js 모델 로드
        await loadFaceDetectionModels();

        statusEl.textContent = '게임 시작 준비 완료!';

        // 게임 시작
        setTimeout(() => {
            startGame();
        }, 1000);

    } catch (error) {
        console.error('카메라 초기화 실패:', error);
        alert('카메라를 시작할 수 없습니다. 카메라 권한을 확인해주세요.');
        restart();
    }
}

// Face-API 모델 로드
async function loadFaceDetectionModels() {
    try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

        gameState.faceDetectionReady = true;
        console.log('얼굴 인식 모델 로드 완료');
    } catch (error) {
        console.error('모델 로드 실패:', error);
        gameState.faceDetectionReady = true; // 일단 계속 진행
    }
}

// 게임 시작
function startGame() {
    gameState.isGameRunning = true;
    gameState.currentShot = 0;
    gameState.successCount = 0;
    gameState.capturedPhotos = [];

    nextShot();
}

// 다음 촬영
function nextShot() {
    if (gameState.currentShot >= gameState.totalShots) {
        endGame();
        return;
    }

    gameState.currentShot++;
    currentShotEl.textContent = gameState.currentShot;

    // 랜덤 박스 생성
    createRandomBox();

    // 카운트다운 시작
    startCountdown();
}

// 랜덤 박스 생성
function createRandomBox() {
    const videoWidth = video.offsetWidth;
    const videoHeight = video.offsetHeight;

    // 인원 수에 따라 박스 크기 범위 설정
    let minSizeRatio, maxSizeRatio;

    switch(gameState.targetPersonCount) {
        case 3:
            minSizeRatio = 0.25; // 25%
            maxSizeRatio = 0.45; // 45%
            break;
        case 4:
            minSizeRatio = 0.35; // 35%
            maxSizeRatio = 0.55; // 55%
            break;
        case 5:
            minSizeRatio = 0.45; // 45%
            maxSizeRatio = 0.65; // 65%
            break;
        case 6:
            minSizeRatio = 0.55; // 55%
            maxSizeRatio = 0.75; // 75%
            break;
        case 7:
            minSizeRatio = 0.65; // 65%
            maxSizeRatio = 0.85; // 85%
            break;
        default:
            minSizeRatio = 0.25;
            maxSizeRatio = 0.45;
    }

    const minSize = Math.min(videoWidth, videoHeight) * minSizeRatio;
    const maxSize = Math.min(videoWidth, videoHeight) * maxSizeRatio;
    const boxWidth = Math.random() * (maxSize - minSize) + minSize;
    const boxHeight = boxWidth * (0.8 + Math.random() * 0.4); // 가로세로 비율 약간 다르게

    // 박스 위치 (화면 안에 들어오도록)
    const maxX = videoWidth - boxWidth;
    const maxY = videoHeight - boxHeight;
    const boxX = Math.random() * maxX;
    const boxY = Math.random() * maxY;

    randomBox.style.left = boxX + 'px';
    randomBox.style.top = boxY + 'px';
    randomBox.style.width = boxWidth + 'px';
    randomBox.style.height = boxHeight + 'px';
    randomBox.classList.add('show');

    statusEl.textContent = `박스 안에 ${gameState.targetPersonCount}명의 얼굴을 넣으세요!`;
}

// 카운트다운 시작
function startCountdown() {
    gameState.countdown = 5;
    countdownEl.textContent = gameState.countdown;

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        gameState.countdown--;
        countdownEl.textContent = gameState.countdown;

        if (gameState.countdown <= 0) {
            clearInterval(timerInterval);
            capturePhoto();
        }
    }, 1000);
}

// 사진 촬영 및 얼굴 감지
async function capturePhoto() {
    statusEl.textContent = '촬영 중...';

    // 캔버스에 현재 프레임 캡처
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // 박스 좌표 계산 (비디오 크기 대비)
    const scaleX = video.videoWidth / video.offsetWidth;
    const scaleY = video.videoHeight / video.offsetHeight;

    const boxRect = {
        x: parseFloat(randomBox.style.left) * scaleX,
        y: parseFloat(randomBox.style.top) * scaleY,
        width: parseFloat(randomBox.style.width) * scaleX,
        height: parseFloat(randomBox.style.height) * scaleY
    };

    // 박스 그리기
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    ctx.strokeRect(boxRect.x, boxRect.y, boxRect.width, boxRect.height);

    // 얼굴 감지
    let faceCount = 0;

    if (gameState.faceDetectionReady) {
        try {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

            // 박스 안에 있는 얼굴 수 계산
            detections.forEach(detection => {
                const box = detection.box;
                const faceCenterX = box.x + box.width / 2;
                const faceCenterY = box.y + box.height / 2;

                // 얼굴 중심이 박스 안에 있는지 확인
                if (faceCenterX >= boxRect.x &&
                    faceCenterX <= boxRect.x + boxRect.width &&
                    faceCenterY >= boxRect.y &&
                    faceCenterY <= boxRect.y + boxRect.height) {
                    faceCount++;

                    // 감지된 얼굴 표시
                    ctx.strokeStyle = '#ffff00';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(box.x, box.y, box.width, box.height);
                }
            });
        } catch (error) {
            console.error('얼굴 감지 오류:', error);
        }
    }

    // 성공 여부 판정
    const isSuccess = faceCount === gameState.targetPersonCount;
    if (isSuccess) {
        gameState.successCount++;
    }

    // 결과 텍스트 추가
    ctx.fillStyle = isSuccess ? '#00ff00' : '#ff0000';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(
        `${faceCount}명 감지 - ${isSuccess ? '성공!' : '실패'}`,
        20,
        50
    );

    // 사진 저장
    const photoData = canvas.toDataURL('image/png');
    gameState.capturedPhotos.push({
        data: photoData,
        success: isSuccess,
        faceCount: faceCount,
        shotNumber: gameState.currentShot
    });

    // 박스 숨기기
    randomBox.classList.remove('show');

    statusEl.textContent = isSuccess ? '성공! ✓' : `실패 (${faceCount}명 감지)`;

    // 다음 촬영으로
    setTimeout(() => {
        nextShot();
    }, 1500);
}

// 게임 종료
function endGame() {
    gameState.isGameRunning = false;

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // 결과 화면으로 이동
    showResults();
}

// 결과 표시
function showResults() {
    gameScreen.classList.remove('active');
    resultScreen.classList.add('active');

    const successCountEl = document.getElementById('success-count');
    const resultMessageEl = document.getElementById('result-message');
    const photoGalleryEl = document.getElementById('photo-gallery');

    successCountEl.textContent = gameState.successCount;

    const isMissionSuccess = gameState.successCount >= 3;
    resultMessageEl.textContent = isMissionSuccess ? '🎉 미션 성공! 🎉' : '😢 미션 실패';
    resultMessageEl.className = 'result-message ' + (isMissionSuccess ? 'success' : 'fail');

    // 사진 갤러리 표시
    photoGalleryEl.innerHTML = '';
    gameState.capturedPhotos.forEach((photo, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';

        const img = document.createElement('img');
        img.src = photo.data;
        img.alt = `Shot ${photo.shotNumber}`;

        const label = document.createElement('div');
        label.className = 'photo-label ' + (photo.success ? 'success' : 'fail');
        label.textContent = photo.success ? '✓ 성공' : `✗ ${photo.faceCount}명`;

        photoItem.appendChild(img);
        photoItem.appendChild(label);
        photoGalleryEl.appendChild(photoItem);
    });
}

// 게임 재시작
function restart() {
    resultScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    selectScreen.classList.add('active');

    gameState = {
        targetPersonCount: 0,
        currentShot: 0,
        totalShots: 10,
        successCount: 0,
        capturedPhotos: [],
        isGameRunning: false,
        countdown: 5,
        faceDetectionReady: false
    };
}
