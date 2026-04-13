// Checksum calculation worker
self.onmessage = (e: MessageEvent) => {
  const file = e.data;
  const reader = new FileReader();
  
  reader.onload = (event) => {
    const buffer = event.target?.result as ArrayBuffer;
    if (buffer) {
      const hash = simpleHash(buffer);
      self.postMessage({ checksum: hash });
    }
  };
  
  reader.readAsArrayBuffer(file);
};

function simpleHash(buffer: ArrayBuffer): string {
  const data = new Uint8Array(buffer);
  let hash = 0;
  
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
}
