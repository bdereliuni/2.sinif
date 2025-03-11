// API anahtarı ve model bilgisi - OpenRouter
const OPENROUTER_API_KEY = window.AppConfig?.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = window.AppConfig?.OPENROUTER_MODEL || "google/gemini-2.0-flash-lite-preview-02-05:free";

// API anahtarları ve model bilgisi - ElevenLabs
const ELEVENLABS_API_KEYS = window.AppConfig?.ELEVENLABS_API_KEYS || [];
const ELEVENLABS_MODEL = window.AppConfig?.ELEVENLABS_MODEL || "eleven_flash_v2_5";
// Hızlı yanıt veren Türkçe uyumlu ses
const ELEVENLABS_VOICE_ID = window.AppConfig?.ELEVENLABS_VOICE_ID || "9BWtsMINqrJLrRacOk9x";

// Cesaretlendirici ifadeler listesi
const ENCOURAGEMENT_PHRASES = [
    "Üzülme, denemeye devam et!",
    "Hata yapmak öğrenmenin bir parçası!",
    "Sorun değil, bir dahaki sefere!",
    "Merak etme, hepimiz hata yaparız!",
    "Bu sefer olmadı, ama pes etme!",
    "Yanlış cevaplar da öğreticidir!",
    "Endişelenme, bir sonraki soruda başaracaksın!",
    "Hiç problem değil, yeni şeyler öğreniyoruz!",
    "Kendine güven, bir dahaki sefere doğru yapabilirsin!",
    "Hepimiz bazen hata yaparız, önemli olan denemek!"
];

// Kutlama ifadeleri listesi
const CELEBRATION_PHRASES = [
    "Harikasın!",
    "Süpersin!",
    "Çok iyi!",
    "Mükemmel!",
    "Aferin sana!",
    "Bravo!",
    "Tebrikler!",
    "Muhteşemsin!",
    "Doğru bildin!",
    "Harika iş çıkardın!"
];

/**
 * Matematiksel ifadeleri ve sembolleri sesli okumaya uygun hale getirir
 * @param {string} text - Seslendirilecek metin
 * @returns {string} - Düzeltilmiş metin
 */
function prepareTextForSpeech(text) {
    if (!text) return text;
    
    let processedText = text;
    
    // Metin içindeki işlemleri TTS'in doğru okuması için düzenle
    
    // Çarpma işlemlerini düzelt (önce çarpma işlemlerini ele al)
    
    // "×" özel çarpma işaretini "çarpı" olarak değiştir
    processedText = processedText.replace(/(\d+)\s*×\s*(\d+)/g, "$1 çarpı $2");
    
    // "6x3", "6 x 3", "6X3" gibi ifadeleri düzelt 
    processedText = processedText.replace(/(\d+)\s*[xX]\s*(\d+)/g, "$1 çarpı $2");
    
    // Metin içindeki tek "x" veya "X" karakterlerini düzelt (işlem olarak kullanılanlar)
    processedText = processedText.replace(/\b([0-9]+)\s+x\b/gi, "$1 çarpı");
    processedText = processedText.replace(/\bx\s+([0-9]+)\b/gi, "çarpı $1");
    
    // "kutu x" veya "x elma" gibi ifadelerin "çarpı" olarak okunmasını sağla
    processedText = processedText.replace(/(\w+)\s+x\s+(\w+)/gi, "$1 çarpı $2");
    
    // Formülde tek başına duran x'leri düzelt
    processedText = processedText.replace(/(\s|^)x(\s|$)/gi, "$1çarpı$2");
    
    // Toplama işlemlerini düzelt
    // "3 + 3" gibi ifadeleri "3 artı 3" olarak değiştir
    processedText = processedText.replace(/(\d+)\s*\+\s*(\d+)/g, "$1 artı $2");
    
    // "3 + 3 + 3" gibi çoklu toplama işlemlerini düzelt
    processedText = processedText.replace(/(\d+)(\s*\+\s*\d+)+/g, (match) => {
        return match.replace(/\+/g, " artı ");
    });
    
    // Çıkarma işlemlerini düzelt
    // "3-4" veya "3 - 4" gibi çıkarma işlemlerini düzelt
    processedText = processedText.replace(/(\d+)\s*-\s*(\d+)/g, "$1 eksi $2");
    
    // Bölme işlemlerini düzelt
    // "3÷4" veya "3 ÷ 4" veya "3/4" gibi bölme işlemlerini düzelt
    processedText = processedText.replace(/(\d+)\s*[\/÷]\s*(\d+)/g, "$1 bölü $2");
    
    // Eşitlik ve karşılaştırma ifadelerini düzelt
    // Tüm "=" işaretlerini düzelt (sayılar arasında olmasa bile)
    processedText = processedText.replace(/=/g, " eşittir ");
    
    // Sayılar arasındaki eşittir ifadelerini düzelt (önce yapmak önemli, genel değişimden sonra çift eşittir olabilir)
    processedText = processedText.replace(/(\d+)\s*eşittir\s*eşittir\s*(\d+)/g, "$1 eşittir $2");
    
    // "3>" veya "3 > 4" gibi büyüktür ifadelerini düzelt
    processedText = processedText.replace(/(\d+)\s*>\s*(\d+)/g, "$1 büyüktür $2");
    
    // "3<4" veya "3 < 4" gibi küçüktür ifadelerini düzelt
    processedText = processedText.replace(/(\d+)\s*<\s*(\d+)/g, "$1 küçüktür $2");
    
    // Üs ifadelerini düzelt
    // "2²" veya "2^2" gibi üs ifadelerini düzelt
    processedText = processedText.replace(/(\d+)(\^|\²|\³)(\d+)?/g, (match, base, exp, power) => {
        if (exp === "²") return `${base} üssü 2`;
        if (exp === "³") return `${base} üssü 3`;
        return `${base} üssü ${power || ""}`;
    });
    
    // Parantez ifadelerini düzelt - TTS'in daha iyi okuması için araya boşluk ekle
    processedText = processedText.replace(/\(/g, " ( ");
    processedText = processedText.replace(/\)/g, " ) ");
    
    // Birden fazla boşluğu tek boşluğa dönüştür
    processedText = processedText.replace(/\s+/g, " ");
    
    return processedText;
}

/**
 * Yanıt metnini mantıksal tutarlılık açısından kontrol eder
 * @param {string} text - Kontrol edilecek metin
 * @param {object} questionData - Soru verisi
 * @param {string} selectedAnswer - Kullanıcının seçtiği şık
 * @param {boolean} isCorrect - Cevabın doğru olup olmadığı
 * @returns {string} - Düzeltilmiş yanıt
 */
function checkAnswerConsistency(text, questionData, selectedAnswer, isCorrect) {
    if (!text || isCorrect) return text;
    
    // İlk olarak tam metin eşleşmelerini kontrol et
    const originalText = text;
    
    // Soru tiplerini temel matematiksel işlemlere göre sınıflandır
    const hasMultiplication = questionData.question && 
        (questionData.question.includes(" x ") || 
        questionData.question.includes(" çarpı ") || 
        questionData.question.includes(" tane ") || 
        questionData.question.includes(" adet ") || 
        questionData.question.includes(" paket ") ||
        questionData.question.includes(" kutu ") ||
        questionData.question.includes(" kaç tane ") ||
        questionData.question.includes(" toplam "));
    
    // Fiyat çarpımı sorularını kontrol et (birim fiyat x miktar)
    const isPriceMultiplication = hasMultiplication && 
        questionData.question.includes("TL") &&
        questionData.question.match(/\d+\s*TL/);
    
    // "Bir sırada 5 öğrenci oturuyor. Sınıfta 4 sıra vardır. Sınıfta toplam kaç öğrenci vardır?" sorusu için özel düzeltmeler
    const isStudentRowQuestion = questionData.question && 
        questionData.question.includes("sırada") && 
        questionData.question.includes("öğrenci") && 
        questionData.question.includes("sıra") && 
        questionData.question.includes("toplam");
    
    // Sayıları tespit etmeye çalış
    const numbers = questionData.question.match(/\d+/g) || [];
    const firstNumber = numbers.length > 0 ? numbers[0] : null;
    const secondNumber = numbers.length > 1 ? numbers[1] : null;
    
    // Çelişkili çarpma/toplama ifadeleri içeren açıklamaları düzelt
    if (text.includes("çarpma yapmıyoruz") && text.includes("çarpma") && hasMultiplication) {
        // İlk cümleyi koru, geri kalanını yeniden yaz
        const firstSentence = text.split("!")[0] + "!";
        
        if (isStudentRowQuestion) {
            return `${firstSentence} Bu soruda toplam öğrenci sayısını bulmak için sıradaki öğrenci sayısı ile sıra sayısını çarpmalıyız. Doğru cevap ${questionData.answer} şıkkı, çünkü ${firstNumber || "..."} x ${secondNumber || "..."} = ${questionData.answer.match(/\d+/)[0] || "..."} öğrenci.`;
        }
        
        if (isPriceMultiplication) {
            return `${firstSentence} Bu soruda toplam fiyatı bulmak için birim fiyat ile miktar çarpılır. Doğru cevap ${questionData.answer} şıkkı, çünkü ${firstNumber || "..."} x ${secondNumber || "..."} = ${questionData.answer.match(/\d+/)[0] || "..."} TL.`;
        }
        
        return `${firstSentence} Bu soruda doğru matematiksel işlem çarpmadır. ${selectedAnswer} şıkkı yanlış, doğru cevap ${questionData.answer} şıkkıdır.`;
    }
    
    // "X ile Y'yi çarpmak" ifadesinde sayıların çarpımının doğru şıkla eşleşip eşleşmediğini kontrol et
    const multiplicationPattern = /(\d+)[\s]*[xX][\s]*(\d+)[\s]*=[\s]*(\d+)/;
    const multiplicationMatch = text.match(multiplicationPattern);
    
    if (multiplicationMatch) {
        const [, factor1, factor2, product] = multiplicationMatch;
        const correctProduct = parseInt(factor1) * parseInt(factor2);
        
        // Çarpım sonucu yanlışsa düzelt
        if (parseInt(product) !== correctProduct) {
            // İlk cümleyi koru, geri kalanını yeniden yaz
            const firstSentence = text.split("!")[0] + "!";
            return `${firstSentence} Doğru cevap ${questionData.answer} şıkkı, çünkü ${factor1} x ${factor2} = ${correctProduct} ${text.includes("TL") ? "TL" : ""}.`;
        }
    }
    
    // Çarpmanın gerektiği sorularda toplama yapıldığını belirten hatalı açıklamaları düzelt
    if (hasMultiplication && text.includes("topla") && !text.includes("çarp")) {
        // İlk cümleyi koru, geri kalanını yeniden yaz
        const firstSentence = text.split("!")[0] + "!";
        
        if (isPriceMultiplication) {
            return `${firstSentence} Bu soruda toplam ödemeyi bulmak için birim fiyat ile miktarı çarpmalıyız. Doğru cevap ${questionData.answer} şıkkı, çünkü ${firstNumber || "..."} TL x ${secondNumber || "..."} = ${questionData.answer.match(/\d+/)[0] || "..."} TL.`;
        }
        
        return `${firstSentence} Bu soruda toplama değil çarpma işlemi yapmalıyız. Doğru cevap ${questionData.answer} şıkkı, çünkü ${firstNumber || "..."} x ${secondNumber || "..."} = ${questionData.answer.match(/\d+/)[0] || "..."}.`;
    }
    
    // D şıkkı (25 öğrenci) için özel düzeltme
    if (isStudentRowQuestion && selectedAnswer === "D") {
        // Çelişkili çarpma/toplama ifadeleri içeren açıklamaları düzelt
        if (text.includes("çarpma yapmıyoruz") && text.includes("çarpma işlemidir")) {
            return `${text.split("!")[0]}! D şıkkı (25 öğrenci) yanlış. Doğru cevap A şıkkı (20 öğrenci), çünkü her sırada 5 öğrenci ve 4 sıra olduğunda 5 x 4 = 20 öğrenci eder.`;
        }
        
        // "5 ile 5'i çarpmak" gibi yanlış ifadeleri düzelt
        if (text.includes("5 ile 5'i çarp")) {
            return `${text.split("!")[0]}! D şıkkı (25 öğrenci) yanlış. Bu sayıya nasıl ulaştığını bilmiyorum ama doğru cevap A şıkkı (20 öğrenci), çünkü her sırada 5 öğrenci ve 4 sıra olduğunda 5 x 4 = 20 öğrenci eder.`;
        }
        
        // Toplamakla ilgili yanlış açıklamaları düzelt
        if (text.includes("topladığın için")) {
            return `${text.split("!")[0]}! D şıkkı (25 öğrenci) yanlış. Doğru cevap A şıkkı (20 öğrenci), çünkü her sırada 5 öğrenci ve 4 sıra olduğunda 5 x 4 = 20 öğrenci eder.`;
        }
    }
    
    // Genel çelişkili matematiksel ifadeleri kontrol et
    
    // 1. Aynı metinde hem "çarpma yapmıyoruz" hem de "çarpma işlemidir" ifadeleri varsa düzelt
    if (text.includes("çarpma yapmıyoruz") && text.includes("çarpma işlemidir")) {
        // İlk cümleyi koru, geri kalanını yeniden yaz
        const firstSentence = text.split("!")[0] + "!";
        return `${firstSentence} ${selectedAnswer} şıkkı yanlış. Doğru cevap ${questionData.answer} şıkkı, burada doğru matematiksel işlemi yapmalıyız.`;
    }
    
    // 2. "X ile Y'yi çarpmak" ifadesinde X ve Y sayılarının problemle uyumsuz olduğu durumları düzelt
    const numberPattern = /(\d+) ile (\d+)'[iıüu] çarp/;
    const numberMatch = text.match(numberPattern);
    
    if (numberMatch && (isStudentRowQuestion || isPriceMultiplication) && numbers.length >= 2) {
        const [, num1, num2] = numberMatch;
        // Eğer sayılar problemdeki sayılardan farklıysa
        if (!((num1 === numbers[0] && num2 === numbers[1]) || (num1 === numbers[1] && num2 === numbers[0]))) {
            // İlk cümleyi koru, geri kalanını yeniden yaz
            const firstSentence = text.split("!")[0] + "!";
            if (isPriceMultiplication) {
                return `${firstSentence} Problemdeki doğru işlem ${numbers[0]} TL x ${numbers[1]} = ${parseInt(numbers[0]) * parseInt(numbers[1])} TL şeklinde çarpma işlemidir. ${selectedAnswer} şıkkı yanlış, doğru cevap ${questionData.answer} şıkkıdır.`;
            } else {
                return `${firstSentence} Problemdeki doğru işlem ${numbers[0]} x ${numbers[1]} = ${parseInt(numbers[0]) * parseInt(numbers[1])} şeklinde çarpma işlemidir. ${selectedAnswer} şıkkı yanlış, doğru cevap ${questionData.answer} şıkkıdır.`;
            }
        }
    }
    
    // Eğer hiçbir spesifik düzeltme yapılmadıysa orijinal metni geri döndür
    return originalText;
}

/**
 * 2. sınıf öğrencisine yönelik kısa, sade ve kesin açıklama üretmek için Gemini modeline istek yapar.
 * @param {object} questionData - Soru verisi
 * @param {string} selectedAnswer - Kullanıcının seçtiği şık (A, B, C, D)
 * @param {boolean} isCorrect - Cevabın doğru olup olmadığı
 * @returns {Promise<string>} - AI tarafından oluşturulan açıklama
 */
async function getQuestionExplanation(questionData, selectedAnswer, isCorrect) {
    try {
        // Seçenekleri tek bir stringde birleştir
        const optionsText = (questionData.options || []).map((option, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D...
            return `${letter}) ${option}`;
        }).join("\n");

        // Rastgele cesaretlendirici veya kutlama ifadesi seç
        const randomEncouragement = ENCOURAGEMENT_PHRASES[Math.floor(Math.random() * ENCOURAGEMENT_PHRASES.length)];
        const randomCelebration = CELEBRATION_PHRASES[Math.floor(Math.random() * CELEBRATION_PHRASES.length)];

        // Soruda matematiksel işlem türünü tespit et
        const hasMathematicalOperation = questionData.question && (
            questionData.question.includes("toplam") || 
            questionData.question.includes("çarp") || 
            questionData.question.includes("böl") || 
            questionData.question.includes("çıkar") || 
            questionData.question.includes("ekle") || 
            questionData.question.includes("kaç") || 
            questionData.question.includes("TL") || 
            questionData.question.includes(" tane") ||
            questionData.question.includes(" gün") ||
            questionData.question.includes(" adet") ||
            questionData.question.includes(" paket")
        );

        // Soruda çoklu işlem (çarpma) gerektiren desenleri kontrol et
        const isMultiplication = questionData.question && (
            // Fiyat × miktar deseni
            (questionData.question.includes("TL") && (
                questionData.question.includes("tane") || 
                questionData.question.includes("paket") || 
                questionData.question.includes("adet")
            )) ||
            // Günlük × gün sayısı deseni
            (questionData.question.includes("gün") && (
                questionData.question.includes("her gün") || 
                questionData.question.includes("günde")
            )) ||
            // Satır × sütun veya alan hesabı
            (questionData.question.includes("sıra") && questionData.question.includes("öğrenci"))
        );

        let prompt = "";
        if (isCorrect) {
            // Doğru cevap için prompt:
            prompt = `
DİKKAT: İlkokul 2. sınıf öğrencilerine konuşan bir öğretmensin. Sıcak, samimi ve doğal bir üslup kullan.

GÖREV: Öğrenci aşağıdaki soruya DOĞRU cevap verdi. Onu tebrik et ve cevabı kısa, doğal bir şekilde açıkla.

SORU: "${questionData.question}"
SEÇENEKLER:
${optionsText}
ÖĞRENCİNİN CEVABI: ${selectedAnswer} şıkkı (DOĞRU)

YANIT FORMATIN:
1. Cümle: "${randomCelebration}" diyerek başla.
2. Cümle: Doğru cevabı ve bu sonuca nasıl ulaşıldığını açıkla.

${hasMathematicalOperation ? `MATEMATİK KURALLARI:
- Robotik, tekrarlayan ifadeler kullanma ("Bu bir çarpma işlemidir" gibi)
- İşlemi doğal bir dille açıkla: "5 sırada 4'er öğrenci oturduğu için toplam 20 öğrenci var" gibi
- Hesaplamayı gösterirken doğal bir dil kullan: "8 TL'lik 5 paket çikolata alınca 40 TL ödenir"
- İşlemleri daima DOĞRU hesapla ve doğal bir dille anlat
- Çarpma işareti için "×" yerine yıldız (*) kullanma, "5 × 4" şeklinde yaz` : ""}

Yanıtını 2 cümleyle sınırla ve 100 karakteri geçme.
            `;
        } else {
            // Yanlış cevap için prompt:
            prompt = `
DİKKAT: İlkokul 2. sınıf öğrencilerine konuşan bir öğretmensin. Sıcak, samimi ve doğal bir üslup kullan.

GÖREV: Öğrenci aşağıdaki soruya YANLIŞ cevap verdi. Onu nazikçe cesaretlendir ve doğru cevabı açıkla.

SORU: "${questionData.question}"
SEÇENEKLER:
${optionsText}
ÖĞRENCİNİN CEVABI: ${selectedAnswer} şıkkı (YANLIŞ)
DOĞRU CEVAP: ${questionData.answer} şıkkı

YANIT FORMATIN:
1. Cümle: "${randomEncouragement}" diyerek başla.
2. Cümle: Doğru cevabı söyle.
3. Cümle: Doğru sonuca nasıl ulaşılacağını açıkla.

${hasMathematicalOperation ? `MATEMATİK KURALLARI:
- Robotik, tekrarlayan ifadeler kullanma ("Bu bir çarpma işlemidir" gibi)
- İşlemi doğal bir dille açıkla: "5 sırada 4'er öğrenci oturduğu için toplam 20 öğrenci var" gibi
- Hesaplamayı gösterirken doğal bir dil kullan: "8 TL'lik 5 paket çikolata alınca 40 TL ödenir"
- Öğrencinin yaptığı hatayı VE doğru yaklaşımı açıkla, ama asla yanlış matematiksel bilgi verme
- Çarpma işareti için "×" yerine yıldız (*) kullanma, "5 × 4" şeklinde yaz
${isMultiplication ? `- Bu soru için doğru yaklaşım: ÇARPMA işlemi gerekiyor, toplama değil` : ""}` : ""}

Yanıtını 3 cümleyle sınırla ve 150 karakteri geçme.
            `;
        }

        // API isteği yap
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://2-sinif.vercel.app",
                "X-Title": "2Sinif Quiz App",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": OPENROUTER_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": `Sen ilkokul 2. sınıf öğretmenisin. 7-8 yaş seviyesinde, sıcak ve doğal bir dille açıklamalar yaparsın.
${hasMathematicalOperation ? `Matematik açıklamalarında şu kurallara uyarsın:
1. Doğal ve akıcı bir dil kullanırsın, robotik ifadelerden kaçınırsın
2. Hesaplamaları örneklerle açıklarsın (örn. "5 sıranın her birinde 4 öğrenci olduğunda, toplamda 5 × 4 = 20 öğrenci olur")
3. Çarpma işlemi gereken yerde toplama işlemi kullanmaz, sonuçları daima doğru hesaplarsın
4. Matematiksel ifadeleri kesinlikle doğru kullanırsın ama doğal bir dille anlatırsın
5. İşlem türleri hakkında çelişkili bilgiler vermezsin
6. ASLA "bu toplama işlemidir" demek yerine "Ali'nin 5 paketi için toplam 40 TL öder" gibi doğal ifadeler kullanırsın` : `Dil bilgisi kurallarını çok iyi bilirsin. İlkokul seviyesinde açıklamalar yaparsın.`}`
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ],
                "temperature": 0.15,
                "max_tokens": 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenRouter API hatası:", errorData);
            throw new Error(`OpenRouter API hatası: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            console.error("API yanıtı beklenen formatta değil:", data);
            if (isCorrect) {
                const backupCelebration = CELEBRATION_PHRASES[Math.floor(Math.random() * CELEBRATION_PHRASES.length)];
                return `${backupCelebration} ${questionData.answer} şıkkı doğru cevap.`;
            } else {
                const backupEncouragement = ENCOURAGEMENT_PHRASES[Math.floor(Math.random() * ENCOURAGEMENT_PHRASES.length)];
                return `${backupEncouragement} Doğru cevap ${questionData.answer} şıkkı.`;
            }
        }
        
        // API yanıtından içeriği çıkar
        let content = "";
        if (typeof data.choices[0].message.content === "string") {
            content = data.choices[0].message.content;
        } else if (Array.isArray(data.choices[0].message.content)) {
            const textContent = data.choices[0].message.content.find(item => item.type === "text");
            if (textContent && textContent.text) {
                content = textContent.text;
            }
        }
        
        // Özel durumlar için kontrol
        if (hasMathematicalOperation) {
            // Çikolata sorusu için özel kontrol
            if (questionData.question.toLowerCase().includes("çikolata") && 
                questionData.question.toLowerCase().includes("tl") &&
                questionData.question.toLowerCase().includes("5 paket")) {
                
                if (!isCorrect) {
                    // Seçilen cevap yanlış ise
                    if (selectedAnswer === "A") { // 35 TL
                        return `${randomEncouragement} Doğru cevap B şıkkı (40 TL). Her paket 8 TL olduğundan, 5 paket için 8 TL × 5 = 40 TL ödenir.`;
                    } else if (selectedAnswer === "C") { // 13 TL
                        return `${randomEncouragement} Doğru cevap B şıkkı (40 TL). 5 paket çikolata için toplam tutar 8 TL × 5 = 40 TL olur.`;
                    } else if (selectedAnswer === "D") { // 45 TL
                        return `${randomEncouragement} Doğru cevap B şıkkı (40 TL). 5 paket çikolatanın toplam tutarı 8 TL × 5 = 40 TL'dir.`;
                    } else {
                        return `${randomEncouragement} Doğru cevap B şıkkı (40 TL). 5 paket çikolata için 8 TL × 5 = 40 TL ödenir.`;
                    }
                } else {
                    return `${randomCelebration} Her paket 8 TL olduğundan, 5 paket için toplam 8 TL × 5 = 40 TL ödenir.`;
                }
            }
            
            // Günlük kitap okuma sorusu için özel kontrol
            if (questionData.question.toLowerCase().includes("kitap oku") && 
                questionData.question.toLowerCase().includes("sayfa") &&
                questionData.question.toLowerCase().includes("gün")) {
                
                if (!isCorrect) {
                    return `${randomEncouragement} Doğru cevap C şıkkı (28 sayfa). Her gün 4 sayfa okursa, 7 günde toplam 4 sayfa × 7 = 28 sayfa okur.`;
                } else {
                    return `${randomCelebration} Her gün 4 sayfa okursan, 7 günde toplam 4 sayfa × 7 = 28 sayfa okumuş olursun.`;
                }
            }

            // Öğrenci sırası sorusu için özel kontrol
            if (questionData.question.toLowerCase().includes("sıra") && 
                questionData.question.toLowerCase().includes("öğrenci")) {
                
                if (!isCorrect) {
                    return `${randomEncouragement} Doğru cevap A şıkkı (20 öğrenci). 5 sıranın her birinde 4 öğrenci oturduğundan, toplam 5 × 4 = 20 öğrenci var.`;
                } else {
                    return `${randomCelebration} 5 sıranın her birinde 4 öğrenci oturduğundan, toplam 5 × 4 = 20 öğrenci var.`;
                }
            }
        }
        
        return content.trim();
    } catch (error) {
        console.error("AI açıklaması alınırken hata oluştu:", error);
        if (isCorrect) {
            const errorCelebration = CELEBRATION_PHRASES[Math.floor(Math.random() * CELEBRATION_PHRASES.length)];
            return `${errorCelebration} ${questionData.answer} şıkkı doğru cevap.`;
        } else {
            const errorEncouragement = ENCOURAGEMENT_PHRASES[Math.floor(Math.random() * ENCOURAGEMENT_PHRASES.length)];
            return `${errorEncouragement} Doğru cevap ${questionData.answer} şıkkı.`;
        }
    }
}

/**
 * ElevenLabs API kullanarak metni seslendirir.
 * @param {string} text - Seslendirilecek metin
 * @returns {Promise<ArrayBuffer>} - Ses verisini içeren ArrayBuffer
 */
async function textToSpeech(text) {
    try {
        // Metni sesli okumaya uygun hale getir
        const processedText = prepareTextForSpeech(text);
        
        // API anahtarlarından rastgele birini seç
        const randomApiKeyIndex = Math.floor(Math.random() * ELEVENLABS_API_KEYS.length);
        const selectedApiKey = ELEVENLABS_API_KEYS[randomApiKeyIndex];
        
        console.log(`ElevenLabs API isteği yapılıyor (API Anahtar #${randomApiKeyIndex + 1})`);
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
            method: "POST",
            headers: {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": selectedApiKey
            },
            body: JSON.stringify({
                "text": processedText,
                "model_id": ELEVENLABS_MODEL,
                "voice_settings": {
                    "stability": 0.40,
                    "similarity_boost": 0.75,
                    "use_speaker_boost": true,
                    "speed": 1.12  // Biraz daha hızlı konuşma (normal değer 1.0)
                }
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`ElevenLabs API hatası (API Anahtar #${randomApiKeyIndex + 1}):`, errorData);
            throw new Error(`ElevenLabs API hatası: ${errorData.message || response.statusText}`);
        }
        const audioData = await response.arrayBuffer();
        return audioData;
    } catch (error) {
        console.error("Metin seslendirilirken hata oluştu:", error);
        throw error;
    }
}

/**
 * Açıklamayı seslendir ve çal.
 * @param {string} explanation - Seslendirilecek açıklama metni
 * @returns {Promise<HTMLAudioElement>} - Oluşturulan audio elementi
 */
async function speakExplanation(explanation) {
    try {
        const audioData = await textToSpeech(explanation);
        const blob = new Blob([audioData], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };
        return audio;
    } catch (error) {
        console.error("Açıklama seslendirilirken hata oluştu:", error);
        return null;
    }
}

// Servisleri dışa aktar
window.QuizServices = {
    getQuestionExplanation,
    speakExplanation
};
