// Vercel build sırasında ortam değişkenlerini kullanarak config-vercel.js dosyası oluşturur
const fs = require('fs');

// Ortam değişkenlerini kontrol et
const env = process.env;
const openrouterKey = env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
const openrouterModel = env.NEXT_PUBLIC_OPENROUTER_MODEL || '';
const elevenlabsKey1 = env.NEXT_PUBLIC_ELEVENLABS_API_KEY_1 || '';
const elevenlabsKey2 = env.NEXT_PUBLIC_ELEVENLABS_API_KEY_2 || '';
const elevenlabsKey3 = env.NEXT_PUBLIC_ELEVENLABS_API_KEY_3 || '';
const elevenlabsModel = env.NEXT_PUBLIC_ELEVENLABS_MODEL || '';
const elevenlabsVoiceId = env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || '';

// Config dosyası içeriği
const configContent = `
// !! OTOMATİK OLUŞTURULAN DOSYA - VERCEL ORTAM DEĞİŞKENLERİNDEN ÜRETİLMİŞTİR !!
// Bu dosyayı düzenlemeyin, her build'de yeniden oluşturulur

console.log('Vercel ortam değişkenleri yükleniyor...');

// Vercel ortam değişkenleri
window.AppConfig = {
    OPENROUTER_API_KEY: "${openrouterKey}",
    OPENROUTER_MODEL: "${openrouterModel}",
    ELEVENLABS_API_KEYS: [
        "${elevenlabsKey1}",
        "${elevenlabsKey2}",
        "${elevenlabsKey3}"
    ],
    ELEVENLABS_MODEL: "${elevenlabsModel}",
    ELEVENLABS_VOICE_ID: "${elevenlabsVoiceId}"
};

console.log('Vercel ortam değişkenleri yüklendi');
`;

// Dosyayı yaz
fs.writeFileSync('config-vercel.js', configContent);
console.log('config-vercel.js dosyası oluşturuldu');

// Ortam değişkenlerini konsola yazdır (debug için)
console.log('--------- ORTAM DEĞİŞKENLERİ ---------');
console.log('OPENROUTER_API_KEY:', openrouterKey ? 'TANIMLI' : 'TANIMLI DEĞİL');
console.log('OPENROUTER_MODEL:', openrouterModel ? 'TANIMLI' : 'TANIMLI DEĞİL');
console.log('ELEVENLABS_API_KEY_1:', elevenlabsKey1 ? 'TANIMLI' : 'TANIMLI DEĞİL');
console.log('ELEVENLABS_API_KEY_2:', elevenlabsKey2 ? 'TANIMLI' : 'TANIMLI DEĞİL');
console.log('ELEVENLABS_API_KEY_3:', elevenlabsKey3 ? 'TANIMLI' : 'TANIMLI DEĞİL');
console.log('ELEVENLABS_MODEL:', elevenlabsModel ? 'TANIMLI' : 'TANIMLI DEĞİL');
console.log('ELEVENLABS_VOICE_ID:', elevenlabsVoiceId ? 'TANIMLI' : 'TANIMLI DEĞİL');
console.log('-------------------------------------'); 