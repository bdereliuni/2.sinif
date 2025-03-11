/**
 * API Anahtarları Yapılandırma Dosyası - ÖRNEK
 * Kullanım: Bu dosyayı 'config.js' olarak kopyalayın ve API anahtarlarınızı ekleyin.
 */

// Bu değişkenlerin değerleri Vercel ortam değişkenlerinden gelecek
window.AppConfig = {
    OPENROUTER_API_KEY: "",  // Vercel'de NEXT_PUBLIC_OPENROUTER_API_KEY olarak tanımlayın
    OPENROUTER_MODEL: "",    // Vercel'de NEXT_PUBLIC_OPENROUTER_MODEL olarak tanımlayın
    ELEVENLABS_API_KEYS: [   // Vercel'de NEXT_PUBLIC_ELEVENLABS_API_KEY_1, _2, _3 olarak tanımlayın
        "", 
        "", 
        ""
    ],
    ELEVENLABS_MODEL: "",    // Vercel'de NEXT_PUBLIC_ELEVENLABS_MODEL olarak tanımlayın
    ELEVENLABS_VOICE_ID: ""  // Vercel'de NEXT_PUBLIC_ELEVENLABS_VOICE_ID olarak tanımlayın
}; 