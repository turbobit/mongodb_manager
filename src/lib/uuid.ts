/**
 * UUID v7 생성 함수
 * RFC 9562에 따른 UUID v7 표준을 구현합니다.
 * 
 * UUID v7 구조:
 * - 48비트 타임스탬프 (밀리초 단위)
 * - 4비트 버전 (7)
 * - 12비트 랜덤 또는 시퀀스
 * - 2비트 변형
 * - 62비트 랜덤
 */
export function generateUUIDv7(): string {
  const now = Date.now();
  
  // 48비트 타임스탬프 (밀리초 단위)
  const timestamp = BigInt(now);
  
  // 랜덤 값 생성
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  
  // UUID v7 구성
  const timeHigh = Number((timestamp >> BigInt(16)) & BigInt(0xFFFF));
  const timeMid = Number((timestamp >> BigInt(32)) & BigInt(0xFFFF));
  const timeLow = Number(timestamp & BigInt(0xFFFF));
  
  // 버전 7 (4비트) + 랜덤 (12비트)
  const versionAndRandom = (0x7 << 12) | (randomBytes[0] << 4) | (randomBytes[1] >> 4);
  
  // 변형 (2비트) + 랜덤 (14비트)
  const variantAndRandom = (0x2 << 14) | ((randomBytes[1] & 0x0F) << 10) | (randomBytes[2] << 2) | (randomBytes[3] >> 6);
  
  // 나머지 랜덤 값들
  const random1 = ((randomBytes[3] & 0x3F) << 8) | randomBytes[4];
  const random2 = (randomBytes[5] << 8) | randomBytes[6];
  const random3 = (randomBytes[7] << 8) | randomBytes[8];
  const random4 = (randomBytes[9] << 8) | randomBytes[10];
  
  // UUID 형식으로 조합
  return [
    timeLow.toString(16).padStart(8, '0'),
    timeMid.toString(16).padStart(4, '0'),
    versionAndRandom.toString(16).padStart(4, '0'),
    variantAndRandom.toString(16).padStart(4, '0'),
    random1.toString(16).padStart(4, '0'),
    random2.toString(16).padStart(4, '0'),
    random3.toString(16).padStart(4, '0'),
    random4.toString(16).padStart(4, '0')
  ].join('-');
}

/**
 * 간단한 UUID v7 생성 (더 짧은 형식)
 * 타임스탬프 + 랜덤으로 구성된 짧은 식별자
 */
export function generateShortUUIDv7(): string {
  const now = Date.now();
  const timestamp = now.toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
} 